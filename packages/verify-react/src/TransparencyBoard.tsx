import { useTransparencyBoard } from "./useTransparencyBoard.js";
import type { TransparencyBoardData } from "./types.js";

export interface TransparencyBoardProps {
  orgId: string;
  apiBaseUrl?: string;
  fetcher?: (orgId: string, apiBaseUrl?: string) => Promise<TransparencyBoardData>;
}

/**
 * prd.md Section 12.2 - the direct analogue of Proof of Coffee's `/blockchain` page, but
 * built around a fingerprint registry rather than a token vault. The closing paragraph is not
 * optional decoration: Section 9's stated limitation ("a commitment proves a record existed;
 * it does not prove the operator anchored *every* record") must ship with this component
 * every time, not just in documentation nobody reads.
 */
export function TransparencyBoard({ orgId, apiBaseUrl, fetcher }: TransparencyBoardProps) {
  const { data, loading, error } = useTransparencyBoard(orgId, { apiBaseUrl, fetcher });

  if (loading) return <p>Loading transparency board…</p>;
  if (error || !data) return <p role="alert">Could not load the transparency board.</p>;

  return (
    <section aria-label="Transparency board">
      <p>
        Registry contract:{" "}
        <a
          href={`${data.explorerUrl}/address/${data.registryAddress}`}
          target="_blank"
          rel="noreferrer"
        >
          {data.registryAddress}
        </a>
      </p>
      <p>Total records anchored: {data.totalRecordsAnchored}</p>
      <p>Current sequence: {data.currentSequence}</p>
      {data.lastAnchorAt && <p>Last anchor: {data.lastAnchorAt}</p>}

      <table>
        <caption>Anchor history</caption>
        <thead>
          <tr>
            <th>Batch ID</th>
            <th>Records</th>
            <th>Timestamp</th>
            <th>Transaction</th>
          </tr>
        </thead>
        <tbody>
          {data.anchorHistory.map((batch) => (
            <tr key={batch.batchId}>
              <td>{batch.batchId}</td>
              <td>{batch.count}</td>
              <td>{batch.timestamp}</td>
              <td>
                <a href={`${data.explorerUrl}/tx/${batch.txHash}`} target="_blank" rel="noreferrer">
                  {batch.txHash}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        A commitment proves a record existed at the time it was anchored. It does not prove every
        record was anchored - a gap in the sequence above would be visible, but its absence is not,
        by itself, a completeness guarantee. See the full explanation in this organization&apos;s
        published documentation.
      </p>
    </section>
  );
}
