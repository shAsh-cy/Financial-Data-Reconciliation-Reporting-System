import { Card, CardContent, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ReconciliationStatusSummary } from "../../../types/dashboard";

type ReconciliationStatusBarChartProps = {
  summary: ReconciliationStatusSummary;
  loading?: boolean;
  error?: string | null;
};

export function ReconciliationStatusBarChart({
  summary,
  loading,
  error,
}: ReconciliationStatusBarChartProps) {
  const chartData = [
    {
      label: "Runs",
      succeeded: summary.succeeded,
      failed: summary.failed,
      running: summary.running,
      pending: summary.pending,
    },
  ];

  return (
    <Card sx={{ height: "100%", transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 3 } }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Reconciliation distribution
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Runs by outcome across the loaded window
        </Typography>
        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="succeeded" name="Succeeded" fill="#2e7d32" stackId="a" />
              <Bar dataKey="failed" name="Failed" fill="#c62828" stackId="a" />
              <Bar dataKey="running" name="Running" fill="#1976d2" stackId="a" />
              <Bar dataKey="pending" name="Pending" fill="#9e9e9e" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
