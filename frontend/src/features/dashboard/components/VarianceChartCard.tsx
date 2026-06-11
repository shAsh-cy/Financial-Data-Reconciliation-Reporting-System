/**
 * VarianceChartCard — glass wrapper for the variance trend chart.
 */

import { CardContent, Typography } from "@mui/material";

import { GlassCard } from "@/components/ui/GlassCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import type { VarianceDataPoint } from "@/types/dashboard";

import { VarianceChart } from "./VarianceChart";

type VarianceChartCardProps = {
  data: VarianceDataPoint[];
  loading?: boolean;
  error?: string | null;
};

export function VarianceChartCard({ data, loading, error }: VarianceChartCardProps) {
  if (loading) {
    return <SkeletonCard height={360} />;
  }

  return (
    <GlassCard animateEntrance={false}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Variance Trend
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Revenue, expenses, and net income over time
        </Typography>
        {error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <VarianceChart data={data} />
        )}
      </CardContent>
    </GlassCard>
  );
}
