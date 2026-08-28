/**
 * Unit tests for validation.ts (apps/interface/src/lib/validation.ts)
 *
 * Covers interface-specific helpers:
 *   stripHtmlTags, isValidContractId, validateContractId,
 *   validateVideoUrl, validateMaxContribution,
 *   sanitizeTitle, sanitizeDescription
 *
 * And wrapper validators delegated to @fund-my-cause/types:
 *   validateTitle, validateDescription, validateGoal, validateDeadline,
 *   validateMinContribution, validateFeeBps
 */

import {
  stripHtmlTags,
  isValidContractId,
  validateContractId,
  validateVideoUrl,
  validateMaxContribution,
  sanitizeTitle,
  sanitizeDescription,
  validateTitle,
  validateDescription,
  validateGoal,
  validateDeadline,
  validateMinContribution,
  validateFeeBps,
} from "../validation";

// ── stripHtmlTags ─────────────────────────────────────────────────────────────

describe("stripHtmlTags", () => {
  it("strips basic tags", () => {
    expect(stripHtmlTags("<b>hello</b>")).toBe("hello");
  });

  it("strips nested tags", () => {
    expect(stripHtmlTags("<p><em>hello</em></p>")).toBe("hello");
  });

  it("leaves plain text unchanged", () => {
    expect(stripHtmlTags("hello world")).toBe("hello world");
  });

  it("strips script tags", () => {
    expect(stripHtmlTags('<script>alert("xss")</script>')).toBe(
      'alert("xss")',
    );
  });

  it("handles empty string", () => {
    expect(stripHtmlTags("")).toBe("");
  });

  it("handles a self-closing tag", () => {
    expect(stripHtmlTags("Hello<br />World")).toBe("HelloWorld");
  });
});

// ── isValidContractId ─────────────────────────────────────────────────────────

// A valid Stellar contract ID: starts with 'C', 56 chars, base32 (A-Z2-7)
const VALID_CONTRACT_ID = "C" + "A".repeat(55); // 56 chars

describe("isValidContractId", () => {
  it("returns true for a valid contract ID", () => {
    expect(isValidContractId(VALID_CONTRACT_ID)).toBe(true);
  });

  it("returns false for an empty string", () => {
    expect(isValidContractId("")).toBe(false);
  });

  it("returns false for null/undefined-like input", () => {
    // @ts-expect-error testing runtime guard
    expect(isValidContractId(null)).toBe(false);
  });

  it("returns false if it does not start with C", () => {
    expect(isValidContractId("G" + "A".repeat(55))).toBe(false);
  });

  it("returns false if it is 55 characters", () => {
    expect(isValidContractId("C" + "A".repeat(54))).toBe(false);
  });

  it("returns false if it is 57 characters", () => {
    expect(isValidContractId("C" + "A".repeat(56))).toBe(false);
  });

  it("returns false if it contains invalid base32 characters (lowercase)", () => {
    expect(isValidContractId("C" + "a".repeat(55))).toBe(false);
  });

  it("returns false if it contains digits outside 2-7", () => {
    // '0' and '1' are not valid base32 chars for Stellar
    expect(isValidContractId("C" + "0".repeat(55))).toBe(false);
  });

  it("accepts digits 2-7 in the contract ID", () => {
    // All valid base32: A-Z2-7
    expect(isValidContractId("C" + "2".repeat(55))).toBe(true);
    expect(isValidContractId("C" + "7".repeat(55))).toBe(true);
  });
});

// ── validateContractId ────────────────────────────────────────────────────────

describe("validateContractId", () => {
  it("returns null for a valid contract ID", () => {
    expect(validateContractId(VALID_CONTRACT_ID)).toBeNull();
  });

  it("returns an error for an empty string", () => {
    expect(validateContractId("")).toBe("Contract ID is required.");
  });

  it("returns an error for whitespace-only input", () => {
    expect(validateContractId("   ")).toBe("Contract ID is required.");
  });

  it("returns an error for an invalid contract ID", () => {
    expect(validateContractId("not-a-contract")).toBe("Contract ID is invalid.");
  });
});

// ── validateVideoUrl ──────────────────────────────────────────────────────────

describe("validateVideoUrl", () => {
  it("returns null for an empty string (optional field)", () => {
    expect(validateVideoUrl("")).toBeNull();
  });

  it("returns null for a whitespace-only string", () => {
    expect(validateVideoUrl("   ")).toBeNull();
  });

  it("returns null for a valid https URL", () => {
    expect(validateVideoUrl("https://youtube.com/watch?v=abc")).toBeNull();
  });

  it("returns an error for an http URL", () => {
    expect(validateVideoUrl("http://youtube.com/watch?v=abc")).not.toBeNull();
  });

  it("returns an error for an invalid URL", () => {
    expect(validateVideoUrl("not-a-url-at-all")).not.toBeNull();
  });

  it("returns error mentioning https for non-https protocol", () => {
    const result = validateVideoUrl("ftp://example.com/video.mp4");
    expect(result).toContain("https://");
  });
});

// ── validateMaxContribution ───────────────────────────────────────────────────

describe("validateMaxContribution", () => {
  it("returns null for empty string (no cap set)", () => {
    expect(validateMaxContribution("", "10")).toBeNull();
  });

  it("returns null for '0' (no cap)", () => {
    expect(validateMaxContribution("0", "10")).toBeNull();
  });

  it("returns null when max >= min", () => {
    expect(validateMaxContribution("100", "10")).toBeNull();
  });

  it("returns null when max === min", () => {
    expect(validateMaxContribution("10", "10")).toBeNull();
  });

  it("returns an error when max < min", () => {
    const result = validateMaxContribution("5", "10");
    expect(result).not.toBeNull();
    expect(result).toMatch(/minimum/i);
  });

  it("returns an error for a negative number", () => {
    const result = validateMaxContribution("-5", "10");
    expect(result).not.toBeNull();
  });

  it("returns an error for non-numeric input", () => {
    const result = validateMaxContribution("abc", "10");
    expect(result).not.toBeNull();
  });
});

// ── sanitizeTitle ─────────────────────────────────────────────────────────────

describe("sanitizeTitle", () => {
  it("strips HTML tags and trims", () => {
    expect(sanitizeTitle("  <b>My Campaign</b>  ")).toBe("My Campaign");
  });

  it("leaves plain text unchanged (except trim)", () => {
    expect(sanitizeTitle("  Hello World  ")).toBe("Hello World");
  });

  it("handles empty string", () => {
    expect(sanitizeTitle("")).toBe("");
  });
});

// ── sanitizeDescription ───────────────────────────────────────────────────────

describe("sanitizeDescription", () => {
  it("strips HTML tags and trims", () => {
    expect(sanitizeDescription("  <p>Some <em>text</em></p>  ")).toBe(
      "Some text",
    );
  });

  it("leaves plain text unchanged (except trim)", () => {
    expect(sanitizeDescription("  A great cause.  ")).toBe("A great cause.");
  });

  it("handles empty string", () => {
    expect(sanitizeDescription("")).toBe("");
  });
});

// ── validateTitle (delegated to @fund-my-cause/types) ─────────────────────────

describe("validateTitle", () => {
  it("returns null for a valid title", () => {
    expect(validateTitle("My Great Campaign")).toBeNull();
  });

  it("returns an error for an empty title", () => {
    expect(validateTitle("")).not.toBeNull();
  });

  it("returns an error for a whitespace-only title", () => {
    expect(validateTitle("   ")).not.toBeNull();
  });

  it("returns an error for a title that is too long (> 100 chars)", () => {
    expect(validateTitle("a".repeat(101))).not.toBeNull();
  });

  it("accepts a title of exactly 100 characters", () => {
    expect(validateTitle("a".repeat(100))).toBeNull();
  });
});

// ── validateDescription (delegated) ──────────────────────────────────────────

describe("validateDescription", () => {
  it("returns null for a valid description", () => {
    expect(validateDescription("This is a valid description.")).toBeNull();
  });

  it("returns an error for an empty description", () => {
    expect(validateDescription("")).not.toBeNull();
  });

  it("returns an error for a description longer than 1000 chars", () => {
    expect(validateDescription("a".repeat(1001))).not.toBeNull();
  });

  it("accepts a description of exactly 1000 characters", () => {
    expect(validateDescription("a".repeat(1000))).toBeNull();
  });
});

// ── validateGoal (delegated) ──────────────────────────────────────────────────

describe("validateGoal", () => {
  it("returns null for a valid positive number", () => {
    expect(validateGoal("1000")).toBeNull();
  });

  it("returns an error for empty string", () => {
    expect(validateGoal("")).not.toBeNull();
  });

  it("returns an error for zero", () => {
    expect(validateGoal("0")).not.toBeNull();
  });

  it("returns an error for negative number", () => {
    expect(validateGoal("-100")).not.toBeNull();
  });

  it("returns an error for non-numeric input", () => {
    expect(validateGoal("abc")).not.toBeNull();
  });
});

// ── validateDeadline (delegated) ──────────────────────────────────────────────

describe("validateDeadline", () => {
  it("returns null for a deadline well in the future", () => {
    const future = new Date(Date.now() + 7 * 24 * 3_600_000).toISOString();
    expect(validateDeadline(future)).toBeNull();
  });

  it("returns an error for an empty deadline", () => {
    expect(validateDeadline("")).not.toBeNull();
  });

  it("returns an error for a deadline in the past", () => {
    const past = new Date(Date.now() - 3_600_000).toISOString();
    expect(validateDeadline(past)).not.toBeNull();
  });

  it("returns an error for a deadline more than 1 year out", () => {
    const tooFar = new Date(
      Date.now() + 400 * 24 * 3_600_000,
    ).toISOString();
    expect(validateDeadline(tooFar)).not.toBeNull();
  });
});

// ── validateMinContribution (delegated) ───────────────────────────────────────

describe("validateMinContribution", () => {
  it("returns null for a valid minimum contribution", () => {
    expect(validateMinContribution("10", "1000")).toBeNull();
  });

  it("returns an error for empty input", () => {
    expect(validateMinContribution("", "1000")).not.toBeNull();
  });

  it("returns an error when below 1 XLM", () => {
    expect(validateMinContribution("0.5", "1000")).not.toBeNull();
  });

  it("returns an error when min exceeds goal", () => {
    expect(validateMinContribution("500", "100")).not.toBeNull();
  });
});

// ── validateFeeBps (delegated) ────────────────────────────────────────────────

describe("validateFeeBps", () => {
  it("returns null for empty (optional field)", () => {
    expect(validateFeeBps("")).toBeNull();
  });

  it("returns null for 0", () => {
    expect(validateFeeBps("0")).toBeNull();
  });

  it("returns null for 10000 (100%)", () => {
    expect(validateFeeBps("10000")).toBeNull();
  });

  it("returns null for a valid fee like 250 (2.5%)", () => {
    expect(validateFeeBps("250")).toBeNull();
  });

  it("returns an error for a value above 10000", () => {
    expect(validateFeeBps("10001")).not.toBeNull();
  });

  it("returns an error for a negative value", () => {
    expect(validateFeeBps("-1")).not.toBeNull();
  });

  it("returns an error for non-numeric input", () => {
    expect(validateFeeBps("abc")).not.toBeNull();
  });
});
