import { describe, expect, it } from "vitest";
import { refusedBy } from "./tool-outcome";

describe("refusedBy", () => {
  it("reads our backend's refusals as refused", () => {
    expect(refusedBy(JSON.stringify({ ok: false, reason: "still_does_not_match" }))).toBe(true);
    expect(refusedBy(JSON.stringify({ ok: true, verified: false, attempts_left: 1 }))).toBe(true);
    expect(refusedBy(JSON.stringify({ ok: true, verified: false, locked: true }))).toBe(true);
  });

  it("reads successful answers as done", () => {
    expect(refusedBy(JSON.stringify({ ok: true, verified: true }))).toBe(false);
    expect(refusedBy(JSON.stringify({ ok: true, status: "pending_officer_review" }))).toBe(false);
  });

  it("treats a missing or unreadable answer as done (the transport error flag covers failures)", () => {
    expect(refusedBy(undefined)).toBe(false);
    expect(refusedBy("not json")).toBe(false);
  });
});
