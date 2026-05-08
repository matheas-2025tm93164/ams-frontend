import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import {
  createComplaint,
  deleteComplaint,
  fetchComplaints,
  patchComplaint,
  uploadAttachment,
} from "../api/client";
import type { Complaint } from "../api/types";
import { AccessibleDialog } from "../components/AccessibleDialog";
import { DeleteComplaintConfirmModal } from "../components/DeleteComplaintConfirmModal";
import { RowActionMenu } from "../components/RowActionMenu";
import { StarRatingInput } from "../components/StarRatingInput";

export function ResidentPage() {
  const formId = useId();
  const [rows, setRows] = useState<Complaint[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [completeFor, setCompleteFor] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [editFor, setEditFor] = useState<Complaint | null>(null);
  const [isNewMode, setIsNewMode] = useState(false);
  const [modalCategory, setModalCategory] = useState("plumbing");
  const [modalPriority, setModalPriority] = useState("medium");
  const [modalDescription, setModalDescription] = useState("");

  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);

  const modalOpen = isNewMode || editFor !== null;

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

  useEffect(() => {
    if (completeFor) {
      setFeedback("");
      setRating(5);
    }
  }, [completeFor]);

  function openNewComplaint() {
    setErr(null);
    setEditFor(null);
    setIsNewMode(true);
    setModalCategory("plumbing");
    setModalPriority("medium");
    setModalDescription("");
  }

  function openEditComplaint(c: Complaint) {
    setErr(null);
    setIsNewMode(false);
    setEditFor(c);
    setModalCategory(c.category);
    setModalPriority(c.priority);
    setModalDescription(c.description);
  }

  function closeModal() {
    setEditFor(null);
    setIsNewMode(false);
  }

  async function onModalSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      if (isNewMode) {
        await createComplaint({
          category: modalCategory,
          priority: modalPriority,
          description: modalDescription,
        });
      } else if (editFor) {
        await patchComplaint(editFor.public_id, {
          category: modalCategory,
          priority: modalPriority,
          description: modalDescription,
        });
      }
      closeModal();
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
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

  async function onReopen(publicId: string) {
    setErr(null);
    try {
      await patchComplaint(publicId, { status: "pending" as const });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Reopen failed");
    }
  }

  const dismissDeleteModal = useCallback(() => setDeleteTarget(null), []);

  async function confirmDeleteComplaint() {
    if (!deleteTarget) return;
    setErr(null);
    setDeleteBusy(true);
    try {
      await deleteComplaint(deleteTarget);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleteBusy(false);
    }
  }

  const modalTitle = isNewMode
    ? "New complaint"
    : `Edit ${editFor?.public_id ?? ""}`;
  const modalHint = isNewMode
    ? "Submit a new maintenance request."
    : "You can update details while this request is still pending.";
  const submitLabel = isNewMode ? "Submit complaint" : "Save changes";

  return (
    <div className="page stack-lg">
      <header className="page-header">
        <h1 id={`${formId}-title`}>My complaints</h1>
        <p className="lede">
          Submit maintenance requests and track them until completion.
        </p>
      </header>

      {err && (
        <div className="alert alert-error" role="alert">
          {err}
        </div>
      )}

      <section className="card" aria-labelledby={`${formId}-list`}>
        <div className="card-head">
          <h2 id={`${formId}-list`} className="card-title">
            My complaints
          </h2>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openNewComplaint}
          >
            <span className="mi" aria-hidden="true">add</span> Add complaint
          </button>
        </div>
        <div
          className="table-scroll"
          role="region"
          aria-label="Your complaints"
          tabIndex={0}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Status</th>
                <th scope="col">Category</th>
                <th scope="col">Priority</th>
                <th scope="col">Updated</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.public_id}>
                  <td>
                    <code className="code-quiet">{c.public_id}</code>
                  </td>
                  <td>
                    <span className={`status-pill status-${c.status}`}>
                      {c.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>{c.category}</td>
                  <td>{c.priority}</td>
                  <td>
                    <time dateTime={c.updated_at}>
                      {new Date(c.updated_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}{", "}
                      {new Date(c.updated_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </time>
                  </td>
                  <td>
                    <div className="table-actions">
                      {c.status === "pending" && (
                        <>
                          <input
                            id={`${formId}-file-${c.public_id}`}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="sr-only"
                            onChange={async (ev) => {
                              const f = ev.target.files?.[0];
                              if (!f) return;
                              try {
                                await uploadAttachment(c.public_id, f);
                                await load();
                              } catch (e) {
                                setErr(
                                  e instanceof Error
                                    ? e.message
                                    : "Upload failed",
                                );
                              }
                            }}
                          />
                          <RowActionMenu
                            compact
                            ariaLabel={`Actions for complaint ${c.public_id}`}
                            items={[
                              {
                                label: "Attach image",
                                icon: "attach_file",
                                onSelect: () => {
                                  document.getElementById(`${formId}-file-${c.public_id}`)?.click();
                                },
                              },
                              {
                                label: "Edit",
                                icon: "edit",
                                onSelect: () => openEditComplaint(c),
                              },
                              {
                                label: "Delete",
                                icon: "delete",
                                onSelect: () => setDeleteTarget(c.public_id),
                              },
                            ]}
                          />
                        </>
                      )}
                      {c.status === "resolved" && (
                        <RowActionMenu
                          compact
                          ariaLabel={`Actions for complaint ${c.public_id}`}
                          items={[
                            {
                              label: "Mark completed",
                              icon: "check_circle",
                              onSelect: () => {
                                setCompleteFor(c.public_id);
                              },
                            },
                            {
                              label: "Reopen",
                              icon: "refresh",
                              onSelect: () => onReopen(c.public_id),
                            },
                          ]}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AccessibleDialog
        open={modalOpen}
        onClose={closeModal}
        labelledBy={`${formId}-modal-title`}
        describedBy={`${formId}-modal-hint`}
      >
        <h3 id={`${formId}-modal-title`}>{modalTitle}</h3>
        <p id={`${formId}-modal-hint`} className="modal-hint">{modalHint}</p>
        <form onSubmit={onModalSubmit} className="stack-form">
          <div className="field">
            <label htmlFor={`${formId}-mcat`}>Category</label>
            <select
              id={`${formId}-mcat`}
              value={modalCategory}
              onChange={(e) => setModalCategory(e.target.value)}
            >
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="cleaning">Cleaning</option>
              <option value="appliance">Appliance</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${formId}-mpri`}>Priority</label>
            <select
              id={`${formId}-mpri`}
              value={modalPriority}
              onChange={(e) => setModalPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${formId}-mdesc`}>Description</label>
            <textarea
              id={`${formId}-mdesc`}
              value={modalDescription}
              onChange={(e) => setModalDescription(e.target.value)}
              required
              rows={4}
            />
          </div>
          <div className="actions">
            <button type="submit" className="btn btn-primary">
              <span className="mi" aria-hidden="true">{isNewMode ? "send" : "save"}</span> {submitLabel}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={closeModal}
            >
              Cancel
            </button>
          </div>
        </form>
      </AccessibleDialog>

      <AccessibleDialog
        open={!!completeFor}
        onClose={() => setCompleteFor(null)}
        labelledBy={`${formId}-dlg-title`}
      >
        <h3 id={`${formId}-dlg-title`}>Complete {completeFor}</h3>
        <form onSubmit={onComplete} className="stack-form">
          <div className="field">
            <label htmlFor={`${formId}-fb`}>Feedback</label>
            <textarea
              id={`${formId}-fb`}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>
          <StarRatingInput
            id={`${formId}-rate`}
            label="Rating"
            value={rating}
            onChange={setRating}
          />
          <div className="actions">
            <button type="submit" className="btn btn-primary">
              <span className="mi" aria-hidden="true">check_circle</span> Submit
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setCompleteFor(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      </AccessibleDialog>

      <DeleteComplaintConfirmModal
        publicId={deleteTarget}
        isBusy={deleteBusy}
        onCancel={dismissDeleteModal}
        onConfirm={confirmDeleteComplaint}
      />
    </div>
  );
}
