/**
 * Unit tests for formValidation.ts
 *
 * Covers: validateField, validateForm, required, minLength, maxLength,
 *         isNumber, minValue, maxValue, pattern, httpsUrl, stellarAddress,
 *         futureDate, pastDate, lessThanOrEqual
 */

import {
  validateField,
  validateForm,
  required,
  minLength,
  maxLength,
  isNumber,
  minValue,
  maxValue,
  pattern,
  httpsUrl,
  stellarAddress,
  futureDate,
  pastDate,
  lessThanOrEqual,
} from "../formValidation";

// ── required ──────────────────────────────────────────────────────────────────

describe("required", () => {
  it("returns null for a non-empty string", () => {
    expect(required()("hello")).toBeNull();
  });

  it("returns an error for an empty string", () => {
    expect(required()("")).not.toBeNull();
  });

  it("returns an error for a whitespace-only string", () => {
    expect(required()("   ")).not.toBeNull();
  });

  it("uses the default message", () => {
    expect(required()("")).toBe("This field is required.");
  });

  it("uses a custom message", () => {
    expect(required("Name is required.")("")).toBe("Name is required.");
  });
});

// ── minLength ─────────────────────────────────────────────────────────────────

describe("minLength", () => {
  it("returns null when the value meets the minimum length", () => {
    expect(minLength(3)("abc")).toBeNull();
  });

  it("returns null when the value exceeds the minimum length", () => {
    expect(minLength(3)("abcdef")).toBeNull();
  });

  it("returns an error when the value is too short", () => {
    expect(minLength(5)("hi")).not.toBeNull();
  });

  it("uses the default error message", () => {
    expect(minLength(5)("hi")).toBe("Must be at least 5 characters.");
  });

  it("uses a custom error message", () => {
    expect(minLength(5, "Too short!")("hi")).toBe("Too short!");
  });

  it("trims before checking length", () => {
    // "  " has length 2 but trims to "" which is length 0 < 3
    expect(minLength(3)("  ")).not.toBeNull();
  });
});

// ── maxLength ─────────────────────────────────────────────────────────────────

describe("maxLength", () => {
  it("returns null when the value is within the maximum length", () => {
    expect(maxLength(10)("hello")).toBeNull();
  });

  it("returns null when the value equals the maximum length", () => {
    expect(maxLength(5)("hello")).toBeNull();
  });

  it("returns an error when the value exceeds the maximum", () => {
    expect(maxLength(3)("hello")).not.toBeNull();
  });

  it("uses the default error message", () => {
    expect(maxLength(3)("hello")).toBe("Must be 3 characters or less.");
  });

  it("uses a custom error message", () => {
    expect(maxLength(3, "Too long!")("hello")).toBe("Too long!");
  });
});

// ── isNumber ──────────────────────────────────────────────────────────────────

describe("isNumber", () => {
  it("returns null for a valid integer string", () => {
    expect(isNumber()("42")).toBeNull();
  });

  it("returns null for a valid decimal string", () => {
    expect(isNumber()("3.14")).toBeNull();
  });

  it("returns null for zero", () => {
    expect(isNumber()("0")).toBeNull();
  });

  it("returns null for a negative number string", () => {
    expect(isNumber()("-5")).toBeNull();
  });

  it("returns an error for non-numeric text", () => {
    expect(isNumber()("abc")).not.toBeNull();
  });

  it("uses the default error message", () => {
    expect(isNumber()("abc")).toBe("Must be a valid number.");
  });

  it("uses a custom error message", () => {
    expect(isNumber("Enter a number.")("abc")).toBe("Enter a number.");
  });
});

// ── minValue ──────────────────────────────────────────────────────────────────

describe("minValue", () => {
  it("returns null when value meets the minimum", () => {
    expect(minValue(0)("0")).toBeNull();
  });

  it("returns null when value is above the minimum", () => {
    expect(minValue(1)("5")).toBeNull();
  });

  it("returns an error when value is below the minimum", () => {
    expect(minValue(10)("5")).not.toBeNull();
  });

  it("uses the default error message", () => {
    expect(minValue(10)("5")).toBe("Must be at least 10.");
  });

  it("uses a custom error message", () => {
    expect(minValue(10, "Too low")("5")).toBe("Too low");
  });
});

// ── maxValue ──────────────────────────────────────────────────────────────────

describe("maxValue", () => {
  it("returns null when value is within the maximum", () => {
    expect(maxValue(100)("50")).toBeNull();
  });

  it("returns null when value equals the maximum", () => {
    expect(maxValue(100)("100")).toBeNull();
  });

  it("returns an error when value exceeds the maximum", () => {
    expect(maxValue(100)("200")).not.toBeNull();
  });

  it("uses the default error message", () => {
    expect(maxValue(100)("200")).toBe("Must be at most 100.");
  });

  it("uses a custom error message", () => {
    expect(maxValue(100, "Too high")("200")).toBe("Too high");
  });
});

// ── pattern ───────────────────────────────────────────────────────────────────

describe("pattern", () => {
  it("returns null when the value matches the regex", () => {
    expect(pattern(/^\d+$/, "Digits only")("12345")).toBeNull();
  });

  it("returns the message when the value does not match", () => {
    expect(pattern(/^\d+$/, "Digits only")("abc")).toBe("Digits only");
  });
});

// ── httpsUrl ──────────────────────────────────────────────────────────────────

describe("httpsUrl", () => {
  it("returns null for a valid https URL", () => {
    expect(httpsUrl()("https://example.com")).toBeNull();
  });

  it("returns null for an empty string (optional field)", () => {
    expect(httpsUrl()("")).toBeNull();
  });

  it("returns null for a whitespace-only string (optional field)", () => {
    expect(httpsUrl()("   ")).toBeNull();
  });

  it("returns an error for an http URL", () => {
    expect(httpsUrl()("http://example.com")).not.toBeNull();
  });

  it("returns an error for a string that is not a URL at all", () => {
    expect(httpsUrl()("not-a-url")).not.toBeNull();
  });

  it("uses the default error message", () => {
    expect(httpsUrl()("http://x.com")).toBe("Must be a valid https:// URL.");
  });

  it("uses a custom error message", () => {
    expect(httpsUrl("HTTPS only!")("http://x.com")).toBe("HTTPS only!");
  });
});

// ── stellarAddress ────────────────────────────────────────────────────────────

describe("stellarAddress", () => {
  // 55-char valid Stellar G address (G + 54 uppercase base32 chars)
  const VALID_G_ADDRESS = "G" + "A".repeat(55); // 56 chars total
  const VALID_C_ADDRESS = "C" + "A".repeat(55); // contract address
  const VALID_M_ADDRESS = "M" + "A".repeat(54); // muxed address (55 chars)

  it("returns null for empty string (optional field)", () => {
    expect(stellarAddress()("")).toBeNull();
  });

  it("returns null for a valid G address", () => {
    expect(stellarAddress()(VALID_G_ADDRESS)).toBeNull();
  });

  it("returns null for a valid C address", () => {
    expect(stellarAddress()(VALID_C_ADDRESS)).toBeNull();
  });

  it("returns null for a valid M address", () => {
    expect(stellarAddress()(VALID_M_ADDRESS)).toBeNull();
  });

  it("returns an error for an address starting with wrong letter", () => {
    const invalid = "X" + "A".repeat(55);
    expect(stellarAddress()(invalid)).not.toBeNull();
  });

  it("returns an error for a too-short address", () => {
    expect(stellarAddress()("GABC")).not.toBeNull();
  });

  it("returns an error for an address with lowercase characters", () => {
    const lower = "g" + "a".repeat(55);
    expect(stellarAddress()(lower)).not.toBeNull();
  });

  it("uses a custom error message", () => {
    expect(stellarAddress("Bad address")("bad")).toBe("Bad address");
  });
});

// ── futureDate ────────────────────────────────────────────────────────────────

describe("futureDate", () => {
  it("returns null for a date well in the future", () => {
    const future = new Date(Date.now() + 7 * 24 * 3_600_000).toISOString();
    expect(futureDate(1)(future)).toBeNull();
  });

  it("returns an error for a date in the past", () => {
    const past = new Date(Date.now() - 3_600_000).toISOString();
    expect(futureDate(1)(past)).not.toBeNull();
  });

  it("returns an error for empty value", () => {
    expect(futureDate(1)("")).toBe("Date is required.");
  });

  it("uses a custom error message", () => {
    const past = new Date(Date.now() - 3_600_000).toISOString();
    expect(futureDate(1, "Must be future")(past)).toBe("Must be future");
  });

  it("uses the default message with minHours in it", () => {
    const past = new Date(Date.now() - 3_600_000).toISOString();
    const msg = futureDate(24)(past);
    expect(msg).toContain("24");
  });
});

// ── pastDate ──────────────────────────────────────────────────────────────────

describe("pastDate", () => {
  it("returns null for a date in the past", () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(pastDate()(past)).toBeNull();
  });

  it("returns an error for a date in the future", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(pastDate()(future)).not.toBeNull();
  });

  it("returns an error for empty value", () => {
    expect(pastDate()("")).toBe("Date is required.");
  });

  it("uses the default error message", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(pastDate()(future)).toBe("Date must be in the past.");
  });

  it("uses a custom error message", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(pastDate("Must be past")(future)).toBe("Must be past");
  });
});

// ── lessThanOrEqual ───────────────────────────────────────────────────────────

describe("lessThanOrEqual", () => {
  it("returns null when a < b", () => {
    expect(lessThanOrEqual("5", "10", "a must be <= b")).toBeNull();
  });

  it("returns null when a === b", () => {
    expect(lessThanOrEqual("10", "10", "a must be <= b")).toBeNull();
  });

  it("returns the message when a > b", () => {
    expect(lessThanOrEqual("15", "10", "a must be <= b")).toBe("a must be <= b");
  });

  it("handles string numbers correctly", () => {
    expect(lessThanOrEqual("0.5", "1.0", "too high")).toBeNull();
    expect(lessThanOrEqual("1.1", "1.0", "too high")).toBe("too high");
  });
});

// ── validateField ─────────────────────────────────────────────────────────────

describe("validateField", () => {
  it("returns valid when no validators are provided", () => {
    expect(validateField("anything", [])).toEqual({ valid: true, error: null });
  });

  it("returns valid when all validators pass", () => {
    const result = validateField("hello", [required(), minLength(3)]);
    expect(result).toEqual({ valid: true, error: null });
  });

  it("returns the first error and stops", () => {
    // required() fails first, minLength should not run
    const minLenSpy = jest.fn().mockReturnValue("too short");
    const result = validateField("", [required(), minLenSpy]);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("This field is required.");
    // The second validator should not have been called because the first failed
    expect(minLenSpy).not.toHaveBeenCalled();
  });

  it("runs through all validators until one fails", () => {
    const result = validateField("hi", [required(), minLength(5)]);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Must be at least 5 characters.");
  });
});

// ── validateForm ──────────────────────────────────────────────────────────────

describe("validateForm", () => {
  it("returns valid with no errors when all fields pass", () => {
    const result = validateForm(
      { name: "Alice", age: "30" },
      {
        name: [required()],
        age: [required(), isNumber()],
      },
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.firstError).toBeNull();
  });

  it("collects errors for multiple invalid fields", () => {
    const result = validateForm(
      { name: "", age: "abc" },
      {
        name: [required()],
        age: [isNumber()],
      },
    );
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeDefined();
    expect(result.errors.age).toBeDefined();
  });

  it("sets firstError to the first encountered error", () => {
    const result = validateForm(
      { name: "", age: "abc" },
      {
        name: [required()],
        age: [isNumber()],
      },
    );
    // name is first in the schema, so its error should be firstError
    expect(result.firstError).toBe("This field is required.");
  });

  it("returns valid when the schema is empty", () => {
    const result = validateForm({ name: "Alice" }, {});
    expect(result.valid).toBe(true);
    expect(result.firstError).toBeNull();
  });

  it("only records the first error per field", () => {
    const result = validateForm(
      { name: "" },
      { name: [required(), minLength(3)] },
    );
    // Only one error per field — the first failing validator
    expect(result.errors.name).toBe("This field is required.");
  });
});
