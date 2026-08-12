export type Hex = `0x${string}`;

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONValue[] | { [key: string]: JSONValue };

/** prd.md Section 8.1 — deliberately small and closed in v1. */
export type RecordType = "donation" | "disbursement" | "allocation" | "expense" | "attestation";

/** prd.md Section 8.2 — canonical record, the input to the SDK. */
export interface CanonicalRecord {
  schema: "tawf.verify.record.v1";
  type: RecordType;
  orgId: string;
  recordId: string;
  /** RFC3339, UTC, second precision. */
  occurredAt: string;
  amount: { value: string; currency: string; scale: number };
  instrument?: string;
  channel?: string;
  campaignId?: string;
  /** Pre-hashed by the SDK before this record is ever constructed. Never raw identity. */
  counterpartyRef?: string;
  externalRefs?: Record<string, string>;
  attachments?: { name: string; sha256: string }[];
  meta?: Record<string, JSONValue>;
}

/** prd.md Section 8.4 — the 5-tuple that gets abi.encode'd and keccak256'd into a leaf. */
export interface LeafInputs {
  schemaId: Hex;
  orgIdHash: Hex;
  recordIdHash: Hex;
  payloadHash: Hex;
  occurredAt: number; // unix seconds, uint64
}

/** One step of a Merkle inclusion proof: the sibling to combine with at that level.
 * A level where this node was promoted unchanged (odd node, no pair) contributes no step —
 * see merkle.ts. */
export type ProofStep = Hex;

export interface MerkleTree {
  root: Hex;
  /** levels[0] is the leaf-hash layer (post hashLeafNode), levels[last] is [root]. */
  levels: Hex[][];
}

/** prd.md Section 8.6 — what the donor receives. */
export interface AnchorInfo {
  chainId: number;
  registry: Hex;
  batchId: number;
  txHash: Hex;
  blockNumber: number;
  blockTimestamp: string;
}

export interface ProofBundle {
  schema: "tawf.verify.proof.v1";
  record: CanonicalRecord;
  /**
   * keccak256(orgSalt || recordId) — prd.md Section 8.4. A public verifier never holds
   * orgSalt, so this cannot be re-derived from `record` alone; it must travel with the
   * bundle. This is safe to disclose to whoever already holds the bundle for this specific
   * record (the salt's job is to stop an outsider from computing it for a *guessed*
   * recordId and correlating across records, not to hide it from the record's own donor).
   */
  recordIdHash: Hex;
  leaf: Hex;
  proof: ProofStep[];
  root: Hex;
  anchor: AnchorInfo;
}

/** What TawfVerifyRegistry.batches(batchId) returns on chain — see contracts/src/TawfVerifyRegistry.sol. */
export interface OnChainBatch {
  root: Hex;
  orgIdHash: Hex;
  timestamp: number;
}

/** Caller-supplied chain read, injected so verify-core never depends on a chain client itself.
 * verify-server / the CLI build a real viem-backed implementation from an rpcUrl; an auditor
 * working offline can build one backed by a cached block header (prd.md Section 15). */
export type ChainReader = (batchId: number) => Promise<OnChainBatch>;

export type VerifyResult =
  | { status: "valid"; anchoredAt: Date }
  | { status: "structurally_valid_unconfirmed" }
  | { status: "invalid"; reasons: string[] };

/** prd.md Section 9 — field-level redaction commitments. */
export interface FieldCommitment {
  __redacted: true;
  commitment: Hex;
}
