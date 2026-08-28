/**
 * Unit tests for campaignProgress.ts
 *
 * Covers: calculateCampaignProgress, calculateIsEnded
 */

import {
  calculateCampaignProgress,
  calculateIsEnded,
} from "../campaignProgress";

// ── calculateCampaignProgress ─────────────────────────────────────────────────

describe("calculateCampaignProgress", () => {
  it("returns 0 when goal is 0 (avoids division by zero)", () => {
    expect(calculateCampaignProgress(500, 0)).toBe(0);
  });

  it("returns 0 when nothing has been raised", () => {
    expect(calculateCampaignProgress(0, 1000)).toBe(0);
  });

  it("returns 50 when half the goal is raised", () => {
    expect(calculateCampaignProgress(500, 1000)).toBe(50);
  });

  it("returns 100 when goal is exactly met", () => {
    expect(calculateCampaignProgress(1000, 1000)).toBe(100);
  });

  it("returns more than 100 when goal is exceeded", () => {
    expect(calculateCampaignProgress(1500, 1000)).toBe(150);
  });

  it("returns a fractional percentage for partial progress", () => {
    expect(calculateCampaignProgress(1, 3)).toBeCloseTo(33.33, 1);
  });

  it("handles very small raised amounts", () => {
    expect(calculateCampaignProgress(0.001, 1000)).toBeCloseTo(0.0001);
  });

  it("handles very large numbers", () => {
    expect(calculateCampaignProgress(1_000_000, 10_000_000)).toBe(10);
  });
});

// ── calculateIsEnded ──────────────────────────────────────────────────────────

describe("calculateIsEnded", () => {
  const PAST_DATE = new Date(Date.now() - 86_400_000).toISOString(); // 1 day ago
  const FUTURE_DATE = new Date(Date.now() + 86_400_000).toISOString(); // 1 day ahead

  it("returns true when deadline has passed and campaign is not funded", () => {
    expect(calculateIsEnded(PAST_DATE, false)).toBe(true);
  });

  it("returns false when deadline has passed but campaign IS funded", () => {
    // A funded campaign should not be shown as "ended" (failed)
    expect(calculateIsEnded(PAST_DATE, true)).toBe(false);
  });

  it("returns false when deadline is in the future and not funded", () => {
    expect(calculateIsEnded(FUTURE_DATE, false)).toBe(false);
  });

  it("returns false when deadline is in the future and is funded", () => {
    expect(calculateIsEnded(FUTURE_DATE, true)).toBe(false);
  });

  it("handles a deadline that is exactly now (treated as past)", () => {
    // A date just barely in the past should return true
    const justPast = new Date(Date.now() - 1000).toISOString();
    expect(calculateIsEnded(justPast, false)).toBe(true);
  });

  it("handles a deadline represented as a date string", () => {
    expect(calculateIsEnded("2000-01-01", false)).toBe(true);
    expect(calculateIsEnded("2100-01-01", false)).toBe(false);
  });
});
