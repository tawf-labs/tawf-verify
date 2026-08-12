import { describe, expect, it } from "vitest";
import { hashOrgId } from "../src/hash.js";
import { buildAnchorTree, buildProofBundle, prepareLeaves } from "../src/proof.js";
import type { AnchorInfo, CanonicalRecord, ChainReader, Hex, ProofBundle } from "../src/types.js";
import { verifyProof } from "../src/verify.js";

const SALT: Hex = ("0x" + "dd".repeat(32)) as Hex;

const RECORD: CanonicalRecord = {
  schema: "tawf.verify.record.v1",
  type: "donation",
  orgId: "laz-almustaqim",
  recordId: "TRX-2026-08-000184213",
  occurredAt: "2026-08-12T04:31:07Z",
  amount: { value: "500000", currency: "IDR", scale: 2 },
};

const ANCHOR: AnchorInfo = {
  chainId: 8453,
  registry: ("0x" + "11".repeat(20)) as Hex,
  batchId: 4471,
  txHash: ("0x" + "22".repeat(32)) as Hex,
  blockNumber: 100,
  blockTimestamp: "2026-08-12T04:45:11Z",
};

function makeBundle(records: CanonicalRecord[], index: number): ProofBundle {
  const leaves = prepareLeaves(records, SALT);
  const tree = buildAnchorTree(leaves);
  return buildProofBundle(tree, leaves, index, ANCHOR);
}

describe("verifyProof", () => {
  it("returns structurally_valid_unconfirmed when no chainReader is supplied", async () => {
    const bundle = makeBundle([RECORD], 0);
    const result = await verifyProof(bundle);
    expect(result.status).toBe("structurally_valid_unconfirmed");
  });

  it("returns valid + anchoredAt when the chainReader confirms the root", async () => {
    const bundle = makeBundle([RECORD], 0);
    const chainReader: ChainReader = async () => ({
      root: bundle.root,
      orgIdHash: hashOrgId(RECORD.orgId),
      timestamp: 1755000000,
    });
    const result = await verifyProof(bundle, { chainReader });
    expect(result.status).toBe("valid");
    if (result.status === "valid") {
      expect(result.anchoredAt.getTime()).toBe(1755000000 * 1000);
    }
  });

  it("rejects a tampered amount even though bundle.leaf is left untouched (recomputation, not trust)", async () => {
    const bundle = makeBundle([RECORD], 0);
    const tampered: ProofBundle = {
      ...bundle,
      record: { ...bundle.record, amount: { ...bundle.record.amount, value: "999999999" } },
    };
    const result = await verifyProof(tampered);
    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.reasons).toContain("leaf_mismatch");
    }
  });

  it("rejects a corrupted proof path (root_mismatch)", async () => {
    const records = [RECORD, { ...RECORD, recordId: "TRX-OTHER" }];
    const bundle = makeBundle(records, 0);
    const corrupted: ProofBundle = {
      ...bundle,
      proof: [("0x" + "ff".repeat(32)) as Hex, ...bundle.proof.slice(1)],
    };
    const result = await verifyProof(corrupted);
    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.reasons).toContain("root_mismatch");
    }
  });

  it("rejects when the chainReader reports a different root (chain_root_mismatch)", async () => {
    const bundle = makeBundle([RECORD], 0);
    const chainReader: ChainReader = async () => ({
      root: ("0x" + "ee".repeat(32)) as Hex,
      orgIdHash: hashOrgId(RECORD.orgId),
      timestamp: 1755000000,
    });
    const result = await verifyProof(bundle, { chainReader });
    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.reasons).toContain("chain_root_mismatch");
    }
  });

  it("rejects when the chainReader reports a different orgIdHash (chain_org_mismatch)", async () => {
    const bundle = makeBundle([RECORD], 0);
    const chainReader: ChainReader = async () => ({
      root: bundle.root,
      orgIdHash: ("0x" + "99".repeat(32)) as Hex,
      timestamp: 1755000000,
    });
    const result = await verifyProof(bundle, { chainReader });
    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.reasons).toContain("chain_org_mismatch");
    }
  });
});
