import { describe, expect, it } from "vitest";
import { canonicalize } from "../src/canonicalize.js";
import { InvalidRecordError } from "../src/errors.js";

describe("canonicalize (RFC 8785 JCS)", () => {
  it("sorts object keys regardless of input order", () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it("sorts keys recursively in nested objects", () => {
    expect(canonicalize({ z: { d: 1, c: 2 }, a: 1 })).toBe('{"a":1,"z":{"c":2,"d":1}}');
  });

  it("preserves array order (arrays are not sorted)", () => {
    expect(canonicalize([3, 1, 2])).toBe("[3,1,2]");
  });

  it("produces identical output regardless of key insertion order", () => {
    const a = canonicalize({ schema: "x", type: "donation", orgId: "o" });
    const b = canonicalize({ orgId: "o", schema: "x", type: "donation" });
    expect(a).toBe(b);
  });

  it("serializes primitives per JCS", () => {
    expect(canonicalize(null)).toBe("null");
    expect(canonicalize(true)).toBe("true");
    expect(canonicalize(false)).toBe("false");
    expect(canonicalize("hello")).toBe('"hello"');
    expect(canonicalize(42)).toBe("42");
  });

  it("escapes strings the same way JSON.stringify does", () => {
    expect(canonicalize('a"b\\c\nd')).toBe(JSON.stringify('a"b\\c\nd'));
  });

  it("rejects NaN and Infinity instead of silently mangling them", () => {
    expect(() => canonicalize(Number.NaN)).toThrow(InvalidRecordError);
    expect(() => canonicalize(Number.POSITIVE_INFINITY)).toThrow(InvalidRecordError);
  });

  it("rejects undefined inside arrays and objects", () => {
    expect(() => canonicalize([1, undefined as never, 2])).toThrow(InvalidRecordError);
    expect(() => canonicalize({ a: undefined as never })).toThrow(InvalidRecordError);
  });

  it("handles an empty object and empty array", () => {
    expect(canonicalize({})).toBe("{}");
    expect(canonicalize([])).toBe("[]");
  });
});
