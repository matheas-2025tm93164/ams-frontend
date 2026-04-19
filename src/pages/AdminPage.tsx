import { useEffect, useState, type FormEvent } from "react";
import {
  fetchAnalytics,
  fetchComplaints,
  fetchMaintenanceStaff,
  patchComplaint,
} from "../api/client";
import type { Complaint, User } from "../api/types";

export function AdminPage() {
  const [rows, setRows] = useState<Complaint[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<{ category: string; count: number }[]>(
    [],
  );
  const [status, setStatus] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const [list, team, stats] = await Promise.all([
        fetchComplaints({
          status: status || undefined,
          category: category || undefined,
          priority: priority || undefined,
        }),
        fetchMaintenanceStaff(),
        fetchAnalytics(),
      ]);
      setRows(list);
      setStaff(team);
      setAnalytics(stats.by_category);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onFilter(e: FormEvent) {
    e.preventDefault();
    await load();
  }

  async function assign(publicId: string, staffId: string) {
    setErr(null);
    try {
      await patchComplaint(publicId, { assigned_staff_id: staffId });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Assign failed");
    }
  }

  return (
    <div className="page">
      <h1>Admin</h1>
      {err && <p className="error">{err}</p>}
      <section className="panel">
        <h2>Analytics</h2>
        <ul className="analytics">
          {analytics.map((a) => (
            <li key={a.category}>
              {a.category}: <strong>{a.count}</strong>
            </li>
          ))}
        </ul>
      </section>
      <section className="panel">
        <h2>Filters</h2>
        <form onSubmit={onFilter} className="grid-form filters">
          <label>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Any</option>
              <option value="pending">pending</option>
              <option value="in_progress">in_progress</option>
              <option value="resolved">resolved</option>
              <option value="completed">completed</option>
            </select>
          </label>
          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Any</option>
              <option value="plumbing">plumbing</option>
              <option value="electrical">electrical</option>
              <option value="cleaning">cleaning</option>
              <option value="appliance">appliance</option>
              <option value="other">other</option>
            </select>
          </label>
          <label>
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="">Any</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <button type="submit">Apply</button>
        </form>
      </section>
      <section className="panel">
        <h2>All complaints</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Resident</th>
              <th>Assignee</th>
              <th>Assign</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.public_id}>
                <td>{c.public_id}</td>
                <td>{c.status}</td>
                <td className="mono">{c.resident_id}</td>
                <td className="mono">{c.assigned_staff_id ?? "—"}</td>
                <td>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) void assign(c.public_id, v);
                    }}
                  >
                    <option value="">Select staff</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
