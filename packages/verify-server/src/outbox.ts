import type { OutboxEntry } from "./types.js";

/**
 * In-memory outbox: lost on process restart. prd.md Section 15's "Availability" requirement
 * ("if the SDK cannot reach the relayer, it writes to a local outbox and returns success")
 * still needs a durable store behind this same interface in production — swap this class for
 * one backed by Postgres/SQLite/whatever without touching server.ts.
 */
export class InMemoryOutbox {
  private readonly entries = new Map<string, OutboxEntry>();

  get(recordId: string): OutboxEntry | undefined {
    return this.entries.get(recordId);
  }

  /** Idempotent by construction: batcher.ts's caller checks `get()` before ever calling this,
   * so record() never overwrites an existing entry (prd.md Section 15's idempotency rule). */
  set(recordId: string, entry: OutboxEntry): void {
    this.entries.set(recordId, entry);
  }

  pending(): [string, OutboxEntry][] {
    return [...this.entries.entries()].filter(([, entry]) => entry.status === "pending");
  }

  all(): [string, OutboxEntry][] {
    return [...this.entries.entries()];
  }
}
