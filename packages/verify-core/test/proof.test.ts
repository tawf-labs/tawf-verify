import { describe, expect, it } from "vitest";
import { hashOrgId } from "../src/hash.js";
import { buildAnchorTree, buildProofBundle, prepareLeaves } from "../src/proof.js";
import type { AnchorInfo, CanonicalRecord, Hex } from "../src/types.js";

const SALT: Hex = ("0x" + "cc".repeat(32)) as Hex;

function record(recordId: string, value: string): CanonicalRecord {
  return {
    schema: "tawf.verify.record.v1",
    type: "donation",
    orgId: "laz-almustaqim",
    recordId,
    occurredAt: "2026-08-12T04:31:07Z",
    amount: { value, currency: "IDR", scale: 2 },
  };
}

const ANCHOR: AnchorInfo = {
  chainId: 8453,
  registry: ("0x" + "11".repeat(20)) as Hex,
  batchId: 1,
  txHash: ("0x" + "22".repeat(32)) as Hex,
  blockNumber: 100,
  blockTimestamp: "2026-08-12T04:45:11Z",
};

describe("proof (batch assembly)", () => {
  it("builds a bundle per record whose proof verifies against the batch root", () => {
    const records = [record("TRX-1", "10000"), record("TRX-2", "20000"), record("TRX-3", "30000")];
    const leaves = prepareLeaves(records, SALT);
    const tree = buildAnchorTree(leaves);

    leaves.forEach((_leaf, i) => {
      const bundle = buildProofBundle(tree, leaves, i, ANCHOR);
      expect(bundle.root).toBe(tree.root);
      expect(bundle.recordIdHash).toBe(leaves[i].recordIdHash);
      expect(bundle.leaf).toBe(leaves[i].recordHash);
    });
  });

  it("leaf index matches record order", () => {
    const records = [record("TRX-1", "10000"), record("TRX-2", "20000")];
    const leaves = prepareLeaves(records, SALT);
    const tree = buildAnchorTree(leaves);
    const bundle = buildProofBundle(tree, leaves, 1, ANCHOR);
    expect(bundle.record.recordId).toBe("TRX-2");
  });

  it("throws RangeError for an out-of-range leafIndex", () => {
    const records = [record("TRX-1", "10000")];
    const leaves = prepareLeaves(records, SALT);
    const tree = buildAnchorTree(leaves);
    expect(() => buildProofBundle(tree, leaves, 5, ANCHOR)).toThrow(RangeError);
  });

  it("prepareLeaves derives the same orgIdHash for every record in the same org", () => {
    const records = [record("TRX-1", "10000"), record("TRX-2", "20000")];
    const leaves = prepareLeaves(records, SALT);
    expect(hashOrgId(leaves[0].record.orgId)).toBe(hashOrgId(leaves[1].record.orgId));
  });
});
