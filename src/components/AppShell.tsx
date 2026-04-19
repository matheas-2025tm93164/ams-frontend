import { Link, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AppShell() {
  const { user, logout, loading } = useAuth();
  if (loading) {
    return <p className="centered">Loading</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="shell">
      <header className="top">
        <Link to="/" className="brand">
          Apartment Maintenance
        </Link>
        <nav>
          {user.role === "resident" && <Link to="/resident">Complaints</Link>}
          {user.role === "admin" && <Link to="/admin">Admin</Link>}
          {user.role === "maintenance_staff" && <Link to="/staff">Tasks</Link>}
          <span className="who">
            {user.full_name} ({user.role})
          </span>
          <button type="button" className="linkish" onClick={logout}>
            Sign out
          </button>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
