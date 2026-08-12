import type { AnchorInfo, Hex, JSONValue, ProofBundle, RecordType } from "@tawf/verify-core";

export interface TawfVerifyConfig {
  orgId: string;
  /** 32-byte org salt. Never rotated without a migration - see prd.md Section 15. */
  orgSalt: Hex;
  mode?: "hosted" | "self";
  /** hosted mode */
  apiKey?: string;
  /** self mode */
  rpcUrl?: string;
  registry?: Hex;
  chainId?: number;
  batch?: { maxRecords?: number; maxDelayMs?: number };
}

/** prd.md Section 11.1 - the shape passed to `tawf.record()`. `donorInternalId` is hashed
 * with orgSalt inside the SDK and never transmitted or stored raw. */
export interface RecordInput {
  type: RecordType;
  recordId: string;
  occurredAt: string | Date;
  amount: { value: string; currency: string; scale: number };
  instrument?: string;
  channel?: string;
  campaignId?: string;
  donorInternalId?: string;
  externalRefs?: Record<string, string>;
  attachments?: { name: string; sha256: string }[];
  meta?: Record<string, JSONValue>;
}

export type RecordStatus = "pending" | "anchored";

export interface RecordResult {
  recordId: string;
  leaf: Hex;
  status: RecordStatus;
}

export interface BatchResult {
  batchId: number;
  root: Hex;
  count: number;
}

export interface AuditRow {
  recordId: string;
  [key: string]: unknown;
}

export interface AuditReport {
  total: number;
  verified: number;
  missing: number;
  mismatched: number;
  gaps: string[];
}

export interface OutboxEntry {
  input: RecordInput;
  leaf: Hex;
  status: RecordStatus;
  proof?: ProofBundle;
}

/** What a real anchorClient submits to TawfVerifyRegistry.anchorBatch - see anchorClient.ts. */
export type SubmittedAnchor = AnchorInfo;
