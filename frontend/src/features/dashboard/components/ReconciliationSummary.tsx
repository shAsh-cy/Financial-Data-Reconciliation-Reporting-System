import { Card, CardContent, Skeleton, Typography } from "@mui/material";

import type { ReconciliationStatusSummary } from "../../../types/dashboard";

type ReconciliationSummaryProps = {
  summary: ReconciliationStatusSummary;
  loading?: boolean;
  error?: string | null;
};

export function ReconciliationSummary({ summary, loading, error }: ReconciliationSummaryProps) {
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Reconciliation Status
          </Typography>
          <Skeleton variant="rectangular" height={80} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Reconciliation Status
          </Typography>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  const items = [
    { label: "Succeeded", value: summary.succeeded, color: "success.main" },
    { label: "Failed", value: summary.failed, color: "error.main" },
    { label: "Running", value: summary.running, color: "warning.main" },
    { label: "Pending", value: summary.pending, color: "text.secondary" },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          Reconciliation Status
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Summary of reconciliation runs by status
        </Typography>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {items.map(({ label, value, color }) => (
            <div key={label}>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="h6" sx={{ color }}>
                {value}
              </Typography>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
