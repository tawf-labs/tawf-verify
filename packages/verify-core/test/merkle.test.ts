import { keccak256 } from "viem";
import { describe, expect, it } from "vitest";
import { EmptyBatchError } from "../src/errors.js";
import {
  buildMerkleTree,
  generateProof,
  hashLeafNode,
  hashPairNode,
  walkProof,
} from "../src/merkle.js";
import type { Hex } from "../src/types.js";

function fakeHash(n: number): Hex {
  return keccak256(("0x" + n.toString(16).padStart(64, "0")) as Hex);
}

describe("merkle", () => {
  it("throws EmptyBatchError on zero leaves", () => {
    expect(() => buildMerkleTree([])).toThrow(EmptyBatchError);
  });

  it("single leaf: root equals the leaf hash, empty proof", () => {
    const h = fakeHash(1);
    const tree = buildMerkleTree([h]);
    expect(tree.root).toBe(hashLeafNode(h));
    expect(generateProof(tree, 0)).toEqual([]);
  });

  it("hashPairNode is commutative (sorted-pair ordering)", () => {
    const a = fakeHash(1);
    const b = fakeHash(2);
    expect(hashPairNode(a, b)).toBe(hashPairNode(b, a));
  });

  it("even leaf count: every leaf's proof verifies to the same root", () => {
    const hashes = [fakeHash(1), fakeHash(2), fakeHash(3), fakeHash(4)];
    const tree = buildMerkleTree(hashes);
    hashes.forEach((h, i) => {
      const proof = generateProof(tree, i);
      expect(walkProof(hashLeafNode(h), proof)).toBe(tree.root);
    });
  });

  it("odd leaf count promotes the last node unchanged at the first level", () => {
    const hashes = [fakeHash(1), fakeHash(2), fakeHash(3)];
    const tree = buildMerkleTree(hashes);
    // level 0 has 3 leaves -> level 1 has ceil(3/2) = 2 nodes: pair(0,1), promoted(2)
    expect(tree.levels[1][1]).toBe(tree.levels[0][2]);
    hashes.forEach((h, i) => {
      const proof = generateProof(tree, i);
      expect(walkProof(hashLeafNode(h), proof)).toBe(tree.root);
    });
    // the promoted leaf's proof has one fewer step than a paired leaf's
    expect(generateProof(tree, 2).length).toBe(generateProof(tree, 0).length - 1);
  });

  it("multi-level odd promotion (5 leaves: 5 -> 3 -> 2 -> 1) verifies for every leaf", () => {
    const hashes = [1, 2, 3, 4, 5].map(fakeHash);
    const tree = buildMerkleTree(hashes);
    hashes.forEach((h, i) => {
      const proof = generateProof(tree, i);
      expect(walkProof(hashLeafNode(h), proof)).toBe(tree.root);
    });
  });

  it("same two leaves in reverse order produce an identical root (commutativity end to end)", () => {
    const a = fakeHash(10);
    const b = fakeHash(20);
    const rootAB = buildMerkleTree([a, b]).root;
    const rootBA = buildMerkleTree([b, a]).root;
    expect(rootAB).toBe(rootBA);
  });

  it("a corrupted proof step fails to reproduce the root", () => {
    const hashes = [fakeHash(1), fakeHash(2), fakeHash(3), fakeHash(4)];
    const tree = buildMerkleTree(hashes);
    const proof = generateProof(tree, 0);
    const corrupted = [fakeHash(999), ...proof.slice(1)];
    expect(walkProof(hashLeafNode(hashes[0]), corrupted)).not.toBe(tree.root);
  });

  it("generateProof rejects an out-of-range leafIndex", () => {
    const tree = buildMerkleTree([fakeHash(1)]);
    expect(() => generateProof(tree, 5)).toThrow(RangeError);
    expect(() => generateProof(tree, -1)).toThrow(RangeError);
  });
});
