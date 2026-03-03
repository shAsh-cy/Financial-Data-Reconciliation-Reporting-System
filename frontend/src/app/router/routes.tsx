import { createBrowserRouter } from "react-router-dom";

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
          { path: "/", element: <DashboardPage /> },
          { path: "/reconciliations", element: <ReconciliationRunsPage /> },
          { path: "/reconciliations/:runId", element: <ReconciliationRunDetailPage /> },
          { path: "/reports", element: <ReportsPage /> },
          { path: "/reports/:reportId", element: <ReportDetailPage /> },
          {
            element: <RoleRoute allow={["admin", "accountant"]} />,
            children: [{ path: "/transactions/ingest", element: <TransactionIngestPage /> }],
          },
          { path: "/unauthorized", element: <UnauthorizedPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "*", element: <NotFoundPage /> }
]);

