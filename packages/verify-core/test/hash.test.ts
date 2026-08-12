import { encodeAbiParameters, keccak256, stringToHex } from "viem";
import { describe, expect, it } from "vitest";
import {
  SCHEMA_ID,
  computeLeafRecordHash,
  deriveLeafInputs,
  hashOrgId,
  hashPayload,
  hashRecordId,
  recomputeRecordHash,
  toUnixSeconds,
} from "../src/hash.js";
import { PIIRejectedError } from "../src/errors.js";
import type { CanonicalRecord, Hex } from "../src/types.js";

const SALT: Hex = ("0x" + "aa".repeat(32)) as Hex;

const RECORD: CanonicalRecord = {
  schema: "tawf.verify.record.v1",
  type: "donation",
  orgId: "laz-almustaqim",
  recordId: "TRX-2026-08-000184213",
  occurredAt: "2026-08-12T04:31:07Z",
  amount: { value: "500000", currency: "IDR", scale: 2 },
  instrument: "zakat_mal",
  channel: "qris",
  campaignId: "ramadan-2026-yatim",
};

describe("hash", () => {
  it("SCHEMA_ID is keccak256 of the literal schema string", () => {
    expect(SCHEMA_ID).toBe(keccak256(stringToHex("tawf.verify.record.v1")));
  });

  it("hashOrgId is deterministic and equals keccak256(orgId)", () => {
    expect(hashOrgId("laz-almustaqim")).toBe(keccak256(stringToHex("laz-almustaqim")));
  });

  it("hashRecordId changes when the salt changes", () => {
    const otherSalt: Hex = ("0x" + "bb".repeat(32)) as Hex;
    expect(hashRecordId(SALT, "TRX-1")).not.toBe(hashRecordId(otherSalt, "TRX-1"));
  });

  it("hashRecordId changes when the recordId changes", () => {
    expect(hashRecordId(SALT, "TRX-1")).not.toBe(hashRecordId(SALT, "TRX-2"));
  });

  it("hashPayload is stable under key-order permutation (canonicalization)", () => {
    const a = hashPayload(RECORD);
    const permuted = { ...RECORD };
    // rebuild the object with keys inserted in a different order
    const b = hashPayload({
      occurredAt: RECORD.occurredAt,
      schema: RECORD.schema,
      ...permuted,
    });
    expect(a).toBe(b);
  });

  it("hashPayload throws PIIRejectedError if the record contains PII", () => {
    expect(() => hashPayload({ ...RECORD, meta: { phone: "081234567890" } })).toThrow(
      PIIRejectedError,
    );
  });

  it("toUnixSeconds converts an RFC3339 timestamp to unix seconds", () => {
    expect(toUnixSeconds("2026-08-12T04:31:07Z")).toBe(
      Math.floor(Date.parse("2026-08-12T04:31:07Z") / 1000),
    );
  });

  it("toUnixSeconds throws RangeError on an invalid timestamp", () => {
    expect(() => toUnixSeconds("not-a-date")).toThrow(RangeError);
  });

  it("computeLeafRecordHash matches a manually-encoded abi.encode", () => {
    const inputs = {
      schemaId: SCHEMA_ID,
      orgIdHash: hashOrgId(RECORD.orgId),
      recordIdHash: hashRecordId(SALT, RECORD.recordId),
      payloadHash: hashPayload(RECORD),
      occurredAt: toUnixSeconds(RECORD.occurredAt),
    };
    const expected = keccak256(
      encodeAbiParameters(
        [
          { type: "bytes32" },
          { type: "bytes32" },
          { type: "bytes32" },
          { type: "bytes32" },
          { type: "uint64" },
        ],
        [
          inputs.schemaId,
          inputs.orgIdHash,
          inputs.recordIdHash,
          inputs.payloadHash,
          BigInt(inputs.occurredAt),
        ],
      ),
    );
    expect(computeLeafRecordHash(inputs)).toBe(expected);
  });

  it("deriveLeafInputs + computeLeafRecordHash agrees with recomputeRecordHash", () => {
    const inputs = deriveLeafInputs(RECORD, SALT);
    expect(computeLeafRecordHash(inputs)).toBe(recomputeRecordHash(RECORD, SALT));
  });

  it("recomputeRecordHash changes if the amount changes (integrity)", () => {
    const tampered: CanonicalRecord = { ...RECORD, amount: { ...RECORD.amount, value: "999999" } };
    expect(recomputeRecordHash(RECORD, SALT)).not.toBe(recomputeRecordHash(tampered, SALT));
  });
});
