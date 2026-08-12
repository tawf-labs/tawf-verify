import { describe, expect, it } from "vitest";
import { computeFieldCommitment, redactFields } from "../src/redaction.js";
import type { Hex } from "../src/types.js";

const SALT: Hex = ("0x" + "11".repeat(32)) as Hex;

describe("redaction", () => {
  it("computes a deterministic commitment for the same salt+value", () => {
    const a = computeFieldCommitment(SALT, "Sumsel");
    const b = computeFieldCommitment(SALT, "Sumsel");
    expect(a).toBe(b);
  });

  it("changes the commitment if the value changes", () => {
    const a = computeFieldCommitment(SALT, "Sumsel");
    const b = computeFieldCommitment(SALT, "Jakarta");
    expect(a).not.toBe(b);
  });

  it("changes the commitment if the salt changes", () => {
    const otherSalt: Hex = ("0x" + "22".repeat(32)) as Hex;
    const a = computeFieldCommitment(SALT, "Sumsel");
    const b = computeFieldCommitment(otherSalt, "Sumsel");
    expect(a).not.toBe(b);
  });

  it("redactFields replaces only the named fields with a commitment", () => {
    const payload = { region: "Sumsel", campaignId: "ramadan-2026", amount: "500000" };
    const salts: Record<string, Hex> = { region: SALT };
    const redacted = redactFields(payload, ["region"], salts);

    expect(redacted.campaignId).toBe("ramadan-2026");
    expect(redacted.amount).toBe("500000");
    expect(redacted.region).toEqual({
      __redacted: true,
      commitment: computeFieldCommitment(SALT, "Sumsel"),
    });
  });

  it("throws if no salt is supplied for a field marked for redaction", () => {
    expect(() => redactFields({ region: "Sumsel" }, ["region"], {})).toThrow(RangeError);
  });
});
