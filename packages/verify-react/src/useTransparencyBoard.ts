import { useEffect, useState } from "react";
import type { TransparencyBoardData } from "./types.js";

/** STUB: canned fixture. Real implementation calls `GET /v1/org/:orgId/board` (prd.md
 * Section 11.2), which is deliberately public and unauthenticated. */
async function defaultBoardFetcher(
  orgId: string,
  _apiBaseUrl?: string,
): Promise<TransparencyBoardData> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  return {
    orgId,
    registryAddress: `0x${"0".repeat(40)}`,
    explorerUrl: "https://basescan.org",
    totalRecordsAnchored: 0,
    currentSequence: 0,
    anchorHistory: [],
  };
}

export function useTransparencyBoard(
  orgId: string,
  opts?: {
    apiBaseUrl?: string;
    fetcher?: (orgId: string, apiBaseUrl?: string) => Promise<TransparencyBoardData>;
  },
) {
  const [data, setData] = useState<TransparencyBoardData | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetcher = opts?.fetcher ?? defaultBoardFetcher;
    setLoading(true);
    fetcher(orgId, opts?.apiBaseUrl)
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });
  }, [orgId, opts?.apiBaseUrl, opts?.fetcher]);

  return { data, error, loading };
}
