import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

import { SkeletonCard } from "../../components/ui/SkeletonCard";
import { AuthBootstrap } from "../bootstrap/AuthBootstrap";
import { AppLayout } from "../layout/AppLayout";
import { NotFoundPage } from "../pages/NotFoundPage";
import { UnauthorizedPage } from "../pages/UnauthorizedPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";
import { LoginPage } from "../../features/auth/pages/LoginPage";
import { DashboardPage } from "../../features/dashboard/pages/DashboardPage";
import { ReconciliationRunDetailPage } from "../../features/reconciliation/pages/ReconciliationRunDetailPage";
import { ReconciliationRunsPage } from "../../features/reconciliation/pages/ReconciliationRunsPage";
import { ReportDetailPage } from "../../features/reports/pages/ReportDetailPage";
import { ReportsPage } from "../../features/reports/pages/ReportsPage";
import { TransactionIngestPage } from "../../features/transactions/pages/TransactionIngestPage";

// Lazy: the Operations page pulls in @mui/x-date-pickers + dayjs, which would
// otherwise land in the main bundle for every route.
const OperationsPage = lazy(() =>
  import("../../features/operations/pages/OperationsPage").then((m) => ({
    default: m.OperationsPage,
  })),
);

export const router = createBrowserRouter([
  {
    element: (
      <AuthBootstrap>
        <ProtectedRoute />
      </AuthBootstrap>
    ),
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <DashboardPage />, handle: { breadcrumb: "Dashboard" } },
          {
            path: "/reconciliations",
            element: <ReconciliationRunsPage />,
            handle: { breadcrumb: "Reconciliations" },
          },
          {
            path: "/reconciliations/:runId",
            element: <ReconciliationRunDetailPage />,
            handle: { breadcrumb: "Run Detail" },
          },
          { path: "/reports", element: <ReportsPage />, handle: { breadcrumb: "Reports" } },
          {
            path: "/reports/:reportId",
            element: <ReportDetailPage />,
            handle: { breadcrumb: "Report Detail" },
          },
          {
            element: <RoleRoute allow={["admin", "accountant"]} />,
            children: [
              {
                path: "/operations",
                element: (
                  <Suspense fallback={<SkeletonCard height={480} />}>
                    <OperationsPage />
                  </Suspense>
                ),
                handle: { breadcrumb: "Operations" },
              },
              {
                path: "/transactions/ingest",
                element: <TransactionIngestPage />,
                handle: { breadcrumb: "Transactions" },
              },
            ],
          },
          { path: "/unauthorized", element: <UnauthorizedPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "*", element: <NotFoundPage /> },
]);
