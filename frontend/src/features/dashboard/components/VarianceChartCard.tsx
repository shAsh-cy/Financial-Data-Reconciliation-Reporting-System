import { Card, CardContent, Skeleton, Typography } from "@mui/material";

import { VarianceChart } from "./VarianceChart";
import type { VarianceDataPoint } from "../../../types/dashboard";

type VarianceChartCardProps = {
  data: VarianceDataPoint[];
  loading?: boolean;
  error?: string | null;
};

export function VarianceChartCard({ data, loading, error }: VarianceChartCardProps) {
  return (
    <Card sx={{ transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 3 } }}>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          Variance Trend
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Revenue, expenses, and net income over time
        </Typography>
        {loading ? (
          <Skeleton variant="rectangular" height={280} />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <VarianceChart data={data} />
        )}
      </CardContent>
    </Card>
  );
}
