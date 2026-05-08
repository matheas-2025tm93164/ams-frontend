import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../api/types";

export function RequireRole({
  role,
  children,
}: {
  role: Role | Role[];
  children: ReactNode;
}) {
  const { user } = useAuth();
  const allowed = Array.isArray(role) ? role : [role];
  if (!user || !allowed.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
