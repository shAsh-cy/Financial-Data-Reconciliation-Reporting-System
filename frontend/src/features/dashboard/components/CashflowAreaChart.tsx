import { Card, CardContent, Typography } from "@mui/material";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CashflowPoint } from "../../../types/dashboard";

type Props = {
  data: CashflowPoint[];
  loading?: boolean;
};

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  } catch {
    return dateStr;
  }
}

export function CashflowAreaChart({ data, loading }: Props) {
  return (
    <Card sx={{ height: "100%", transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 3 } }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Cashflow trend
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Net income as cashflow proxy by period
        </Typography>
        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : data.length === 0 ? (
          <Typography color="text.secondary">No series yet.</Typography>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cfFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1976d2" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="periodLabel" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: number) => formatCompact(v)}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.periodEnd
                    ? formatDate(payload[0].payload.periodEnd)
                    : ""
                }
              />
              <Area
                type="monotone"
                dataKey="cashflow"
                name="Cashflow"
                stroke="#1976d2"
                fillOpacity={1}
                fill="url(#cfFill)"
                strokeWidth={2}
                isAnimationActive={data.length < 40}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
