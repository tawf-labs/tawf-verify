export class NotAnchoredYetError extends Error {
  constructor(recordId: string) {
    super(`NotAnchoredYetError: record "${recordId}" is still pending — no proof exists yet`);
    this.name = "NotAnchoredYetError";
  }
}

export class RecordNotFoundError extends Error {
  constructor(recordId: string) {
    super(`RecordNotFoundError: no record "${recordId}" in this outbox`);
    this.name = "RecordNotFoundError";
  }
}

export class EmptyOutboxError extends Error {
  constructor() {
    super("EmptyOutboxError: no pending records to flush");
    this.name = "EmptyOutboxError";
  }
}
