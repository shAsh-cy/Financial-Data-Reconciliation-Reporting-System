/**
 * ReconciliationRunDetailPage — run detail with KPIs, charts, and match lines DataTable.
 */

import {
  Alert,
  Box,
  Button,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { apiErrorDetail } from "@/api/errors";
import { CHART_ANIMATION, ChartFrame, ChartTooltip, describeSlices } from "@/components/charts";
import { DataTable } from "@/components/ui/DataTable";
import { GlassCard } from "@/components/ui/GlassCard";
import { KPICard } from "@/components/ui/KPICard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { StatusChip } from "@/components/ui/StatusChip";
import type {
  ReconciliationItemRead,
  ReconciliationRunDetailEnvelope,
  ReconciliationItemsAggregation,
} from "@/types/reporting";
import { activateDemoFromMeta } from "@/app/state/demoStore";
import { parseDecimal } from "@/utils/financialFormat";
import { isValidUuid } from "@/utils/uuid";

import { formatDateTime } from "@/utils/dateFormat";

import { reconciliationApi } from "../api/reconciliationApi";

function aggregationFromMeta(meta: Record<string, unknown> | undefined): ReconciliationItemsAggregation | null {
  const raw = meta?.aggregation;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const by = o.by_match_type;
  if (!by || typeof by !== "object") return null;
  return {
    by_match_type: by as Record<string, number>,
    matched_lines: Number(o.matched_lines ?? 0),
    unmatched_lines: Number(o.unmatched_lines ?? 0),
    only_left: Number(o.only_left ?? 0),
    only_right: Number(o.only_right ?? 0),
  };
}

export function ReconciliationRunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const [detail, setDetail] = useState<ReconciliationRunDetailEnvelope | null>(null);
  const [items, setItems] = useState<ReconciliationItemRead[]>([]);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [lineAgg, setLineAgg] = useState<ReconciliationItemsAggregation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [badId, setBadId] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!runId || !isValidUuid(runId)) {
      setBadId(true);
      setLoading(false);
      return;
    }
    setBadId(false);
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const [runRes, itemsRes] = await Promise.all([
        reconciliationApi.getRun(runId),
        reconciliationApi.listItems(runId, 1_000, 0),
      ]);
      if (!runRes?.data?.summary?.run) {
        setNotFound(true);
        setDetail(null);
        setItems([]);
        setItemsTotal(0);
        setLineAgg(null);
        return;
      }
      setDetail(runRes);
      activateDemoFromMeta(runRes.meta);
      setItems(itemsRes.items);
      setItemsTotal(itemsRes.total);
      setLineAgg(aggregationFromMeta(itemsRes.meta));
      setLastUpdated(new Date());
    } catch (e: unknown) {
      const { status, message } = apiErrorDetail(e, "Failed to load reconciliation.");
      if (status === 404) {
        setNotFound(true);
        setDetail(null);
        setItems([]);
        setItemsTotal(0);
        setLineAgg(null);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = detail?.data.summary.run;

  const matchPieData = useMemo(() => {
    const m = detail?.data.summary.matched_lines ?? 0;
    const u = detail?.data.summary.unmatched_lines ?? 0;
    if (m + u === 0) return [];
    return [
      { name: "Matched", value: m },
      { name: "Unmatched", value: u },
    ];
  }, [detail]);

  const barData = useMemo(
    () =>
      (detail?.data.breakdown ?? []).map((b) => ({
        name: b.match_type.replaceAll("_", " "),
        count: b.count,
      })),
    [detail],
  );

  const timelineData = useMemo(
    () =>
      (detail?.data.timeseries ?? []).map((p) => ({
        label: p.period_label,
        matched: p.matched_count,
        unmatched: p.unmatched_count,
        status: p.status,
      })),
    [detail],
  );

  const itemRows = useMemo(
    () =>
      items.map((i) => ({
        id: i.id,
        match_status: i.match_status,
        match_type: i.match_type,
        amountNum: parseDecimal(i.amount),
        left_transaction_id: i.left_transaction_id,
        right_transaction_id: i.right_transaction_id,
      })),
    [items],
  );

  const itemColumns: GridColDef[] = useMemo(
    () => [
      {
        field: "match_status",
        headerName: "Status",
        width: 130,
        renderCell: (params) => <StatusChip status={String(params.value)} />,
      },
      {
        field: "match_type",
        headerName: "Match type",
        width: 140,
        renderCell: (params) => (
          <StatusChip status={String(params.value).replaceAll("_", " ")} />
        ),
      },
      {
        field: "amountNum",
        headerName: "Amount",
        width: 130,
        type: "number",
        align: "right",
        headerAlign: "right",
        valueFormatter: (v) =>
          v != null && Number(v) !== 0
            ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(v))
            : "—",
      },
      {
        field: "left_transaction_id",
        headerName: "Left txn",
        flex: 1,
        minWidth: 120,
        valueFormatter: (v) => (v ? `${String(v).slice(0, 8)}…` : "—"),
      },
      {
        field: "right_transaction_id",
        headerName: "Right txn",
        flex: 1,
        minWidth: 120,
        valueFormatter: (v) => (v ? `${String(v).slice(0, 8)}…` : "—"),
      },
    ],
    [],
  );

  if (!runId) return null;

  if (badId) {
    return <Alert severity="warning">The reconciliation link is not a valid UUID.</Alert>;
  }

  if (loading) {
    return (
      <Box>
        <SkeletonCard height={80} />
        <Grid container spacing={3} sx={{ mt: 1, mb: 3 }}>
          {[1, 2, 3].map((k) => (
            <Grid item xs={12} sm={4} key={k}>
              <SkeletonCard height={140} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <SkeletonCard height={280} />
          </Grid>
          <Grid item xs={12} md={8}>
            <SkeletonCard height={280} />
          </Grid>
          <Grid item xs={12}>
            <SkeletonCard height={300} />
          </Grid>
        </Grid>
        <SkeletonCard height={480} />
      </Box>
    );
  }

  return (
    <Box>
      {!loading && notFound && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This reconciliation run was not found. It may have been removed, or the link may be invalid.
        </Alert>
      )}

      {!loading && error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => void load()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {!loading && run != null && detail != null && (
        <>
          {detail.data.summary.quick_insights.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Quick insights
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
                {detail.data.summary.quick_insights.map((t) => (
                  <li key={t}>
                    <Typography variant="body2">{t}</Typography>
                  </li>
                ))}
              </Box>
            </Alert>
          )}

          <PageHeader
            title="Reconciliation run"
            subtitle={`Created ${formatDateTime(run.created_at)}${
              run.started_at ? ` · Started ${formatDateTime(run.started_at)}` : ""
            }${lastUpdated ? ` · Updated ${lastUpdated.toLocaleString()}` : ""}`}
            actions={
              <Box sx={{ display: "flex", gap: 1 }}>
                <StatusChip status={run.status} />
                <Button variant="outlined" size="small" onClick={() => void load()} disabled={loading}>
                  Refresh
                </Button>
              </Box>
            }
          />

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <KPICard label="Matched lines" value={detail.data.summary.matched_lines} decimals={0} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <KPICard label="Unmatched lines" value={detail.data.summary.unmatched_lines} decimals={0} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <KPICard
                label="Mismatch rate"
                value={
                  detail.data.summary.mismatch_rate_pct != null
                    ? parseDecimal(detail.data.summary.mismatch_rate_pct)
                    : 0
                }
                suffix="%"
                decimals={1}
              />
            </Grid>
          </Grid>

          {run.error_message && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {run.error_message}
            </Alert>
          )}

          {lineAgg && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Line rollup (items): {lineAgg.matched_lines} matched · {lineAgg.unmatched_lines} unmatched
              ({lineAgg.only_left} left-only · {lineAgg.only_right} right-only) · {itemsTotal} movements
            </Typography>
          )}

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <GlassCard animateEntrance={false} sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Matched vs unmatched
                  </Typography>
                  {matchPieData.length === 0 ? (
                    <Typography color="text.secondary">No counts.</Typography>
                  ) : (
                    <ChartFrame
                      label="Donut chart of matched versus unmatched lines for this run"
                      summary={describeSlices(matchPieData)}
                    >
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={matchPieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={44}
                          outerRadius={72}
                          paddingAngle={2}
                          animationDuration={CHART_ANIMATION.duration}
                          animationEasing={CHART_ANIMATION.easing}
                        >
                          {matchPieData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={entry.name === "Matched" ? "#059669" : "#DC2626"}
                              stroke="none"
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip valueFormatter={(v) => v.toLocaleString()} />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    </ChartFrame>
                  )}
                </CardContent>
              </GlassCard>
            </Grid>
            <Grid item xs={12} md={8}>
              <GlassCard animateEntrance={false} sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Mismatch distribution by type
                  </Typography>
                  {barData.length === 0 ? (
                    <Typography color="text.secondary">No breakdown.</Typography>
                  ) : (
                    <ChartFrame
                      label="Bar chart of mismatch distribution by type"
                      summary={barData.map((d) => `${d.name} ${d.count}`).join(", ")}
                    >
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar
                          dataKey="count"
                          fill="#1A56DB"
                          radius={[4, 4, 0, 0]}
                          animationDuration={CHART_ANIMATION.duration}
                          animationEasing={CHART_ANIMATION.easing}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    </ChartFrame>
                  )}
                </CardContent>
              </GlassCard>
            </Grid>
            <Grid item xs={12}>
              <GlassCard animateEntrance={false}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Reconciliation runs over time
                  </Typography>
                  {timelineData.length === 0 ? (
                    <Typography color="text.secondary">No timeline points.</Typography>
                  ) : (
                    <ChartFrame
                      label="Line chart of matched and unmatched lines over time"
                      summary={`${timelineData.length} point${timelineData.length === 1 ? "" : "s"} in the run timeline.`}
                    >
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={timelineData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="matched"
                          name="Matched"
                          stroke="#059669"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          animationDuration={CHART_ANIMATION.duration}
                          animationEasing={CHART_ANIMATION.easing}
                        />
                        <Line
                          type="monotone"
                          dataKey="unmatched"
                          name="Unmatched"
                          stroke="#DC2626"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          animationDuration={CHART_ANIMATION.duration}
                          animationEasing={CHART_ANIMATION.easing}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    </ChartFrame>
                  )}
                </CardContent>
              </GlassCard>
            </Grid>
          </Grid>

          <GlassCard animateEntrance={false} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Match lines
              </Typography>
              {items.length === 0 ? (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No rows on this run for the current filters or the run has no stored items.
                </Alert>
              ) : (
                <Box sx={{ height: 480, width: "100%" }}>
                  <DataTable
                    rows={itemRows}
                    columns={itemColumns}
                    pageSizeOptions={[25, 50, 100]}
                    initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                    exportFileName="reconciliation-items"
                  />
                </Box>
              )}
            </CardContent>
          </GlassCard>
        </>
      )}
    </Box>
  );
}
