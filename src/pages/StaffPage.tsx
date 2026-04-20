import { useEffect, useState, type FormEvent } from "react";
import { fetchComplaints, patchComplaint } from "../api/client";
import type { Complaint, ComplaintStatus } from "../api/types";
import { nextStaffStatus } from "../domain/complaintWorkflow";

export function StaffPage() {
  const [rows, setRows] = useState<Complaint[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const data = await fetchComplaints({});
      setRows(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function advance(e: FormEvent, publicId: string, current: ComplaintStatus) {
    e.preventDefault();
    const n = nextStaffStatus(current);
    if (!n) return;
    setErr(null);
    try {
      await patchComplaint(publicId, { status: n });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div className="page">
      <h1>Assigned work</h1>
      {err && <p className="error">{err}</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Category</th>
            <th>Description</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const n = nextStaffStatus(c.status);
            return (
              <tr key={c.public_id}>
                <td>{c.public_id}</td>
                <td>{c.status}</td>
                <td>{c.category}</td>
                <td className="desc">{c.description.slice(0, 120)}</td>
                <td>
                  {n ? (
                    <form onSubmit={(e) => advance(e, c.public_id, c.status)}>
                      <button type="submit">Set {n}</button>
                    </form>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
