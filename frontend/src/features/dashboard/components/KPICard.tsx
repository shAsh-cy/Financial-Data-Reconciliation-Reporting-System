import { Card, CardContent, Skeleton, Typography } from "@mui/material";

type KPICardProps = {
  title: string;
  value: string | number | null;
  loading?: boolean;
  error?: string | null;
};

export function KPICard({ title, value, loading, error }: KPICardProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        {loading ? (
          <Skeleton variant="text" width="60%" height={36} />
        ) : error ? (
          <Typography color="error" variant="h6">
            {error}
          </Typography>
        ) : (
          <Typography variant="h5" fontWeight={600}>
            {value ?? "—"}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
