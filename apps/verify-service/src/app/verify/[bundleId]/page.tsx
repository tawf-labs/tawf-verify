"use client";

import { VerifyPanel } from "@tawf/verify-react";

export default function VerifyPage({ params }: { params: { bundleId: string } }) {
  return (
    <main>
      <h1>Verification</h1>
      {/* prd.md Section 12.1: the donor path. VerifyPanel's data fetch is itself a stub
       * (see @tawf/verify-react's README) — wiring it to this app's real /api/v1/verify
       * endpoint is the next step once that package's fetcher is un-stubbed. */}
      <VerifyPanel receiptId={params.bundleId} apiBaseUrl="/api/v1" />
    </main>
  );
}
