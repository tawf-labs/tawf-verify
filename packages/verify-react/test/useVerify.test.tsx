import { act, render, screen, waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VerifyBadge } from "../src/VerifyBadge.js";
import { useVerify } from "../src/useVerify.js";
import type { VerifyUIResult } from "../src/types.js";

describe("useVerify", () => {
  it("starts in loading state, then resolves via the fetcher", async () => {
    const fetcher = async (): Promise<VerifyUIResult> => ({
      status: "verified",
      anchoredAt: "2026-08-12T04:45:11Z",
    });
    const { result } = renderHook(() => useVerify("TRX-1", { fetcher }));

    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("verified"));
    expect(result.current.data?.anchoredAt).toBe("2026-08-12T04:45:11Z");
  });

  it("surfaces a rejected fetcher as status=error", async () => {
    const fetcher = async (): Promise<VerifyUIResult> => {
      throw new Error("network down");
    };
    const { result } = renderHook(() => useVerify("TRX-1", { fetcher }));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.message).toBe("network down");
  });

  it("refetch() re-runs the fetcher", async () => {
    let calls = 0;
    const fetcher = async (): Promise<VerifyUIResult> => {
      calls += 1;
      return { status: "pending" };
    };
    const { result } = renderHook(() => useVerify("TRX-1", { fetcher }));
    await waitFor(() => expect(result.current.status).toBe("pending"));
    expect(calls).toBe(1);

    act(() => result.current.refetch());
    await waitFor(() => expect(calls).toBe(2));
  });
});

describe("VerifyBadge", () => {
  it("renders the verdict label for the resolved status", async () => {
    const fetcher = async (): Promise<VerifyUIResult> => ({ status: "mismatch" });
    render(<VerifyBadge receiptId="TRX-1" fetcher={fetcher} />);
    await screen.findByText("Does not match chain");
  });
});
