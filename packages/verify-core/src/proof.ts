import { hashRecordId, recomputeRecordHash } from "./hash.js";
import { buildMerkleTree, generateProof } from "./merkle.js";
import type { AnchorInfo, CanonicalRecord, Hex, MerkleTree, ProofBundle } from "./types.js";

export interface PreparedLeaf {
  record: CanonicalRecord;
  recordIdHash: Hex;
  recordHash: Hex;
}

/**
 * Turns a batch of canonical records into leaf hashes ready for `buildMerkleTree`, in the
 * same order as the input (leaf index == array index - batchers must keep this ordering
 * consistent, since it's what `generateProof` indexes into).
 */
export function prepareLeaves(records: CanonicalRecord[], orgSalt: Hex): PreparedLeaf[] {
  return records.map((record) => ({
    record,
    recordIdHash: hashRecordId(orgSalt, record.recordId),
    recordHash: recomputeRecordHash(record, orgSalt),
  }));
}

export function buildAnchorTree(leaves: PreparedLeaf[]): MerkleTree {
  return buildMerkleTree(leaves.map((leaf) => leaf.recordHash));
}

/** Assembles the exact bundle a donor receives (prd.md Section 8.6), for one record in an
 * already-built batch. */
export function buildProofBundle(
  tree: MerkleTree,
  leaves: PreparedLeaf[],
  leafIndex: number,
  anchor: AnchorInfo,
): ProofBundle {
  const leaf = leaves[leafIndex];
  if (!leaf) {
    throw new RangeError(
      `leafIndex ${leafIndex} out of range for a batch of ${leaves.length} leaves`,
    );
  }
  return {
    schema: "tawf.verify.proof.v1",
    record: leaf.record,
    recordIdHash: leaf.recordIdHash,
    leaf: leaf.recordHash,
    proof: generateProof(tree, leafIndex),
    root: tree.root,
    anchor,
  };
}
