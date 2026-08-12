import { concat, encodeAbiParameters, keccak256, stringToHex, type Hex as ViemHex } from "viem";
import { canonicalize } from "./canonicalize.js";
import { assertNoPII } from "./pii-lint.js";
import type { CanonicalRecord, Hex, JSONValue, LeafInputs } from "./types.js";

/** CanonicalRecord is a concrete, JSON-shaped interface; the canonicalizer/linter operate on
 * the structural JSONValue type. This narrow cast is the one place that boundary is crossed. */
function asJSON(record: CanonicalRecord): JSONValue {
  return record as unknown as JSONValue;
}

/** prd.md Section 8.4: `bytes32 SCHEMA_ID = keccak256("tawf.verify.record.v1")`. */
export const SCHEMA_ID: Hex = keccak256(stringToHex("tawf.verify.record.v1"));

/** `orgIdHash = keccak256(orgId)`. */
export function hashOrgId(orgId: string): Hex {
  return keccak256(stringToHex(orgId));
}

/**
 * `recordIdHash = keccak256(orgSalt || recordId)`. The org salt never leaves the operator's
 * environment (prd.md Section 8.2) — callers must supply it, verify-core never generates or
 * stores it.
 */
export function hashRecordId(orgSalt: Hex, recordId: string): Hex {
  return keccak256(concat([orgSalt as ViemHex, stringToHex(recordId)]));
}

/**
 * `payloadHash = keccak256(JCS(record))`. Runs the mandatory PII rejection gate first
 * (prd.md Section 8.2) — silent acceptance would leak PII into a permanent public
 * commitment, which is unrecoverable, so this must not be skippable by callers.
 */
export function hashPayload(record: CanonicalRecord): Hex {
  assertNoPII(asJSON(record));
  return keccak256(stringToHex(canonicalize(asJSON(record))));
}

/** RFC3339 UTC timestamp -> unix seconds (uint64 on the wire, per prd.md Section 8.4). */
export function toUnixSeconds(occurredAt: string): number {
  const ms = Date.parse(occurredAt);
  if (Number.isNaN(ms)) {
    throw new RangeError(`occurredAt is not a valid RFC3339 timestamp: ${occurredAt}`);
  }
  return Math.floor(ms / 1000);
}

/**
 * `leaf = keccak256(abi.encode(SCHEMA_ID, orgIdHash, recordIdHash, payloadHash, occurredAt))`
 * — prd.md Section 8.4. `abi.encode`, never `abi.encodePacked`: packed encoding of
 * variable-length fields is a known collision surface, and every field here is fixed-width
 * anyway, so there is no reason to take the risk.
 */
export function computeLeafRecordHash(inputs: LeafInputs): Hex {
  const encoded = encodeAbiParameters(
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
  );
  return keccak256(encoded);
}

/** Convenience: derive the full leaf-input 5-tuple straight from a canonical record + org salt. */
export function deriveLeafInputs(record: CanonicalRecord, orgSalt: Hex): LeafInputs {
  return {
    schemaId: SCHEMA_ID,
    orgIdHash: hashOrgId(record.orgId),
    recordIdHash: hashRecordId(orgSalt, record.recordId),
    payloadHash: hashPayload(record),
    occurredAt: toUnixSeconds(record.occurredAt),
  };
}

/** Recomputes a record's leaf hash end to end. This is the function a verifier must call —
 * never trust a supplied leaf, always recompute it (prd.md Appendix B). */
export function recomputeRecordHash(record: CanonicalRecord, orgSalt: Hex): Hex {
  return computeLeafRecordHash(deriveLeafInputs(record, orgSalt));
}
