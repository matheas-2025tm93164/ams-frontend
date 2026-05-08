import { useEffect, useId, useState, type FormEvent } from "react";
import {
  activateUserAccount,
  deactivateUserAccount,
  fetchAdminStaffRoster,
  onboardStaffUser,
  patchAdminStaffUser,
} from "../api/client";
import type { AdminUserRow } from "../api/types";
import { AccessibleDialog } from "../components/AccessibleDialog";
import { RowActionMenu } from "../components/RowActionMenu";

const AADHAR_LEN = 12;

export function ManageStaffPage() {
  const formId = useId();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [activateConfirmId, setActivateConfirmId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const isEditMode = editUserId !== null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhar, setAadhar] = useState("");

  async function load() {
    setErr(null);
    try {
      const data = await fetchAdminStaffRoster();
      setRows(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onDeactivate() {
    if (!confirmId) return;
    setErr(null);
    try {
      await deactivateUserAccount(confirmId);
      setConfirmId(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function onActivate() {
    if (!activateConfirmId) return;
    setErr(null);
    try {
      await activateUserAccount(activateConfirmId);
      setActivateConfirmId(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    }
  }

  function resetForm() {
    setEmail("");
    setPassword("");
    setFullName("");
    setAddress("");
    setPhone("");
    setAadhar("");
  }

  function closeModal() {
    setModalOpen(false);
    setEditUserId(null);
    resetForm();
  }

  function openOnboardModal() {
    setErr(null);
    setEditUserId(null);
    resetForm();
    setModalOpen(true);
  }

  function openEditStaff(row: AdminUserRow) {
    setErr(null);
    setEditUserId(row.id);
    setEmail(row.email);
    setFullName(row.full_name);
    setAddress(row.address ?? "");
    setPhone(row.phone ?? "");
    setAadhar("");
    setPassword("");
    setModalOpen(true);
  }

  async function onSubmitStaff(e: FormEvent) {
    e.preventDefault();
    if (isEditMode) {
      if (aadhar.trim() && aadhar.trim().length !== AADHAR_LEN) {
        setErr(`Aadhar must be ${AADHAR_LEN} digits or leave blank to keep the current value.`);
        return;
      }
    } else if (!/^\d{12}$/.test(aadhar.trim())) {
      setErr("Aadhar must be exactly 12 digits.");
      return;
    }
    if (!isEditMode && password.length < 10) {
      setErr("Password must be at least 10 characters.");
      return;
    }
    if (isEditMode && password.trim() && password.length < 10) {
      setErr("New password must be at least 10 characters or leave blank.");
      return;
    }
    setErr(null);
    try {
      if (isEditMode && editUserId) {
        const body: {
          full_name: string;
          address: string;
          phone: string;
          aadhar?: string;
          password?: string;
        } = {
          full_name: fullName.trim(),
          address: address.trim(),
          phone: phone.trim(),
        };
        if (aadhar.trim().length === AADHAR_LEN) {
          body.aadhar = aadhar.trim();
        }
        if (password.trim().length >= 10) {
          body.password = password.trim();
        }
        await patchAdminStaffUser(editUserId, body);
      } else {
        await onboardStaffUser({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          address: address.trim(),
          phone: phone.trim(),
          aadhar: aadhar.trim(),
        });
      }
      closeModal();
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  const confirmRow = rows.find((r) => r.id === confirmId);
  const activateRow = rows.find((r) => r.id === activateConfirmId);

  return (
    <div className="page stack-lg">
      <header className="page-header">
        <h1 id={`${formId}-title`}>Manage staff</h1>
        <p className="lede">
          Onboard maintenance staff and mark accounts as resigned when they leave.
        </p>
      </header>

      {err && (
        <div className="alert alert-error" role="alert">
          {err}
        </div>
      )}

      <section className="card" aria-labelledby={`${formId}-actions`}>
        <div className="card-head">
          <h2 id={`${formId}-actions`} className="card-title">
            Staff roster
          </h2>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openOnboardModal}
          >
            <span className="mi" aria-hidden="true">person_add</span> Onboard staff
          </button>
        </div>

        <div
          className="table-scroll"
          role="region"
          aria-label="Maintenance staff table"
          tabIndex={0}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Address</th>
                <th scope="col">Aadhar</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.full_name}</td>
                  <td>{r.email}</td>
                  <td>{r.phone ?? "—"}</td>
                  <td className="desc">{r.address ?? "—"}</td>
                  <td>{r.aadhar_masked ?? "—"}</td>
                  <td>
                    <span className={`status-pill status-${r.account_status}`}>
                      {r.account_status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {r.account_status === "active" ? (
                        <RowActionMenu
                          compact
                          ariaLabel={`Actions for ${r.full_name}`}
                          items={[
                            {
                              label: "Edit",
                              icon: "edit",
                              onSelect: () => openEditStaff(r),
                            },
                            {
                              label: "Deactivate",
                              icon: "person_off",
                              onSelect: () => setConfirmId(r.id),
                            },
                          ]}
                        />
                      ) : r.account_status === "resigned" ? (
                        <RowActionMenu
                          compact
                          ariaLabel={`Actions for ${r.full_name}`}
                          items={[
                            {
                              label: "Edit",
                              icon: "edit",
                              onSelect: () => openEditStaff(r),
                            },
                            {
                              label: "Activate",
                              icon: "person",
                              onSelect: () => setActivateConfirmId(r.id),
                            },
                          ]}
                        />
                      ) : (
                        <span className="subtle">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AccessibleDialog open={modalOpen} onClose={closeModal} labelledBy={`${formId}-onboard-title`} wide>
        <h3 id={`${formId}-onboard-title`}>
          {isEditMode ? "Edit staff member" : "Onboard staff member"}
        </h3>
        <form className="stack-form" onSubmit={onSubmitStaff}>
          <div className="field">
            <label htmlFor={`${formId}-email`}>Work email</label>
            <input id={`${formId}-email`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required={!isEditMode} disabled={isEditMode} readOnly={isEditMode} />
          </div>
          <div className="field">
            <label htmlFor={`${formId}-pw`}>{isEditMode ? "New password (optional, min 10 characters)" : "Initial password"}</label>
            <input id={`${formId}-pw`} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required={!isEditMode} minLength={isEditMode ? undefined : 10} />
          </div>
          <div className="field">
            <label htmlFor={`${formId}-name`}>Full name</label>
            <input id={`${formId}-name`} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor={`${formId}-addr`}>Address</label>
            <textarea id={`${formId}-addr`} rows={2} value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor={`${formId}-phone`}>Phone</label>
            <input id={`${formId}-phone`} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor={`${formId}-aadhar`}>Aadhar ({AADHAR_LEN} digits){isEditMode ? " — leave blank to keep current" : ""}</label>
            <input id={`${formId}-aadhar`} inputMode="numeric" pattern="\d{12}" maxLength={12} value={aadhar} onChange={(e) => setAadhar(e.target.value.replace(/\D/g, "").slice(0, AADHAR_LEN))} required={!isEditMode} />
          </div>
          <div className="actions">
            <button type="submit" className="btn btn-primary">
              <span className="mi" aria-hidden="true">{isEditMode ? "save" : "person_add"}</span> {isEditMode ? "Save changes" : "Create account"}
            </button>
            <button type="button" className="secondary" onClick={closeModal}>Cancel</button>
          </div>
        </form>
      </AccessibleDialog>

      <AccessibleDialog open={!!(confirmId && confirmRow)} onClose={() => setConfirmId(null)} labelledBy={`${formId}-deact-title`} narrow>
        <h3 id={`${formId}-deact-title`}>Deactivate staff member</h3>
        <p>
          Mark <strong>{confirmRow?.full_name}</strong> as resigned? They will
          no longer be able to sign in or receive new assignments.
        </p>
        <div className="actions">
          <button type="button" className="secondary" onClick={() => setConfirmId(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={onDeactivate}>
            <span className="mi" aria-hidden="true">person_off</span> Confirm deactivation
          </button>
        </div>
      </AccessibleDialog>

      <AccessibleDialog open={!!(activateConfirmId && activateRow)} onClose={() => setActivateConfirmId(null)} labelledBy={`${formId}-act-title`} narrow>
        <h3 id={`${formId}-act-title`}>Activate staff member</h3>
        <p>
          Restore <strong>{activateRow?.full_name}</strong> to active? They will be
          able to sign in again with their existing password.
        </p>
        <p className="subtle">
          If the password needs to be reset, use <strong>Edit</strong> first.
        </p>
        <div className="actions">
          <button type="button" className="secondary" onClick={() => setActivateConfirmId(null)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={onActivate}>
            <span className="mi" aria-hidden="true">person</span> Confirm activation
          </button>
        </div>
      </AccessibleDialog>
    </div>
  );
}
