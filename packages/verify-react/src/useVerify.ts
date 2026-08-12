import { useCallback, useEffect, useState } from "react";
import type { UseVerifyOptions, VerifyUIResult } from "./types.js";

/**
 * STUB: returns a canned fixture instead of hitting a live verify-service deployment. A real
 * implementation calls `POST /v1/verify` or `GET /v1/records/:id/proof` (prd.md Section 11.2)
 * against `apiBaseUrl`, runs `@tawf/verify-core`'s `verifyProof` client-side (never trust a
 * server-reported verdict without recomputing it - the same rule as Appendix B), and maps the
 * result to a VerifyUIResult. Swap this function out; nothing else in this package needs to
 * change, since useVerify only depends on the `fetcher` shape.
 */
async function defaultFetcher(recordId: string, _apiBaseUrl?: string): Promise<VerifyUIResult> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  return {
    status: "verified",
    anchoredAt: new Date().toISOString(),
    batchId: 1,
    txHash: `0x${"0".repeat(63)}${recordId.length % 10}`,
    explorerUrl: "https://basescan.org",
  };
}

export function useVerify(recordId: string, opts?: UseVerifyOptions) {
  const [data, setData] = useState<VerifyUIResult | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [status, setStatus] = useState<VerifyUIResult["status"]>("loading");

  const fetcher = opts?.fetcher ?? defaultFetcher;

  const refetch = useCallback(() => {
    setStatus("loading");
    setError(undefined);
    fetcher(recordId, opts?.apiBaseUrl)
      .then((result) => {
        setData(result);
        setStatus(result.status);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      });
  }, [recordId, opts?.apiBaseUrl, fetcher]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { status, data, error, refetch };
}
