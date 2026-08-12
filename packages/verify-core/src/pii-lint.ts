import { PIIRejectedError } from "./errors.js";
import type { JSONValue } from "./types.js";

/**
 * prd.md Section 8.2: "No field may contain a raw NIK, phone number, email, full name, or
 * bank account number. The SDK runs a rejection lint on input and throws PIIRejectedError
 * rather than hashing it silently."
 *
 * Two independent signals, either one is enough to reject:
 *  (a) a denylist of known-PII key names (Indonesian and English variants), and
 *  (b) regex matches against string values, so PII hiding under an innocuous key name
 *      (e.g. `note: "call 081234567890"`) is still caught.
 */

const DENYLISTED_KEYS = new Set([
  "nik",
  "ktp",
  "no_ktp",
  "phone",
  "phone_number",
  "telepon",
  "no_telepon",
  "hp",
  "no_hp",
  "whatsapp",
  "email",
  "e_mail",
  "nama",
  "full_name",
  "fullname",
  "nama_lengkap",
  "address",
  "alamat",
  "bank_account",
  "no_rekening",
  "account_number",
]);

// Indonesian NIK: exactly 16 digits.
const NIK_PATTERN = /\b\d{16}\b/;
// Indonesian mobile numbers: 08xx / +628xx / 628xx, 9-13 digits after the prefix.
const PHONE_PATTERN = /\b(?:\+?62|0)8[0-9]{8,11}\b/;
const EMAIL_PATTERN = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/;

function looksLikePII(value: string): boolean {
  return NIK_PATTERN.test(value) || PHONE_PATTERN.test(value) || EMAIL_PATTERN.test(value);
}

function isAllowedKey(key: string): boolean {
  // counterpartyRef and attachment sha256 fields are pre-hashed by design (Section 8.2) —
  // they are hex/base64 digests, not raw identity, so exempt them from the denylist even
  // though their names might loosely resemble something sensitive.
  return key === "counterpartyRef" || key === "sha256";
}

function walk(value: JSONValue | undefined, path: string, hits: Set<string>): void {
  // An omitted optional field (`instrument?: string`, never assigned) surfaces here as
  // `undefined` when we recurse into it via Object.entries — that's not PII, it's absence.
  // canonicalize.ts is the stricter of the two: it rejects a *present* key whose value is
  // undefined outright, since JCS has no representation for that. Here we just skip it.
  if (
    value === undefined ||
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return;
  }
  if (typeof value === "string") {
    if (looksLikePII(value)) {
      hits.add(path || "(root)");
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`, hits));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (!isAllowedKey(key) && DENYLISTED_KEYS.has(key.toLowerCase())) {
      hits.add(childPath);
      continue;
    }
    walk(child, childPath, hits);
  }
}

/** Returns the field paths that look like PII, or an empty array if none were found. */
export function lintForPII(payload: JSONValue): string[] {
  const hits = new Set<string>();
  walk(payload, "", hits);
  return [...hits];
}

/** Throws PIIRejectedError if lintForPII finds anything. This is the mandatory gate every
 * payload must pass before hashPayload() is allowed to run (hash.ts). */
export function assertNoPII(payload: JSONValue): void {
  const hits = lintForPII(payload);
  if (hits.length > 0) {
    throw new PIIRejectedError(hits);
  }
}
