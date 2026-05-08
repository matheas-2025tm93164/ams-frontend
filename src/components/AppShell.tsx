import { useId, useState } from "react";
import { Link, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AccessibleDialog } from "./AccessibleDialog";

export function AppShell() {
  const { user, logout, loading } = useAuth();
  const signOutDialogId = useId();
  const [signOutOpen, setSignOutOpen] = useState(false);

  if (loading) {
    return (
      <p className="centered" role="status" aria-live="polite">
        Loading…
      </p>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="top" role="banner">
        <Link to="/" className="brand">
          Apartment Maintenance
        </Link>
        <nav className="top-nav" aria-label="Primary">
          {user.role === "resident" && (
            <Link to="/resident">My complaints</Link>
          )}
          {user.role === "admin" && (
            <>
              <Link to="/admin">Complaints</Link>
              <Link to="/admin/staff">Staff</Link>
              <Link to="/admin/residents">Residents</Link>
            </>
          )}
          {user.role === "maintenance_staff" && (
            <Link to="/staff">Assigned work</Link>
          )}
          {(user.role === "admin" || user.role === "maintenance_staff") && (
            <Link to="/reviews">Reviews</Link>
          )}
          <span className="who">
            <span className="sr-only">Signed in as </span>
            {user.full_name}
            <span className="role-badge">{user.role.replace("_", " ")}</span>
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setSignOutOpen(true)}
          >
            <span className="mi mi-sm" aria-hidden="true">logout</span> Sign out
          </button>
        </nav>
      </header>
      <main id="main-content" className="main-region" tabIndex={-1}>
        <Outlet />
      </main>

      <AccessibleDialog
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        labelledBy={`${signOutDialogId}-title`}
        describedBy={`${signOutDialogId}-desc`}
        narrow
      >
        <h3 id={`${signOutDialogId}-title`}>Sign out?</h3>
        <p id={`${signOutDialogId}-desc`} className="modal-hint">
          You will need to sign in again to use the application.
        </p>
        <div className="actions">
          <button
            type="button"
            className="secondary"
            onClick={() => setSignOutOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setSignOutOpen(false);
              logout();
            }}
          >
            <span className="mi" aria-hidden="true">logout</span> Sign out
          </button>
        </div>
      </AccessibleDialog>
    </div>
  );
}
