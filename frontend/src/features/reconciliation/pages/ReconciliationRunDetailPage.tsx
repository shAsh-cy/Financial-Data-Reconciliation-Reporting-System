import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Link,
  Skeleton,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
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

import { apiErrorDetail } from "../../../api/errors";
import type {
  ReconciliationItemRead,
  ReconciliationRunDetailEnvelope,
  ReconciliationItemsAggregation,
} from "../../../types/reporting";
import { isDemoMeta } from "../../../types/reporting";
import { formatCurrencyDetailed, parseDecimal } from "../../../utils/financialFormat";
import { isValidUuid } from "../../../utils/uuid";
import { KPICard } from "../../dashboard/components/KPICard";
import { reconciliationApi } from "../api/reconciliationApi";

function formatTs(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusChipColor(
  status: string,
): "default" | "success" | "error" | "info" | "warning" {
  switch (status) {
    case "succeeded":
      return "success";
    case "failed":
      return "error";
    case "running":
      return "info";
    default:
      return "warning";
  }
}

function matchChipColor(
  matchType: string,
): "default" | "success" | "warning" | "info" {
  switch (matchType) {
    case "matched":
      return "success";
    case "only_left":
      return "warning";
    case "only_right":
      return "info";
    default:
      return "default";
  }
}

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

function ItemsToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarExport csvOptions={{ fileName: "reconciliation-items" }} />
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  );
}

const PIE_COLORS: Record<string, string> = {
  Matched: "#2e7d32",
  Unmatched: "#c62828",
};

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
      setItems(itemsRes.items);
      setItemsTotal(itemsRes.total);
      setLineAgg(aggregationFromMeta(itemsRes.meta));
      setLastUpdated(new Date());
    } catch (e: unknown) {
      const { status, message } = apiErrorDetail(e, "Failed to load reconciliation.");
      if (import.meta.env.DEV && status === 404) {
        console.warn(
          "[reconciliations] GET detail 404 — check API and VITE_API_BASE_URL (origin only).",
        );
      }
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
  const runDemo = detail != null && isDemoMeta(detail.meta);

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
        type: "singleSelect",
        valueOptions: [
          { value: "matched", label: "Matched" },
          { value: "unmatched", label: "Unmatched" },
        ],
        renderCell: (params) => (
          <Chip
            label={params.value === "matched" ? "Matched" : "Unmatched"}
            size="small"
            color={params.value === "matched" ? "success" : "warning"}
            variant="outlined"
          />
        ),
      },
      {
        field: "match_type",
        headerName: "Match type",
        width: 140,
        type: "singleSelect",
        valueOptions: [
          { value: "matched", label: "matched" },
          { value: "only_left", label: "only_left" },
          { value: "only_right", label: "only_right" },
        ],
        renderCell: (params) => (
          <Chip
            label={String(params.value).replaceAll("_", " ")}
            size="small"
            color={matchChipColor(String(params.value))}
            variant="outlined"
            sx={{ textTransform: "capitalize" }}
          />
        ),
      },
      {
        field: "amountNum",
        headerName: "Amount",
        width: 130,
        type: "number",
        align: "right",
        headerAlign: "right",
        valueFormatter: (v) => (v != null && Number(v) !== 0 ? formatCurrencyDetailed(Number(v)) : "—"),
      },
      {
        field: "left_transaction_id",
        headerName: "Left txn",
        flex: 1,
        minWidth: 120,
        valueFormatter: (v) => (v ? String(v).slice(0, 8) + "…" : "—"),
      },
      {
        field: "right_transaction_id",
        headerName: "Right txn",
        flex: 1,
        minWidth: 120,
        valueFormatter: (v) => (v ? String(v).slice(0, 8) + "…" : "—"),
      },
    ],
    [],
  );

  if (!runId) return null;

  if (badId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">The reconciliation link is not a valid UUID.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component={RouterLink}
          to="/reconciliations"
          underline="hover"
          color="inherit"
          variant="body2"
        >
          Reconciliation runs
        </Link>
        <Typography color="text.primary" variant="body2">
          Run detail
        </Typography>
      </Breadcrumbs>

      {loading && (
        <Box>
          <Skeleton variant="text" width="50%" height={36} sx={{ mb: 2 }} animation="wave" />
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {[1, 2, 3].map((k) => (
              <Grid item xs={12} sm={4} key={k}>
                <Skeleton variant="rectangular" height={96} sx={{ borderRadius: 1 }} animation="wave" />
              </Grid>
            ))}
          </Grid>
          <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 1, mb: 2 }} animation="wave" />
          <Skeleton variant="rectangular" height={400} animation="wave" sx={{ borderRadius: 1 }} />
        </Box>
      )}

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
          {runDemo && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Demo reconciliation — synthetic run and match lines for UI review.
            </Alert>
          )}

          {detail.data.summary.quick_insights.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Quick insights
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {detail.data.summary.quick_insights.map((t) => (
                  <li key={t}>
                    <Typography variant="body2">{t}</Typography>
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          <Box
            sx={{
              mb: 3,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              gap: 2,
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight={600} gutterBottom>
                Reconciliation run
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created {formatTs(run.created_at)}
                {run.started_at ? ` · Started ${formatTs(run.started_at)}` : ""}
              </Typography>
              {lastUpdated && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Last updated {lastUpdated.toLocaleString()}
                </Typography>
              )}
            </Box>
            <Chip label={run.status} color={statusChipColor(run.status)} variant="outlined" />
          </Box>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <KPICard title="Matched lines" value={detail.data.summary.matched_lines} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <KPICard title="Unmatched lines" value={detail.data.summary.unmatched_lines} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <KPICard
                title="Mismatch rate"
                value={
                  detail.data.summary.mismatch_rate_pct != null
                    ? `${parseDecimal(detail.data.summary.mismatch_rate_pct).toFixed(1)}%`
                    : "—"
                }
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
              {" "}({lineAgg.only_left} left-only · {lineAgg.only_right} right-only) · {itemsTotal} movements
            </Typography>
          )}

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%", transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 3 } }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Matched vs unmatched
                  </Typography>
                  {matchPieData.length === 0 ? (
                    <Typography color="text.secondary">No counts.</Typography>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={matchPieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={44}
                          outerRadius={72}
                          paddingAngle={2}
                          isAnimationActive={matchPieData.length < 20}
                        >
                          {matchPieData.map((entry) => (
                            <Cell key={entry.name} fill={PIE_COLORS[entry.name] ?? "#1976d2"} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => v.toLocaleString()} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Card sx={{ height: "100%", transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 3 } }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Mismatch distribution by type
                  </Typography>
                  {barData.length === 0 ? (
                    <Typography color="text.secondary">No breakdown.</Typography>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 3 } }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Reconciliation runs over time
                  </Typography>
                  {timelineData.length === 0 ? (
                    <Typography color="text.secondary">No timeline points.</Typography>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={timelineData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="matched"
                          name="Matched"
                          stroke="#2e7d32"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          isAnimationActive={timelineData.length < 30}
                        />
                        <Line
                          type="monotone"
                          dataKey="unmatched"
                          name="Unmatched"
                          stroke="#c62828"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          isAnimationActive={timelineData.length < 30}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mb: 2, transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 2 } }}>
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
                  <DataGrid
                    rows={itemRows}
                    columns={itemColumns}
                    density="compact"
                    disableRowSelectionOnClick
                    pageSizeOptions={[25, 50, 100]}
                    initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                    slots={{ toolbar: ItemsToolbar }}
                    slotProps={{
                      toolbar: {
                        showQuickFilter: true,
                        quickFilterProps: { debounceMs: 400 },
                      },
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>

          <Button variant="outlined" size="small" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        </>
      )}
    </Box>
  );
}
