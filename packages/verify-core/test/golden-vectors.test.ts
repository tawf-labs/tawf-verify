import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PIIRejectedError } from "../src/errors.js";
import { hashPayload } from "../src/hash.js";
import { generateProof } from "../src/merkle.js";
import { buildAnchorTree, prepareLeaves } from "../src/proof.js";
import { computeFieldCommitment } from "../src/redaction.js";
import type { CanonicalRecord, Hex } from "../src/types.js";

/**
 * prd.md Section 15: "the test vector suite is a release blocker rather than a nice-to-have."
 * These vectors are frozen fixtures - a change to canonicalize.ts/hash.ts/merkle.ts that
 * breaks any of these is a determinism-breaking change, full stop. Do not edit a vector to
 * make a code change pass; that's exactly the failure mode this suite exists to catch.
 */

const vectorsDir = join(dirname(fileURLToPath(import.meta.url)), "vectors");

interface Vector {
  description: string;
  orgSalt: Hex;
  records: CanonicalRecord[];
  expected?: {
    recordHashes: Hex[];
    root: Hex;
    proofs: { leafIndex: number; path: Hex[] }[];
  };
  expectRejection?: { errorType: "PIIRejectedError" };
  redaction?: { field: string; salt: Hex; expectedCommitment: Hex };
  reversedOrderRootForCrossCheck?: Hex;
}

function loadVector(name: string): Vector {
  return JSON.parse(readFileSync(join(vectorsDir, name), "utf-8")) as Vector;
}

const REQUIRED_VECTORS = [
  "single-leaf.json",
  "odd-leaf-count.json",
  "sorted-pair-ordering.json",
  "pii-rejection.json",
  "redaction-commitment.json",
];

describe("golden vectors", () => {
  const files = readdirSync(vectorsDir).filter((f) => f.endsWith(".json"));

  it("seeds every required vector", () => {
    expect(files.sort()).toEqual([...REQUIRED_VECTORS].sort());
  });

  for (const file of files) {
    const vector = loadVector(file);

    it(`${file}: ${vector.description}`, () => {
      if (vector.expectRejection) {
        expect(() => prepareLeaves(vector.records, vector.orgSalt)).toThrow(PIIRejectedError);
        return;
      }

      const leaves = prepareLeaves(vector.records, vector.orgSalt);

      if (!vector.expected) {
        // redaction-commitment.json doesn't assert tree shape, only the field commitment below.
        return;
      }

      expect(leaves.map((l) => l.recordHash)).toEqual(vector.expected.recordHashes);

      const tree = buildAnchorTree(leaves);
      expect(tree.root).toBe(vector.expected.root);

      for (const { leafIndex, path } of vector.expected.proofs) {
        expect(generateProof(tree, leafIndex)).toEqual(path);
      }

      if (vector.reversedOrderRootForCrossCheck) {
        const reversedLeaves = prepareLeaves([...vector.records].reverse(), vector.orgSalt);
        const reversedTree = buildAnchorTree(reversedLeaves);
        expect(reversedTree.root).toBe(vector.reversedOrderRootForCrossCheck);
        expect(reversedTree.root).toBe(tree.root);
      }
    });
  }

  it("redaction-commitment.json: field commitment matches the frozen expected value", () => {
    const vector = loadVector("redaction-commitment.json");
    expect(vector.redaction).toBeDefined();
    const { field, salt, expectedCommitment } = vector.redaction!;
    const value = (vector.records[0] as unknown as Record<string, { region?: string }>).meta?.[
      field as "region"
    ];
    expect(computeFieldCommitment(salt, value as never)).toBe(expectedCommitment);
  });

  it("redaction-commitment.json: hashPayload still succeeds on the pre-redaction record", () => {
    const vector = loadVector("redaction-commitment.json");
    expect(() => hashPayload(vector.records[0])).not.toThrow();
  });
});
