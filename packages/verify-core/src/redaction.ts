import { concat, keccak256, stringToHex, type Hex as ViemHex } from "viem";
import { canonicalize } from "./canonicalize.js";
import type { FieldCommitment, Hex, JSONValue } from "./types.js";

/**
 * prd.md Section 9 — selective disclosure without ZK circuits: `redacted` mode replaces a
 * field's value with its own salted commitment and withholds the salt. Revealing the field
 * later just means revealing that field's salt.
 *
 * fieldCommit[k] = keccak256( fieldSalt[k] || JCS(value[k]) )
 */
export function computeFieldCommitment(fieldSalt: Hex, value: JSONValue): Hex {
  return keccak256(concat([fieldSalt as ViemHex, stringToHex(canonicalize(value))]));
}

/**
 * Replaces the named top-level fields of `payload` with their commitment, given a salt per
 * field. Fields not listed in `fields` are left untouched (still disclosed in the bundle,
 * per the operator's chosen visibility mode).
 */
export function redactFields(
  payload: Record<string, JSONValue>,
  fields: string[],
  salts: Record<string, Hex>,
): Record<string, JSONValue | FieldCommitment> {
  const result: Record<string, JSONValue | FieldCommitment> = { ...payload };
  for (const field of fields) {
    const salt = salts[field];
    if (!salt) {
      throw new RangeError(`redactFields: no salt supplied for field "${field}"`);
    }
    result[field] = {
      __redacted: true,
      commitment: computeFieldCommitment(salt, payload[field]),
    };
  }
  return result;
}
