/** Thrown by pii-lint.ts. Rejecting is deliberate: a permanent public commitment cannot be undone. */
export class PIIRejectedError extends Error {
  readonly fieldPaths: string[];

  constructor(fieldPaths: string[]) {
    super(`PIIRejectedError: possible PII found at field path(s): ${fieldPaths.join(", ")}`);
    this.name = "PIIRejectedError";
    this.fieldPaths = fieldPaths;
  }
}

export class InvalidRecordError extends Error {
  constructor(message: string) {
    super(`InvalidRecordError: ${message}`);
    this.name = "InvalidRecordError";
  }
}

/** buildMerkleTree() refuses an empty leaf set — a zero-record batch is not a meaningful anchor. */
export class EmptyBatchError extends Error {
  constructor() {
    super("EmptyBatchError: cannot build a Merkle tree over zero leaves");
    this.name = "EmptyBatchError";
  }
}
