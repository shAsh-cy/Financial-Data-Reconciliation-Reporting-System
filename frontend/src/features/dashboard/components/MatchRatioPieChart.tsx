import { Card, CardContent, Typography } from "@mui/material";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { MatchSlice } from "../../../types/dashboard";

type Props = {
  data: MatchSlice[];
  loading?: boolean;
};

const COLORS: Record<string, string> = {
  Matched: "#2e7d32",
  Unmatched: "#c62828",
  matched: "#2e7d32",
  unmatched: "#c62828",
};

export function MatchRatioPieChart({ data, loading }: Props) {
  return (
    <Card sx={{ height: "100%", transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 3 } }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Reconciliation match ratio
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Matched vs unmatched lines (succeeded runs)
        </Typography>
        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : data.length === 0 ? (
          <Typography color="text.secondary">No reconciliation data yet.</Typography>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={88}
                paddingAngle={2}
                isAnimationActive={data.length < 20}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[entry.name] ?? "#1976d2"}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => v.toLocaleString()} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
