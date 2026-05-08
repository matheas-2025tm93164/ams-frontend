import { useId } from "react";
import { AccessibleDialog } from "./AccessibleDialog";

interface Props {
  publicId: string | null;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function DeleteComplaintConfirmModal({
  publicId,
  isBusy,
  onCancel,
  onConfirm,
}: Props) {
  const titleId = useId();
  const descId = useId();

  return (
    <AccessibleDialog
      open={!!publicId}
      onClose={() => { if (!isBusy) onCancel(); }}
      labelledBy={titleId}
      describedBy={descId}
      narrow
    >
      <h3 id={titleId}>Delete this complaint?</h3>
      <p id={descId} className="modal-hint">
        Complaint <code className="code-quiet">{publicId}</code> will be
        removed permanently. This cannot be undone.
      </p>
      <div className="actions">
        <button
          type="button"
          className="secondary"
          disabled={isBusy}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-danger"
          disabled={isBusy}
          onClick={() => void Promise.resolve(onConfirm())}
        >
          <span className="mi" aria-hidden="true">delete</span> {isBusy ? "Deleting…" : "Delete complaint"}
        </button>
      </div>
    </AccessibleDialog>
  );
}
