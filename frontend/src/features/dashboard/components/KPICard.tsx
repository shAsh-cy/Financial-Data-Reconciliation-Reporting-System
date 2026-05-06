import { Card, CardContent, Skeleton, Typography } from "@mui/material";

type KPICardProps = {
  title: string;
  value: string | number | null;
  loading?: boolean;
  error?: string | null;
  deltaLabel?: string | null;
  deltaTrend?: "up" | "down" | "flat";
};

export function KPICard({
  title,
  value,
  loading,
  error,
  deltaLabel,
  deltaTrend,
}: KPICardProps) {
  const deltaColor =
    deltaTrend === "up" ? "success.main" : deltaTrend === "down" ? "error.main" : "text.secondary";

  return (
    <Card
      sx={{
        transition: "box-shadow 0.2s ease, transform 0.15s ease",
        "&:hover": { boxShadow: 4 },
      }}
    >
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        {loading ? (
          <Skeleton variant="text" width="60%" height={36} animation="wave" />
        ) : error ? (
          <Typography color="error" variant="h6">
            {error}
          </Typography>
        ) : (
          <>
            <Typography variant="h5" fontWeight={600} component="div">
              {value ?? "—"}
            </Typography>
            {deltaLabel && (
              <Typography variant="caption" color={deltaColor} sx={{ display: "block", mt: 0.5 }}>
                {deltaTrend === "up" ? "↑ " : deltaTrend === "down" ? "↓ " : ""}
                {deltaLabel}
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
