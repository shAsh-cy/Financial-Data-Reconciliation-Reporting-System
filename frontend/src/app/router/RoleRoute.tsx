import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../state/useAuth";

type RoleRouteProps = {
  allow: Array<"admin" | "accountant" | "viewer">;
};

export function RoleRoute({ allow }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(user.role as RoleRouteProps["allow"][number])) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

