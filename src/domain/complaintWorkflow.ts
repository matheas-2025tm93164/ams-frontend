import type { ComplaintStatus } from "../api/types";

export function nextStaffStatus(
  s: ComplaintStatus,
): ComplaintStatus | null {
  if (s === "pending") return "in_progress";
  if (s === "in_progress") return "resolved";
  return null;
}
