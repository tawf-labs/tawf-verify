import { buildAnchorTree, hashOrgId, prepareLeaves } from "@tawf/verify-core";
import type { CanonicalRecord, Hex, MerkleTree } from "@tawf/verify-core";
import { EmptyOutboxError } from "./errors.js";

export interface PreparedBatch {
  tree: MerkleTree;
  leaves: ReturnType<typeof prepareLeaves>;
  orgIdHash: Hex;
}

/** Builds a Merkle tree over a set of pending canonical records. Real logic from
 * @tawf/verify-core - nothing mocked here, only anchorClient.ts (submission) is a stub. */
export function prepareBatch(records: CanonicalRecord[], orgSalt: Hex): PreparedBatch {
  if (records.length === 0) {
    throw new EmptyOutboxError();
  }
  const leaves = prepareLeaves(records, orgSalt);
  const tree = buildAnchorTree(leaves);
  return { tree, leaves, orgIdHash: hashOrgId(records[0].orgId) };
}
