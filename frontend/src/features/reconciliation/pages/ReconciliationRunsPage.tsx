import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import type { ReconciliationRunRead } from "../../../types/reporting";
import { reconciliationApi } from "../api/reconciliationApi";

export function ReconciliationRunsPage() {
  const [runs, setRuns] = useState<ReconciliationRunRead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await reconciliationApi.listRuns(50, 0);
        if (!cancelled) setRuns(data);
      } catch {
        if (!cancelled) setError("Failed to load reconciliation runs.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h2>Reconciliation Runs</h2>
      {error && <p>{error}</p>}
      <ul>
        {runs.map((r) => (
          <li key={r.id}>
            <Link to={`/reconciliations/${r.id}`}>{r.id}</Link> — {r.status} — matched{" "}
            {r.matched_count}
          </li>
        ))}
      </ul>
    </div>
  );
}

