import { InvalidRecordError } from "./errors.js";
import type { JSONValue } from "./types.js";

/**
 * RFC 8785 JSON Canonicalization Scheme (JCS) — prd.md Section 8.3, "the single most
 * important interoperability decision in the spec."
 *
 * Implemented in-house rather than via a third-party JCS package: the only two things JCS
 * adds on top of plain JSON are (a) recursive key sorting and (b) fail-closed rejection of
 * values plain JSON.stringify would silently mangle (NaN, Infinity, undefined). Primitive
 * number/string serialization is delegated to JSON.stringify itself, since V8/Node's
 * serialization of individual primitives is already ECMA-262-conformant — which is exactly
 * what JCS requires — so there is no double-to-string algorithm to get subtly wrong here.
 */
export function canonicalize(value: JSONValue): string {
  return serialize(value);
}

function serialize(value: JSONValue): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new InvalidRecordError(
        `JCS cannot serialize non-finite numbers (got ${value}); reject upstream instead of silently mangling`,
      );
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => serialize(assertDefined(item))).join(",")}]`;
  }
  if (typeof value === "object") {
    // JS's default string sort is UTF-16 code-unit order, which is exactly RFC 8785's
    // required key order — no locale-aware comparator needed.
    const keys = Object.keys(value).sort();
    const entries = keys.map(
      (key) =>
        `${JSON.stringify(key)}:${serialize(assertDefined((value as Record<string, JSONValue>)[key]))}`,
    );
    return `{${entries.join(",")}}`;
  }
  throw new InvalidRecordError(`unsupported type in canonicalize(): ${typeof value}`);
}

function assertDefined(value: JSONValue | undefined): JSONValue {
  if (value === undefined) {
    throw new InvalidRecordError(
      "JCS cannot serialize `undefined`; omit the key/index entirely instead of leaving it undefined",
    );
  }
  return value;
}
