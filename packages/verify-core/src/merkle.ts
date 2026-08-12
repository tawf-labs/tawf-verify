import { concat, keccak256 } from "viem";
import { EmptyBatchError } from "./errors.js";
import type { Hex, MerkleTree, ProofStep } from "./types.js";

/** Domain-separation prefixes - prd.md Section 8.5: "closes second-preimage attacks where an
 * internal node is replayed as a leaf." */
const LEAF_PREFIX: Hex = "0x00";
const NODE_PREFIX: Hex = "0x01";

/** Wraps a raw record hash into the leaf layer of the tree. */
export function hashLeafNode(recordHash: Hex): Hex {
  return keccak256(concat([LEAF_PREFIX, recordHash]));
}

/**
 * Combines two nodes with sorted-pair ordering (`hash(min(a,b) || max(a,b))`), per
 * prd.md Section 8.5 - this is what removes the need for a left/right direction bit in a
 * proof: the combination is commutative, so a verifier only ever needs the sibling value,
 * never its position.
 */
export function hashPairNode(a: Hex, b: Hex): Hex {
  const [lo, hi] = BigInt(a) <= BigInt(b) ? [a, b] : [b, a];
  return keccak256(concat([NODE_PREFIX, lo, hi]));
}

/**
 * Binary Merkle tree over pre-hashed record hashes. An odd node at any level is promoted
 * unchanged to the next level rather than paired with itself - self-pairing (duplicating the
 * last leaf) is the classic Merkle forgery bug this design deliberately avoids.
 */
export function buildMerkleTree(recordHashes: Hex[]): MerkleTree {
  if (recordHashes.length === 0) {
    throw new EmptyBatchError();
  }

  let level: Hex[] = recordHashes.map(hashLeafNode);
  const levels: Hex[][] = [level];

  while (level.length > 1) {
    const next: Hex[] = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(i + 1 < level.length ? hashPairNode(level[i], level[i + 1]) : level[i]);
    }
    level = next;
    levels.push(level);
  }

  return { root: level[0], levels };
}

/**
 * Builds the inclusion proof for the leaf at `leafIndex`. A level where that node was
 * promoted unchanged (no sibling) contributes no proof step - verifyProof's walk simply
 * leaves the running hash unchanged for that level too, which is what makes the two
 * procedures agree without needing to encode "promoted" explicitly (see prd.md Appendix B).
 */
export function generateProof(tree: MerkleTree, leafIndex: number): ProofStep[] {
  if (leafIndex < 0 || leafIndex >= tree.levels[0].length) {
    throw new RangeError(
      `leafIndex ${leafIndex} out of range for a tree with ${tree.levels[0].length} leaves`,
    );
  }

  const proof: ProofStep[] = [];
  let index = leafIndex;

  for (let level = 0; level < tree.levels.length - 1; level++) {
    const currentLevel = tree.levels[level];
    const isRightNode = index % 2 === 1;
    const siblingIndex = isRightNode ? index - 1 : index + 1;

    if (siblingIndex < currentLevel.length) {
      proof.push(currentLevel[siblingIndex]);
    }

    index = Math.floor(index / 2);
  }

  return proof;
}

/** Walks a proof path from a leaf hash up to a root, per prd.md Section 8.5 / Appendix B. */
export function walkProof(leafNode: Hex, proof: ProofStep[]): Hex {
  return proof.reduce<Hex>((current, sibling) => hashPairNode(current, sibling), leafNode);
}
