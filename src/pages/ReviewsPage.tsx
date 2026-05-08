import { useEffect, useId, useState } from "react";
import { fetchMaintenanceStaff, fetchReviews } from "../api/client";
import type { Review, User } from "../api/types";
import { useAuth } from "../context/AuthContext";

const RATING_OPTIONS = ["All", "1", "2", "3", "4", "5"] as const;

export function ReviewsPage() {
  const formId = useId();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [rows, setRows] = useState<Review[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [ratingFilter, setRatingFilter] = useState("");
  const [staffFilter, setStaffFilter] = useState("");

  async function load() {
    setErr(null);
    try {
      const params: { rating?: string; staff_id?: string } = {};
      if (ratingFilter) params.rating = ratingFilter;
      if (staffFilter) params.staff_id = staffFilter;
      const data = await fetchReviews(params);
      setRows(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }

  async function loadStaff() {
    if (!isAdmin) return;
    try {
      const team = await fetchMaintenanceStaff();
      setStaff(team);
    } catch {
      /* staff list is supplementary */
    }
  }

  useEffect(() => {
    void loadStaff();
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [ratingFilter, staffFilter]);

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${date}, ${time}`;
  }

  function renderStars(count: number): string {
    return "\u2605".repeat(count) + "\u2606".repeat(5 - count);
  }

  return (
    <div className="page stack-lg">
      <header className="page-header">
        <h1 id={`${formId}-title`}>Reviews</h1>
        <p className="lede">
          Feedback and ratings from residents for completed complaints.
        </p>
      </header>

      {err && (
        <div className="alert alert-error" role="alert">
          {err}
        </div>
      )}

      <section className="card" aria-labelledby={`${formId}-table`}>
        <div className="card-head">
          <h2 id={`${formId}-table`} className="card-title">
            All reviews
          </h2>
          <div className="filters-inline">
            <div className="field field-inline">
              <label htmlFor={`${formId}-rating`}>Rating</label>
              <select
                id={`${formId}-rating`}
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
              >
                {RATING_OPTIONS.map((opt) => (
                  <option key={opt} value={opt === "All" ? "" : opt}>
                    {opt === "All" ? "All" : `${opt} \u2605`}
                  </option>
                ))}
              </select>
            </div>

            {isAdmin && (
              <div className="field field-inline">
                <label htmlFor={`${formId}-staff`}>Staff</label>
                <select
                  id={`${formId}-staff`}
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div
          className="table-scroll"
          role="region"
          aria-label="Reviews table"
          tabIndex={0}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Complaint ID</th>
                {isAdmin && <th scope="col">Staff</th>}
                <th scope="col">Rating</th>
                <th scope="col">Feedback</th>
                <th scope="col">Completed</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="subtle" style={{ textAlign: "center" }}>
                    No reviews found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.public_id}>
                    <td>
                      <code className="code-quiet">{r.public_id}</code>
                    </td>
                    {isAdmin && (
                      <td>{r.assigned_staff_name ?? <span className="subtle">Unassigned</span>}</td>
                    )}
                    <td>
                      <span className="rating-stars" aria-label={`${r.rating} out of 5`}>
                        {renderStars(r.rating)}
                      </span>
                    </td>
                    <td className="desc">
                      {r.resident_feedback || <span className="subtle">No feedback</span>}
                    </td>
                    <td>
                      <time dateTime={r.completed_at}>
                        {formatDate(r.completed_at)}
                      </time>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
