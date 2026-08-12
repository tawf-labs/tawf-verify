/**
 * Independent, human-readable smoke test that @tawf/verify-core is actually correct, not just
 * structurally present: build a real Merkle tree over 3 records, generate a proof for the
 * middle record, verify it (expect the honest "unconfirmed" status when no chain reader is
 * supplied), then deliberately corrupt one byte of the proof and confirm it now fails.
 *
 * Run: pnpm sanity
 */
import { buildAnchorTree, buildProofBundle, prepareLeaves, verifyProof } from "@tawf/verify-core";
import type { AnchorInfo, CanonicalRecord, Hex } from "@tawf/verify-core";

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function ok(message: string): void {
  console.log(`OK: ${message}`);
}

const orgSalt: Hex = ("0x" + "9c".repeat(32)) as Hex;

function record(recordId: string, value: string): CanonicalRecord {
  return {
    schema: "tawf.verify.record.v1",
    type: "donation",
    orgId: "laz-sanity-check",
    recordId,
    occurredAt: "2026-08-12T04:31:07Z",
    amount: { value, currency: "IDR", scale: 2 },
  };
}

const anchor: AnchorInfo = {
  chainId: 8453,
  registry: ("0x" + "11".repeat(20)) as Hex,
  batchId: 1,
  txHash: ("0x" + "22".repeat(32)) as Hex,
  blockNumber: 100,
  blockTimestamp: new Date().toISOString(),
};

async function main(): Promise<void> {
  const records = [record("TRX-1", "100000"), record("TRX-2", "200000"), record("TRX-3", "300000")];
  const leaves = prepareLeaves(records, orgSalt);
  const tree = buildAnchorTree(leaves);
  ok(`built a 3-leaf Merkle tree, root = ${tree.root}`);

  const middleIndex = 1;
  const bundle = buildProofBundle(tree, leaves, middleIndex, anchor);
  ok(`generated a proof for "${records[middleIndex].recordId}" (${bundle.proof.length} step(s))`);

  const genuine = await verifyProof(bundle);
  if (genuine.status !== "structurally_valid_unconfirmed") {
    fail(
      `expected structurally_valid_unconfirmed for a genuine bundle with no chainReader, got: ${genuine.status}`,
    );
  }
  ok("genuine proof verifies as structurally_valid_unconfirmed (no chainReader supplied)");

  const original = bundle.proof[0];
  const lastChar = original.at(-1)!;
  const flipped = lastChar === "0" ? "1" : "0";
  const corruptedStep = (original.slice(0, -1) + flipped) as Hex;
  const corrupted = { ...bundle, proof: [corruptedStep, ...bundle.proof.slice(1)] };
  const result = await verifyProof(corrupted);
  if (result.status !== "invalid") {
    fail(`expected a corrupted proof to fail verification, got: ${result.status}`);
  }
  ok(
    `corrupted proof correctly rejected: invalid (${result.status === "invalid" ? result.reasons.join(", ") : ""})`,
  );

  console.log(
    "\nsanity check passed: @tawf/verify-core is producing and verifying real proofs correctly.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
