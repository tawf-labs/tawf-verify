#!/usr/bin/env bash
# End-to-end demo: real local chain, real deployed contract, real anchor transaction, real
# CLI verification against that live chain. Nothing in this script is mocked.
#
# Usage: pnpm demo:e2e
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RPC_URL="http://127.0.0.1:8545"
WORK_DIR="$(mktemp -d)"
ANVIL_LOG="$WORK_DIR/anvil.log"
DEPLOY_LOG="$WORK_DIR/deploy.log"
PROOF_FILE="$WORK_DIR/proof.json"
TAMPERED_FILE="$WORK_DIR/proof-tampered.json"

ANVIL_PID=""
cleanup() {
  if [[ -n "$ANVIL_PID" ]]; then
    kill "$ANVIL_PID" 2>/dev/null || true
    wait "$ANVIL_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

step() { echo; echo "=== $1 ==="; }

step "Starting a local anvil chain"
anvil --port 8545 > "$ANVIL_LOG" 2>&1 &
ANVIL_PID=$!
for _ in $(seq 1 30); do
  if cast client --rpc-url "$RPC_URL" > /dev/null 2>&1; then
    break
  fi
  sleep 0.5
done
cast client --rpc-url "$RPC_URL"
echo "anvil is up (pid $ANVIL_PID), log: $ANVIL_LOG"

# Read the dev account keys straight from anvil's own printed output rather than hardcoding
# them by hand - a single mistyped hex character is otherwise an easy, silent mistake.
mapfile -t DEV_KEYS < <(grep -oE '^\([0-9]\)\s+0x[a-fA-F0-9]{64}' "$ANVIL_LOG" | grep -oE '0x[a-fA-F0-9]{64}')
if [[ ${#DEV_KEYS[@]} -lt 2 ]]; then
  echo "FAIL: could not read at least 2 dev account keys from anvil's log" >&2
  exit 1
fi
export DEPLOYER_PRIVATE_KEY="${DEV_KEYS[0]}"
ADMIN_PRIVATE_KEY="${DEV_KEYS[0]}"
SIGNER_PRIVATE_KEY="${DEV_KEYS[1]}"
export ADMIN_PRIVATE_KEY SIGNER_PRIVATE_KEY

step "Deploying TawfVerifyRegistry.sol to the local chain (real forge script, real broadcast tx)"
(cd "$ROOT_DIR/contracts" && forge script script/Deploy.s.sol --rpc-url "$RPC_URL" --broadcast -vvv) | tee "$DEPLOY_LOG"
REGISTRY_ADDRESS=$(grep -oE '0x[a-fA-F0-9]{40}' "$DEPLOY_LOG" | tail -1)
if [[ -z "$REGISTRY_ADDRESS" ]]; then
  echo "FAIL: could not find deployed registry address in deploy log" >&2
  exit 1
fi
echo "TawfVerifyRegistry deployed at: $REGISTRY_ADDRESS"

step "Registering an org, authorizing a signer, building a real batch, anchoring it on chain"
(cd "$ROOT_DIR" && npx tsx scripts/e2e-anchor-and-verify.ts "$REGISTRY_ADDRESS" "$PROOF_FILE" "$TAMPERED_FILE")

step "Verifying the genuine proof with the real CLI against the real chain (tawf-verify check)"
if node "$ROOT_DIR/packages/cli/dist/bin.js" check "$PROOF_FILE" --rpc "$RPC_URL"; then
  echo "PASS: genuine proof verified end-to-end against the live chain"
else
  echo "FAIL: genuine proof did not verify - this should never happen" >&2
  exit 1
fi

step "Confirming a tampered proof is rejected end-to-end (same real chain, same CLI)"
if node "$ROOT_DIR/packages/cli/dist/bin.js" check "$TAMPERED_FILE" --rpc "$RPC_URL"; then
  echo "FAIL: tampered proof was accepted - this must never happen" >&2
  exit 1
else
  echo "PASS: tampered proof correctly rejected"
fi

step "Done"
echo "Real chain, real contract, real anchor transaction, real proof, real rejection of a tampered proof."
echo "Nothing above was mocked."
