import { useEffect, useState, type FormEvent } from "react";
import {
  createComplaint,
  fetchComplaints,
  patchComplaint,
  uploadAttachment,
} from "../api/client";
import type { Complaint } from "../api/types";

export function ResidentPage() {
  const [rows, setRows] = useState<Complaint[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [category, setCategory] = useState("plumbing");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [completeFor, setCompleteFor] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);

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

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await createComplaint({ category, priority, description });
      setDescription("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create failed");
    }
  }

  async function onComplete(e: FormEvent) {
    e.preventDefault();
    if (!completeFor) return;
    setErr(null);
    try {
      await patchComplaint(completeFor, {
        resident_feedback: feedback || undefined,
        rating,
      });
      setCompleteFor(null);
      setFeedback("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div className="page">
      <h1>My complaints</h1>
      {err && <p className="error">{err}</p>}
      <section className="panel">
        <h2>New complaint</h2>
        <form onSubmit={onCreate} className="grid-form">
          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="cleaning">Cleaning</option>
              <option value="appliance">Appliance</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="full">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
            />
          </label>
          <button type="submit">Submit</button>
        </form>
      </section>
      <section className="panel">
        <h2>Submitted</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.public_id}>
                <td>{c.public_id}</td>
                <td>{c.status}</td>
                <td>{c.category}</td>
                <td>{c.priority}</td>
                <td>{new Date(c.updated_at).toLocaleString()}</td>
                <td>
                  {c.status === "pending" && (
                    <label className="inline-file">
                      Attach image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={async (ev) => {
                          const f = ev.target.files?.[0];
                          if (!f) return;
                          try {
                            await uploadAttachment(c.public_id, f);
                            await load();
                          } catch (e) {
                            setErr(
                              e instanceof Error ? e.message : "Upload failed",
                            );
                          }
                        }}
                      />
                    </label>
                  )}
                  {c.status === "resolved" && (
                    <button
                      type="button"
                      onClick={() => setCompleteFor(c.public_id)}
                    >
                      Mark completed
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {completeFor && (
        <div className="modal">
          <div className="modal-inner">
            <h3>Complete {completeFor}</h3>
            <form onSubmit={onComplete}>
              <label>
                Feedback
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                />
              </label>
              <label>
                Rating (1-5)
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                />
              </label>
              <div className="actions">
                <button type="submit">Submit</button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setCompleteFor(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
