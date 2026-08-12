/**
 * Regenerates the golden vectors under test/vectors/. Run this only when bumping
 * schema.v1 -> v2 (a schemaId change) — regenerating vectors for an existing schema version
 * defeats their entire purpose as a determinism regression fixture. See CONTRIBUTING.md.
 *
 * Usage: npx tsx scripts/generate-vectors.ts
 */
import { generateProof } from "../src/merkle.js";
import { buildAnchorTree, prepareLeaves } from "../src/proof.js";
import { computeFieldCommitment } from "../src/redaction.js";
import type { CanonicalRecord, Hex } from "../src/types.js";

const SALT: Hex = ("0x" + "5a".repeat(32)) as Hex;

function rec(
  recordId: string,
  value: string,
  extra: Partial<CanonicalRecord> = {},
): CanonicalRecord {
  return {
    schema: "tawf.verify.record.v1",
    type: "donation",
    orgId: "laz-almustaqim",
    recordId,
    occurredAt: "2026-08-12T04:31:07Z",
    amount: { value, currency: "IDR", scale: 2 },
    instrument: "zakat_mal",
    channel: "qris",
    campaignId: "ramadan-2026-yatim",
    ...extra,
  };
}

function dump(label: string, records: CanonicalRecord[]): void {
  const leaves = prepareLeaves(records, SALT);
  const tree = buildAnchorTree(leaves);
  const proofs = leaves.map((_l, i) => ({ leafIndex: i, path: generateProof(tree, i) }));
  console.log(`\n=== ${label} ===`);
  console.log(
    JSON.stringify(
      { recordHashes: leaves.map((l) => l.recordHash), root: tree.root, proofs },
      null,
      2,
    ),
  );
}

dump("single-leaf", [rec("TRX-2026-08-000184213", "500000")]);
dump("odd-leaf-count", [rec("TRX-1", "100000"), rec("TRX-2", "200000"), rec("TRX-3", "300000")]);

const A = rec("TRX-A", "100000");
const B = rec("TRX-B", "200000");
dump("sorted-pair-ordering [A,B]", [A, B]);
dump("sorted-pair-ordering [B,A]", [B, A]);

try {
  prepareLeaves([rec("TRX-PII", "100000", { meta: { phone: "081234567890" } })], SALT);
  console.log("\n=== pii-rejection: DID NOT THROW (bug!) ===");
} catch (e) {
  console.log(`\n=== pii-rejection: threw ${(e as Error).name} — ${(e as Error).message} ===`);
}

const FIELD_SALT: Hex = ("0x" + "7b".repeat(32)) as Hex;
console.log("\n=== redaction-commitment ===");
console.log(
  JSON.stringify(
    {
      fieldSalt: FIELD_SALT,
      region: "Sumsel",
      commitment: computeFieldCommitment(FIELD_SALT, "Sumsel"),
    },
    null,
    2,
  ),
);
