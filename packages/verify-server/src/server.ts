import { buildProofBundle, recomputeRecordHash, verifyProof } from "@tawf/verify-core";
import type { CanonicalRecord, ChainReader, ProofBundle, VerifyResult } from "@tawf/verify-core";
import { concat, sha256, stringToHex, type Hex as ViemHex } from "viem";
import { createMockAnchorClient, type AnchorClient } from "./anchorClient.js";
import { prepareBatch } from "./batcher.js";
import { createViemChainReader } from "./chainReader.js";
import { NotAnchoredYetError, RecordNotFoundError } from "./errors.js";
import { InMemoryOutbox } from "./outbox.js";
import type {
  AuditReport,
  AuditRow,
  BatchResult,
  RecordInput,
  RecordResult,
  TawfVerifyConfig,
} from "./types.js";

/** prd.md Section 11.1's `counterpartyRef = sha256(orgSalt || donorInternalId)` — note this is
 * SHA-256, deliberately a different hash function from the keccak256 used everywhere else in
 * the leaf/Merkle path, so counterpartyRef can never be confused with an on-chain-hashable
 * value even by accident. */
function hashCounterparty(orgSalt: string, donorInternalId: string): string {
  const salted = concat([orgSalt as ViemHex, stringToHex(donorInternalId)]);
  return `sha256:${sha256(salted).slice(2)}`;
}

function toCanonicalRecord(orgId: string, input: RecordInput, orgSalt: string): CanonicalRecord {
  const occurredAt =
    input.occurredAt instanceof Date ? input.occurredAt.toISOString() : input.occurredAt;
  // Optional fields must be OMITTED, not set to `key: undefined` — canonicalize.ts's JCS
  // implementation has no representation for a present key with an undefined value and
  // rejects it outright (by design: JSON.stringify would otherwise silently drop it, which is
  // exactly the kind of silent divergence Section 8.3 treats as a release blocker).
  return {
    schema: "tawf.verify.record.v1",
    type: input.type,
    orgId,
    recordId: input.recordId,
    occurredAt,
    amount: input.amount,
    ...(input.instrument !== undefined && { instrument: input.instrument }),
    ...(input.channel !== undefined && { channel: input.channel }),
    ...(input.campaignId !== undefined && { campaignId: input.campaignId }),
    ...(input.donorInternalId !== undefined && {
      counterpartyRef: hashCounterparty(orgSalt, input.donorInternalId),
    }),
    ...(input.externalRefs !== undefined && { externalRefs: input.externalRefs }),
    ...(input.attachments !== undefined && { attachments: input.attachments }),
    ...(input.meta !== undefined && { meta: input.meta }),
  };
}

/**
 * prd.md Section 11.1. Real record buffering + Merkle batching (via @tawf/verify-core); mocked
 * chain submission (see anchorClient.ts) and a stub audit(). verifyRecord() is fully real end
 * to end. See README.md in this package for the exact real/mocked boundary.
 */
export class TawfVerify {
  private readonly config: TawfVerifyConfig;
  private readonly outbox = new InMemoryOutbox();
  private readonly anchorClient: AnchorClient;

  constructor(config: TawfVerifyConfig) {
    this.config = config;
    this.anchorClient = createMockAnchorClient(config);
  }

  /** Idempotent: calling record() twice with the same recordId returns the existing leaf
   * rather than creating a duplicate (prd.md Section 15). Never throws on relayer
   * unavailability — this mock has no relayer to be unavailable, but a real implementation
   * must preserve this: recording writes to the outbox and returns success even if the batch
   * scheduler is unreachable. */
  async record(input: RecordInput): Promise<RecordResult> {
    const existing = this.outbox.get(input.recordId);
    if (existing) {
      return { recordId: input.recordId, leaf: existing.leaf, status: existing.status };
    }

    const canonical = toCanonicalRecord(this.config.orgId, input, this.config.orgSalt);
    const leaf = recomputeRecordHash(canonical, this.config.orgSalt);
    this.outbox.set(input.recordId, { input, leaf, status: "pending" });

    return { recordId: input.recordId, leaf, status: "pending" };
  }

  /** Throws NotAnchoredYetError while pending, per prd.md Section 11.1. */
  async getProof(recordId: string): Promise<ProofBundle> {
    const entry = this.outbox.get(recordId);
    if (!entry) throw new RecordNotFoundError(recordId);
    if (entry.status === "pending" || !entry.proof) throw new NotAnchoredYetError(recordId);
    return entry.proof;
  }

  /** Forces an anchor now over every currently-pending record for this org. prd.md Section
   * 7.3 frames the single-record version of this (`anchorNow`) as "an expensive escape
   * hatch, not a default" — the cost model doesn't change here since this stub doesn't
   * charge gas, but the shape matches so a real anchorClient slots in without an API change. */
  async flushBatch(): Promise<BatchResult> {
    const pending = this.outbox.pending();
    const records = pending.map(([, entry]) =>
      toCanonicalRecord(this.config.orgId, entry.input, this.config.orgSalt),
    );
    const { tree, leaves, orgIdHash } = prepareBatch(records, this.config.orgSalt);

    const anchor = await this.anchorClient.submitBatch({
      orgIdHash,
      root: tree.root,
      leafCount: leaves.length,
      seqStart: 0,
      uri: "",
    });

    leaves.forEach((_leaf, index) => {
      const [recordId, entry] = pending[index];
      const proof = buildProofBundle(tree, leaves, index, anchor);
      this.outbox.set(recordId, { ...entry, status: "anchored", proof });
    });

    return { batchId: anchor.batchId, root: tree.root, count: leaves.length };
  }

  /** The expensive escape hatch from prd.md Section 7.3: anchors exactly one record right now,
   * as its own batch of size one, instead of waiting for the scheduled cadence. */
  async anchorNow(recordId: string): Promise<RecordResult> {
    const entry = this.outbox.get(recordId);
    if (!entry) throw new RecordNotFoundError(recordId);
    if (entry.status === "anchored") return { recordId, leaf: entry.leaf, status: "anchored" };

    const record = toCanonicalRecord(this.config.orgId, entry.input, this.config.orgSalt);
    const { tree, leaves, orgIdHash } = prepareBatch([record], this.config.orgSalt);
    const anchor = await this.anchorClient.submitBatch({
      orgIdHash,
      root: tree.root,
      leafCount: 1,
      seqStart: 0,
      uri: "",
    });
    const proof = buildProofBundle(tree, leaves, 0, anchor);
    this.outbox.set(recordId, { ...entry, status: "anchored", proof });

    return { recordId, leaf: entry.leaf, status: "anchored" };
  }

  /** Real end to end: builds a viem-backed chain reader when rpcUrl+registry are configured,
   * and delegates to @tawf/verify-core's real verifyProof. */
  async verifyRecord(recordId: string, opts?: { rpcUrl?: string }): Promise<VerifyResult> {
    const bundle = await this.getProof(recordId);
    const rpcUrl = opts?.rpcUrl ?? this.config.rpcUrl;
    const chainReader: ChainReader | undefined =
      rpcUrl && this.config.registry
        ? createViemChainReader({ rpcUrl, registry: this.config.registry })
        : undefined;
    return verifyProof(bundle, { chainReader });
  }

  /** Structural stub: real shape, computed against the in-memory outbox rather than a real
   * chain scan. A real implementation additionally reads `nextSeq[orgIdHash]` on chain to
   * populate `gaps` (prd.md Section 9's "monotonic per-org sequence numbers" mitigation). */
  async audit(rows: AuditRow[]): Promise<AuditReport> {
    let verified = 0;
    let missing = 0;
    let mismatched = 0;

    for (const row of rows) {
      const entry = this.outbox.get(row.recordId);
      if (!entry) {
        missing++;
        continue;
      }
      const record = toCanonicalRecord(this.config.orgId, entry.input, this.config.orgSalt);
      const recomputed = recomputeRecordHash(record, this.config.orgSalt);
      if (recomputed !== entry.leaf) {
        mismatched++;
        continue;
      }
      verified++;
    }

    return { total: rows.length, verified, missing, mismatched, gaps: [] };
  }

  /** Opaque short link, per prd.md Section 12.1 (`https://verify.tawf.app/r/8Kq2nT`). A real
   * implementation looks this slug up against a lookup table rather than deriving it from
   * recordId directly — deriving it would make recordIds guessable/enumerable from the public
   * URL, which is exactly the kind of leak Section 9's privacy model exists to prevent. This
   * stub returns a plain (non-opaque) URL for local development only. */
  verifyUrl(recordId: string): string {
    return `https://verify.tawf.app/r/${encodeURIComponent(recordId)}`;
  }
}
