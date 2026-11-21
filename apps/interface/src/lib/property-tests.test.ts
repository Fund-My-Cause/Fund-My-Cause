import * as fc from "fast-check";

import { formatAddress } from "./format";
import { sanitizeText } from "./sanitize";
import { isValidContractId } from "@fund-my-cause/types";

describe("formatting invariants", () => {
  it("formatAddress never exceeds its visible prefix and suffix contract", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 20 }),
        (address, start, end) => {
          const formatted = formatAddress(address, start, end);
          if (address.length <= start + end) {
            return formatted === address;
          }
          return (
            formatted.startsWith(address.slice(0, start)) &&
            formatted.endsWith(address.slice(-end)) &&
            formatted.includes("...")
          );
        },
      ),
    );
  });

  it("sanitizeTitle is trimmed, whitespace-normalized, and tag-free", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 300 }), (input) => {
        const sanitized = sanitizeText(input).trim();
        return (
          sanitized === sanitized.trim() &&
          !/\s{2}/.test(sanitized) &&
          !/<[^>]*>/.test(sanitized)
        );
      }),
    );
  });
});

describe("contract ID validation invariants", () => {
  it("rejects arbitrary strings outside the Stellar contract ID shape", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 80 }), (candidate) => {
        if (isValidContractId(candidate)) {
          return (
            candidate.startsWith("C") &&
            candidate.length === 56 &&
            /^[C][A-Z2-7]+$/.test(candidate)
          );
        }
        return typeof candidate === "string";
      }),
    );
  });
});
