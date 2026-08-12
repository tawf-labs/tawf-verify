import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildAnchorTree, buildProofBundle, prepareLeaves } from "@tawf/verify-core";
import type { AnchorInfo, CanonicalRecord, Hex } from "@tawf/verify-core";
import { describe, expect, it } from "vitest";
import { runCheck } from "../src/commands/check.js";

const SALT: Hex = ("0x" + "ee".repeat(32)) as Hex;

const RECORD: CanonicalRecord = {
  schema: "tawf.verify.record.v1",
  type: "donation",
  orgId: "laz-almustaqim",
  recordId: "TRX-CLI-1",
  occurredAt: "2026-08-12T04:31:07Z",
  amount: { value: "500000", currency: "IDR", scale: 2 },
};

const ANCHOR: AnchorInfo = {
  chainId: 8453,
  registry: ("0x" + "11".repeat(20)) as Hex,
  batchId: 1,
  txHash: ("0x" + "22".repeat(32)) as Hex,
  blockNumber: 100,
  blockTimestamp: "2026-08-12T04:45:11Z",
};

function writeBundleFile(): string {
  const leaves = prepareLeaves([RECORD], SALT);
  const tree = buildAnchorTree(leaves);
  const bundle = buildProofBundle(tree, leaves, 0, ANCHOR);
  const dir = mkdtempSync(join(tmpdir(), "tawf-verify-cli-test-"));
  const file = join(dir, "proof.json");
  writeFileSync(file, JSON.stringify(bundle));
  return file;
}

describe("tawf-verify check", () => {
  it("returns exit code 0 and STRUCTURALLY VALID for a genuine bundle with no --rpc", async () => {
    const file = writeBundleFile();
    const result = await runCheck({ file });
    expect(result.exitCode).toBe(0);
    expect(result.message).toMatch(/STRUCTURALLY VALID/);
  });

  it("returns exit code 1 for a tampered record", async () => {
    const leaves = prepareLeaves([RECORD], SALT);
    const tree = buildAnchorTree(leaves);
    const bundle = buildProofBundle(tree, leaves, 0, ANCHOR);
    const tampered = {
      ...bundle,
      record: { ...bundle.record, amount: { ...bundle.record.amount, value: "1" } },
    };
    const dir = mkdtempSync(join(tmpdir(), "tawf-verify-cli-test-"));
    const file = join(dir, "proof.json");
    writeFileSync(file, JSON.stringify(tampered));

    const result = await runCheck({ file });
    expect(result.exitCode).toBe(1);
    expect(result.message).toMatch(/MISMATCH/);
  });
});
