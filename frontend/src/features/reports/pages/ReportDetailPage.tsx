import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import type { FinancialReportRead } from "../../../types/reporting";
import { reportsApi } from "../api/reportsApi";

export function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<FinancialReportRead | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!reportId) return;
      try {
        const data = await reportsApi.getReport(reportId);
        if (!cancelled) setReport(data);
      } catch {
        if (!cancelled) setError("Failed to load report.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  if (!reportId) return null;

  return (
    <div>
      <h2>Report</h2>
      {error && <p>{error}</p>}
      {report && (
        <div>
          <div>ID: {report.id}</div>
          <div>Type: {report.report_type}</div>
          <div>Status: {report.status}</div>
          <div>Period end: {report.period_end}</div>
        </div>
      )}
    </div>
  );
}

