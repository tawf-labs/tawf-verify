/** prd.md Section 12.1 — the three verdicts a donor can see, and nothing else; the mismatch
 * copy must stay blunt, never softened, per that section's explicit instruction. */
export type VerifyUIStatus = "loading" | "verified" | "pending" | "mismatch" | "error";

export interface VerifyUIResult {
  status: VerifyUIStatus;
  /** ISO timestamp of on-chain anchoring, present when status is "verified". */
  anchoredAt?: string;
  batchId?: number;
  txHash?: string;
  explorerUrl?: string;
  /** Present when status is "pending" — prd.md's copy: "anchoring within [n] minutes." */
  expectedAnchorMinutes?: number;
}

export interface UseVerifyOptions {
  /** Defaults to the public verify.tawf.app endpoint (prd.md Section 12.1). */
  apiBaseUrl?: string;
  /** Injectable for tests / self-hosting against a different verify endpoint. */
  fetcher?: (recordId: string, apiBaseUrl?: string) => Promise<VerifyUIResult>;
}

export interface TransparencyBoardData {
  orgId: string;
  registryAddress: string;
  explorerUrl: string;
  totalRecordsAnchored: number;
  lastAnchorAt?: string;
  currentSequence: number;
  anchorHistory: { batchId: number; count: number; timestamp: string; txHash: string }[];
}
