import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import type { ReconciliationItemRead, ReconciliationRunRead } from "../../../types/reporting";
import { reconciliationApi } from "../api/reconciliationApi";

export function ReconciliationRunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const [run, setRun] = useState<ReconciliationRunRead | null>(null);
  const [items, setItems] = useState<ReconciliationItemRead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!runId) return;
      try {
        const [r, it] = await Promise.all([
          reconciliationApi.getRun(runId),
          reconciliationApi.listItems(runId, 200, 0),
        ]);
        if (!cancelled) {
          setRun(r);
          setItems(it);
        }
      } catch {
        if (!cancelled) setError("Failed to load reconciliation details.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [runId]);

  if (!runId) return null;

  return (
    <div>
      <h2>Reconciliation Run</h2>
      {error && <p>{error}</p>}
      {run && (
        <div>
          <div>ID: {run.id}</div>
          <div>Status: {run.status}</div>
          <div>Matched: {run.matched_count}</div>
          <div>Only left: {run.unmatched_left_count}</div>
          <div>Only right: {run.unmatched_right_count}</div>
        </div>
      )}
      <h3>Items</h3>
      <ul>
        {items.slice(0, 200).map((i) => (
          <li key={i.id}>
            {i.match_type}: {i.left_transaction_id ?? "-"} ↔ {i.right_transaction_id ?? "-"}
          </li>
        ))}
      </ul>
    </div>
  );
}

