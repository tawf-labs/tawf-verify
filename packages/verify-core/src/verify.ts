import { hashOrgId, hashPayload, toUnixSeconds } from "./hash.js";
import { computeLeafRecordHash } from "./hash.js";
import { SCHEMA_ID } from "./hash.js";
import { hashLeafNode, walkProof } from "./merkle.js";
import type { ChainReader, ProofBundle, VerifyResult } from "./types.js";

/**
 * prd.md Appendix B: "Trusting the supplied leaf rather than recomputing it from the record
 * turns the whole verifier into theatre, because an attacker could then present any record
 * they liked alongside a genuine leaf." Every field of `bundle.leaf` is recomputed from
 * `bundle.record` here - nothing about the leaf is ever taken on faith except
 * `bundle.recordIdHash`, which a public verifier structurally cannot re-derive without the
 * operator's org salt (see the note on ProofBundle.recordIdHash in types.ts).
 *
 * Resolves the tension between Section 6.1 ("verify-core... zero network calls, zero chain
 * dependency") and Appendix B step 3 (which needs a chain read to confirm the root was
 * actually published): steps 1-2 below are pure and dependency-free. Step 3 only runs if the
 * caller supplies a `chainReader` - verify-core itself never instantiates one. Callers that
 * want online confirmation (verify-server, the CLI's `check` command) build a real
 * viem-backed reader from an rpcUrl; an auditor working offline can build one backed by a
 * cached block header instead (Section 15).
 */
export async function verifyProof(
  bundle: ProofBundle,
  opts?: { chainReader?: ChainReader },
): Promise<VerifyResult> {
  // Step 1: recompute the leaf from the record. Never trust bundle.leaf.
  const orgIdHash = hashOrgId(bundle.record.orgId);
  const payloadHash = hashPayload(bundle.record);
  const occurredAt = toUnixSeconds(bundle.record.occurredAt);

  const recomputedLeaf = computeLeafRecordHash({
    schemaId: SCHEMA_ID,
    orgIdHash,
    recordIdHash: bundle.recordIdHash,
    payloadHash,
    occurredAt,
  });

  if (recomputedLeaf !== bundle.leaf) {
    return { status: "invalid", reasons: ["leaf_mismatch"] };
  }

  // Step 2: walk the Merkle path.
  const computedRoot = walkProof(hashLeafNode(recomputedLeaf), bundle.proof);
  if (computedRoot !== bundle.root) {
    return { status: "invalid", reasons: ["root_mismatch"] };
  }

  if (!opts?.chainReader) {
    return { status: "structurally_valid_unconfirmed" };
  }

  // Step 3: confirm the root was actually published on chain.
  const onChain = await opts.chainReader(bundle.anchor.batchId);
  const reasons: string[] = [];
  if (onChain.root !== bundle.root) reasons.push("chain_root_mismatch");
  if (onChain.orgIdHash !== orgIdHash) reasons.push("chain_org_mismatch");
  if (reasons.length > 0) {
    return { status: "invalid", reasons };
  }

  return { status: "valid", anchoredAt: new Date(onChain.timestamp * 1000) };
}
