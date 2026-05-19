import { formatDate, isExpiringSoon } from "@/lib/utils";

describe("formatDate", () => {
  it("returns — for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("formats an ISO date string", () => {
    expect(formatDate("2025-01-15T00:00:00Z")).toMatch(/15 Jan 2025/);
  });
});

describe("isExpiringSoon", () => {
  it("returns false for null", () => {
    expect(isExpiringSoon(null)).toBe(false);
  });

  it("returns true for a date 30 days from now", () => {
    const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(isExpiringSoon(soon)).toBe(true);
  });

  it("returns false for a date 120 days from now", () => {
    const far = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString();
    expect(isExpiringSoon(far)).toBe(false);
  });

  it("returns false for a past date", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(isExpiringSoon(past)).toBe(false);
  });
});
