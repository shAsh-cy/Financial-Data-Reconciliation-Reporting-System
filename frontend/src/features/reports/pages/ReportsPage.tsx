import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import type { FinancialReportRead } from "../../../types/reporting";
import { reportsApi } from "../api/reportsApi";

export function ReportsPage() {
  const [reports, setReports] = useState<FinancialReportRead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await reportsApi.listReports(undefined, 50, 0);
        if (!cancelled) setReports(data);
      } catch {
        if (!cancelled) setError("Failed to load reports.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h2>Reports</h2>
      {error && <p>{error}</p>}
      <ul>
        {reports.map((r) => (
          <li key={r.id}>
            <Link to={`/reports/${r.id}`}>{r.report_type}</Link> — {r.status} —{" "}
            {r.period_end}
          </li>
        ))}
      </ul>
    </div>
  );
}

