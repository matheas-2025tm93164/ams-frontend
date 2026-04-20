import { describe, it, expect } from "vitest";
import { nextStaffStatus } from "./complaintWorkflow";

describe("nextStaffStatus", () => {
  it("moves pending to in_progress", () => {
    expect(nextStaffStatus("pending")).toBe("in_progress");
  });
  it("moves in_progress to resolved", () => {
    expect(nextStaffStatus("in_progress")).toBe("resolved");
  });
  it("returns null when no transition", () => {
    expect(nextStaffStatus("resolved")).toBeNull();
  });
});
