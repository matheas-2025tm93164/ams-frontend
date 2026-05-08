import { useEffect, useId, useState, type FormEvent } from "react";
import {
  activateUserAccount,
  deactivateUserAccount,
  fetchAdminResidentsRoster,
  onboardResidentUser,
  patchAdminResidentUser,
} from "../api/client";
import type { AdminUserRow } from "../api/types";
import { AccessibleDialog } from "../components/AccessibleDialog";
import { RowActionMenu } from "../components/RowActionMenu";

const AADHAR_LEN = 12;

export function ManageResidentsPage() {
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
  const [phone, setPhone] = useState("");
  const [aadhar, setAadhar] = useState("");
  const [familyLines, setFamilyLines] = useState<string[]>([""]);

  async function load() {
    setErr(null);
    try {
      const data = await fetchAdminResidentsRoster();
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

  function addFamilyRow() {
    setFamilyLines((prev) => [...prev, ""]);
  }

  function setFamilyLine(i: number, v: string) {
    setFamilyLines((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }

  function removeFamilyRow(i: number) {
    setFamilyLines((prev) => prev.filter((_, j) => j !== i));
  }

  function resetForm() {
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setAadhar("");
    setFamilyLines([""]);
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

  function openEditResident(row: AdminUserRow) {
    setErr(null);
    setEditUserId(row.id);
    setEmail(row.email);
    setFullName(row.full_name);
    setPhone(row.phone ?? "");
    setAadhar("");
    setPassword("");
    setFamilyLines(
      row.family_members?.length ? [...row.family_members] : [""],
    );
    setModalOpen(true);
  }

  async function onSubmitResident(e: FormEvent) {
    e.preventDefault();
    const primary = fullName.trim().toLowerCase();
    const members = familyLines.map((s) => s.trim()).filter(Boolean);
    for (const m of members) {
      if (m.toLowerCase() === primary) {
        setErr("Family members must not include the primary resident name.");
        return;
      }
    }
    if (isEditMode) {
      if (aadhar.trim() && aadhar.trim().length !== AADHAR_LEN) {
        setErr(
          `Aadhar must be ${AADHAR_LEN} digits or leave blank to keep the current value.`,
        );
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
          phone: string;
          family_members: string[];
          aadhar?: string;
          password?: string;
        } = {
          full_name: fullName.trim(),
          phone: phone.trim(),
          family_members: members,
        };
        if (aadhar.trim().length === AADHAR_LEN) {
          body.aadhar = aadhar.trim();
        }
        if (password.trim().length >= 10) {
          body.password = password.trim();
        }
        await patchAdminResidentUser(editUserId, body);
      } else {
        await onboardResidentUser({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          phone: phone.trim(),
          aadhar: aadhar.trim(),
          family_members: members,
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
        <h1 id={`${formId}-title`}>Manage residents</h1>
        <p className="lede">
          Onboard residents and mark accounts as resigned when they move out.
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
            Resident roster
          </h2>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openOnboardModal}
          >
            <span className="mi" aria-hidden="true">person_add</span> Onboard resident
          </button>
        </div>

        <div
          className="table-scroll"
          role="region"
          aria-label="Residents table"
          tabIndex={0}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Aadhar</th>
                <th scope="col">Family</th>
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
                  <td>{r.aadhar_masked ?? "—"}</td>
                  <td className="desc">
                    {r.family_members?.length
                      ? r.family_members.join(", ")
                      : "—"}
                  </td>
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
                              onSelect: () => openEditResident(r),
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
                              onSelect: () => openEditResident(r),
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
          {isEditMode ? "Edit resident" : "Onboard resident"}
        </h3>
        <form className="stack-form" onSubmit={onSubmitResident}>
          <div className="field">
            <label htmlFor={`${formId}-email`}>Email</label>
            <input id={`${formId}-email`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required={!isEditMode} disabled={isEditMode} readOnly={isEditMode} />
          </div>
          <div className="field">
            <label htmlFor={`${formId}-pw`}>{isEditMode ? "New password (optional, min 10 characters)" : "Initial password"}</label>
            <input id={`${formId}-pw`} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required={!isEditMode} minLength={isEditMode ? undefined : 10} />
          </div>
          <div className="field">
            <label htmlFor={`${formId}-name`}>Primary resident full name</label>
            <input id={`${formId}-name`} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor={`${formId}-phone`}>Phone</label>
            <input id={`${formId}-phone`} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor={`${formId}-aadhar`}>Aadhar ({AADHAR_LEN} digits){isEditMode ? " — leave blank to keep current" : ""}</label>
            <input id={`${formId}-aadhar`} inputMode="numeric" pattern="\d{12}" maxLength={12} value={aadhar} onChange={(e) => setAadhar(e.target.value.replace(/\D/g, "").slice(0, AADHAR_LEN))} required={!isEditMode} />
          </div>
          <fieldset className="field">
            <legend>Family members (excluding primary resident)</legend>
            {familyLines.map((line, i) => (
              <div key={`fam-${i}`} className="family-row">
                <label htmlFor={`${formId}-fam-${i}`} className="sr-only">Family member {i + 1}</label>
                <input id={`${formId}-fam-${i}`} value={line} onChange={(e) => setFamilyLine(i, e.target.value)} placeholder="Name" />
                {familyLines.length > 1 && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeFamilyRow(i)}>
                    <span className="mi mi-sm" aria-hidden="true">close</span> Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={addFamilyRow}>
              <span className="mi mi-sm" aria-hidden="true">add</span> Add family member
            </button>
          </fieldset>
          <div className="actions">
            <button type="submit" className="btn btn-primary">
              <span className="mi" aria-hidden="true">{isEditMode ? "save" : "person_add"}</span> {isEditMode ? "Save changes" : "Create account"}
            </button>
            <button type="button" className="secondary" onClick={closeModal}>Cancel</button>
          </div>
        </form>
      </AccessibleDialog>

      <AccessibleDialog open={!!(confirmId && confirmRow)} onClose={() => setConfirmId(null)} labelledBy={`${formId}-deact-title`} narrow>
        <h3 id={`${formId}-deact-title`}>Deactivate resident</h3>
        <p>Mark <strong>{confirmRow?.full_name}</strong> as resigned? They will no longer be able to sign in.</p>
        <div className="actions">
          <button type="button" className="secondary" onClick={() => setConfirmId(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={onDeactivate}>
            <span className="mi" aria-hidden="true">person_off</span> Confirm deactivation
          </button>
        </div>
      </AccessibleDialog>

      <AccessibleDialog open={!!(activateConfirmId && activateRow)} onClose={() => setActivateConfirmId(null)} labelledBy={`${formId}-act-title`} narrow>
        <h3 id={`${formId}-act-title`}>Activate resident</h3>
        <p>Restore <strong>{activateRow?.full_name}</strong> to active? They will be able to sign in again with their existing password.</p>
        <p className="subtle">If the password needs to be reset, use <strong>Edit</strong> first.</p>
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
