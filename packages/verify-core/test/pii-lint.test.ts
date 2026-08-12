import { describe, expect, it } from "vitest";
import { assertNoPII, lintForPII } from "../src/pii-lint.js";
import { PIIRejectedError } from "../src/errors.js";

describe("pii-lint", () => {
  it("passes a clean donation record", () => {
    expect(
      lintForPII({ schema: "tawf.verify.record.v1", orgId: "laz-x", amount: { value: "500000" } }),
    ).toEqual([]);
  });

  it("rejects a denylisted key name", () => {
    const hits = lintForPII({ nik: "1234567890123456" });
    expect(hits).toContain("nik");
  });

  it("rejects a phone number hiding in an unrelated field name", () => {
    const hits = lintForPII({ meta: { note: "call 081234567890 for details" } });
    expect(hits).toContain("meta.note");
  });

  it("rejects an email address value", () => {
    const hits = lintForPII({ meta: { contact: "donor@example.com" } });
    expect(hits).toContain("meta.contact");
  });

  it("rejects a 16-digit NIK-shaped value under an innocuous key", () => {
    const hits = lintForPII({ meta: { ref: "6371012345678901" } });
    expect(hits).toContain("meta.ref");
  });

  it("does not flag counterpartyRef or attachment sha256 (pre-hashed by design)", () => {
    const hits = lintForPII({
      counterpartyRef: "sha256:9f2c00000000000000000000000000000000000000000000000000000000",
      attachments: [
        {
          name: "kwitansi.pdf",
          sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        },
      ],
    });
    expect(hits).toEqual([]);
  });

  it("flags nested array elements with a path", () => {
    const hits = lintForPII({ list: [{ nama: "Rina" }] });
    expect(hits).toContain("list[0].nama");
  });

  it("assertNoPII throws PIIRejectedError with field paths attached", () => {
    expect.assertions(2);
    try {
      assertNoPII({ email: "x@example.com" });
    } catch (err) {
      expect(err).toBeInstanceOf(PIIRejectedError);
      expect((err as PIIRejectedError).fieldPaths).toContain("email");
    }
  });
});
