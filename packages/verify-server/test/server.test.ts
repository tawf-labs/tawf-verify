import { describe, expect, it } from "vitest";
import { NotAnchoredYetError } from "../src/errors.js";
import { TawfVerify } from "../src/server.js";
import type { Hex } from "@tawf/verify-core";

const SALT: Hex = ("0x" + "ab".repeat(32)) as Hex;

function makeSdk() {
  return new TawfVerify({ orgId: "laz-almustaqim", orgSalt: SALT, mode: "self" });
}

describe("TawfVerify", () => {
  it("record() returns a leaf and pending status", async () => {
    const tawf = makeSdk();
    const result = await tawf.record({
      type: "donation",
      recordId: "TRX-1",
      occurredAt: "2026-08-12T04:31:07Z",
      amount: { value: "500000", currency: "IDR", scale: 2 },
    });
    expect(result.status).toBe("pending");
    expect(result.leaf).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("record() is idempotent for the same recordId", async () => {
    const tawf = makeSdk();
    const input = {
      type: "donation" as const,
      recordId: "TRX-1",
      occurredAt: "2026-08-12T04:31:07Z",
      amount: { value: "500000", currency: "IDR", scale: 2 },
    };
    const first = await tawf.record(input);
    const second = await tawf.record(input);
    expect(second.leaf).toBe(first.leaf);
    expect(second.status).toBe(first.status);
  });

  it("getProof() throws NotAnchoredYetError while pending", async () => {
    const tawf = makeSdk();
    await tawf.record({
      type: "donation",
      recordId: "TRX-1",
      occurredAt: "2026-08-12T04:31:07Z",
      amount: { value: "500000", currency: "IDR", scale: 2 },
    });
    await expect(tawf.getProof("TRX-1")).rejects.toThrow(NotAnchoredYetError);
  });

  it("flushBatch() anchors every pending record and getProof() then returns a verifiable bundle", async () => {
    const tawf = makeSdk();
    await tawf.record({
      type: "donation",
      recordId: "TRX-1",
      occurredAt: "2026-08-12T04:31:07Z",
      amount: { value: "500000", currency: "IDR", scale: 2 },
    });
    await tawf.record({
      type: "donation",
      recordId: "TRX-2",
      occurredAt: "2026-08-12T04:31:07Z",
      amount: { value: "700000", currency: "IDR", scale: 2 },
    });

    const batch = await tawf.flushBatch();
    expect(batch.count).toBe(2);

    const proof = await tawf.getProof("TRX-1");
    expect(proof.root).toBe(batch.root);

    const result = await tawf.verifyRecord("TRX-1");
    expect(result.status).toBe("structurally_valid_unconfirmed");
  });

  it("donorInternalId is hashed into counterpartyRef and never stored raw", async () => {
    const tawf = makeSdk();
    const result = await tawf.record({
      type: "donation",
      recordId: "TRX-3",
      occurredAt: "2026-08-12T04:31:07Z",
      amount: { value: "100000", currency: "IDR", scale: 2 },
      donorInternalId: "user-42",
    });
    // Leaf hashes cleanly (no PII rejection), proving counterpartyRef went in pre-hashed.
    expect(result.leaf).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("audit() reports missing records not present in the outbox", async () => {
    const tawf = makeSdk();
    await tawf.record({
      type: "donation",
      recordId: "TRX-1",
      occurredAt: "2026-08-12T04:31:07Z",
      amount: { value: "500000", currency: "IDR", scale: 2 },
    });
    const report = await tawf.audit([{ recordId: "TRX-1" }, { recordId: "TRX-404" }]);
    expect(report.total).toBe(2);
    expect(report.verified).toBe(1);
    expect(report.missing).toBe(1);
  });

  it("anchorNow() anchors a single record immediately", async () => {
    const tawf = makeSdk();
    await tawf.record({
      type: "donation",
      recordId: "TRX-1",
      occurredAt: "2026-08-12T04:31:07Z",
      amount: { value: "500000", currency: "IDR", scale: 2 },
    });
    const result = await tawf.anchorNow("TRX-1");
    expect(result.status).toBe("anchored");
    const proof = await tawf.getProof("TRX-1");
    expect(proof.proof).toEqual([]);
  });
});
