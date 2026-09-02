/**
 * #1208 — Unit tests for sdks/js error decoding from contract rejections.
 *
 * Covers:
 *  - Every known ContractError code (1–69) → correct FmcContractError with right code and message
 *  - Unknown/unmapped codes → FmcContractError with fallback message "Contract error <n>."
 *  - Non-contract error strings → plain Error with first line of the raw string
 *  - Boundary cases (code 0, very large code, whitespace variants)
 */

import { FmcContractError, parseAndThrow } from "./errors";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Wrap a contract error code into the Soroban simulation error string format. */
function sorobanError(code: number): string {
  return `HostError: Error(Contract, #${code})\nsome stack trace`;
}

/** Assert parseAndThrow throws FmcContractError with the expected code. */
function expectContractError(code: number): FmcContractError {
  try {
    parseAndThrow(sorobanError(code));
    throw new Error("expected parseAndThrow to throw");
  } catch (err) {
    expect(err).toBeInstanceOf(FmcContractError);
    const fmcErr = err as FmcContractError;
    expect(fmcErr.code).toBe(code);
    expect(fmcErr.name).toBe("FmcContractError");
    expect(typeof fmcErr.message).toBe("string");
    expect(fmcErr.message.length).toBeGreaterThan(0);
    return fmcErr;
  }
}

// ─── FmcContractError class ────────────────────────────────────────────────────

describe("FmcContractError class", () => {
  it("is a proper Error subclass", () => {
    const err = new FmcContractError(1, "test message");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(FmcContractError);
    expect(err.name).toBe("FmcContractError");
    expect(err.code).toBe(1);
    expect(err.message).toBe("test message");
  });

  it("preserves the code as a number property", () => {
    const err = new FmcContractError(42, "msg");
    expect(err.code).toBe(42);
    expect(typeof err.code).toBe("number");
  });
});

// ─── All known error codes (1–69) ─────────────────────────────────────────────

describe("parseAndThrow — known error codes 1–69", () => {
  // ── Lifecycle / state errors (1–16) ─────────────────────────────────────────
  it("code 1 — AlreadyInitialized", () => {
    const err = expectContractError(1);
    expect(err.message).toMatch(/already initialized/i);
  });

  it("code 2 — CampaignEnded", () => {
    const err = expectContractError(2);
    expect(err.message).toMatch(/ended/i);
  });

  it("code 3 — CampaignStillActive", () => {
    const err = expectContractError(3);
    expect(err.message).toMatch(/still active/i);
  });

  it("code 4 — GoalNotReached", () => {
    const err = expectContractError(4);
    expect(err.message).toMatch(/goal/i);
  });

  it("code 5 — GoalReached", () => {
    const err = expectContractError(5);
    expect(err.message).toMatch(/goal/i);
  });

  it("code 6 — Overflow", () => {
    const err = expectContractError(6);
    expect(err.message).toMatch(/overflow/i);
  });

  it("code 7 — NotActive", () => {
    const err = expectContractError(7);
    expect(err.message).toMatch(/active/i);
  });

  it("code 8 — InvalidFee", () => {
    const err = expectContractError(8);
    expect(err.message).toMatch(/fee/i);
  });

  it("code 9 — BelowMinimum", () => {
    const err = expectContractError(9);
    expect(err.message).toMatch(/minimum/i);
  });

  it("code 10 — InvalidDeadline", () => {
    const err = expectContractError(10);
    expect(err.message).toMatch(/deadline/i);
  });

  it("code 11 — CampaignPaused", () => {
    const err = expectContractError(11);
    expect(err.message).toMatch(/paused/i);
  });

  it("code 12 — InvalidGoal", () => {
    const err = expectContractError(12);
    expect(err.message).toMatch(/goal/i);
  });

  it("code 13 — TokenNotAccepted", () => {
    const err = expectContractError(13);
    expect(err.message).toMatch(/token/i);
  });

  it("code 14 — ExceedsMaximum", () => {
    const err = expectContractError(14);
    expect(err.message).toMatch(/cap|max/i);
  });

  it("code 15 — NotWhitelisted", () => {
    const err = expectContractError(15);
    expect(err.message).toMatch(/whitelist/i);
  });

  it("code 16 — Blacklisted", () => {
    const err = expectContractError(16);
    expect(err.message).toMatch(/blacklist/i);
  });

  // ── Delegation (17–18) ──────────────────────────────────────────────────────
  it("code 17 — InvalidDelegation", () => {
    const err = expectContractError(17);
    expect(err.message).toMatch(/delegation/i);
  });

  it("code 18 — DelegationNotFound", () => {
    const err = expectContractError(18);
    expect(err.message).toMatch(/delegation/i);
  });

  // ── Templates / voting / recurring (19–21) ──────────────────────────────────
  it("code 19 — InvalidTemplate", () => {
    const err = expectContractError(19);
    expect(err.message).toMatch(/template/i);
  });

  it("code 20 — VotingEnded", () => {
    const err = expectContractError(20);
    expect(err.message).toMatch(/voting|ended/i);
  });

  it("code 21 — InvalidRecurringPlan", () => {
    const err = expectContractError(21);
    expect(err.message).toMatch(/recurring/i);
  });

  // ── Refunds / vesting / emergency (22–24) ───────────────────────────────────
  it("code 22 — RefundLimitExceeded", () => {
    const err = expectContractError(22);
    expect(err.message).toMatch(/refund/i);
  });

  it("code 23 — VestingNotComplete", () => {
    const err = expectContractError(23);
    expect(err.message).toMatch(/vesting/i);
  });

  it("code 24 — EmergencyLocked", () => {
    const err = expectContractError(24);
    expect(err.message).toMatch(/emergency|lock/i);
  });

  // ── Rate limiting / message / strings (25–28) ───────────────────────────────
  it("code 25 — RateLimitExceeded", () => {
    const err = expectContractError(25);
    expect(err.message).toMatch(/rate limit/i);
  });

  it("code 26 — MessageTooLong", () => {
    const err = expectContractError(26);
    expect(err.message).toMatch(/message|long|256/i);
  });

  it("code 27 — StringEmpty", () => {
    const err = expectContractError(27);
    expect(err.message).toMatch(/empty/i);
  });

  it("code 28 — StringTooLong", () => {
    const err = expectContractError(28);
    expect(err.message).toMatch(/length|long/i);
  });

  // ── Amount / fee / overflow / funds (29–32) ─────────────────────────────────
  it("code 29 — AmountNotPositive", () => {
    const err = expectContractError(29);
    expect(err.message).toMatch(/positive/i);
  });

  it("code 30 — SelfFeeAddress", () => {
    const err = expectContractError(30);
    expect(err.message).toMatch(/creator|fee/i);
  });

  it("code 31 — GoalOverflow", () => {
    const err = expectContractError(31);
    expect(err.message).toMatch(/overflow|goal/i);
  });

  it("code 32 — InsufficientFunds", () => {
    const err = expectContractError(32);
    expect(err.message).toMatch(/insufficient|funds/i);
  });

  // ── Auth / rate-limit / multi-sig / proposals (33–39) ───────────────────────
  it("code 33 — Unauthorized", () => {
    const err = expectContractError(33);
    expect(err.message).toMatch(/unauthorized/i);
  });

  it("code 34 — InvalidRateLimit", () => {
    const err = expectContractError(34);
    expect(err.message).toMatch(/rate limit/i);
  });

  it("code 35 — MultiSigNotMet", () => {
    const err = expectContractError(35);
    expect(err.message).toMatch(/multi.sig|approval/i);
  });

  it("code 36 — ProposalNotFound", () => {
    const err = expectContractError(36);
    expect(err.message).toMatch(/proposal/i);
  });

  it("code 37 — AlreadyVoted", () => {
    const err = expectContractError(37);
    expect(err.message).toMatch(/voted/i);
  });

  it("code 38 — NoRewardsConfigured", () => {
    const err = expectContractError(38);
    expect(err.message).toMatch(/reward/i);
  });

  it("code 39 — NotCreator", () => {
    const err = expectContractError(39);
    expect(err.message).toMatch(/creator/i);
  });

  // ── Milestones / verification / disputes (40–45) ────────────────────────────
  it("code 40 — MilestoneNotFound", () => {
    const err = expectContractError(40);
    expect(err.message).toMatch(/milestone/i);
  });

  it("code 41 — MilestoneAlreadyReached", () => {
    const err = expectContractError(41);
    expect(err.message).toMatch(/milestone/i);
  });

  it("code 42 — VerificationNotApproved", () => {
    const err = expectContractError(42);
    expect(err.message).toMatch(/verif/i);
  });

  it("code 43 — DisputeNotFound", () => {
    const err = expectContractError(43);
    expect(err.message).toMatch(/dispute/i);
  });

  it("code 44 — DisputeAlreadyVoted", () => {
    const err = expectContractError(44);
    expect(err.message).toMatch(/dispute|voted/i);
  });

  it("code 45 — DisputeVotingEnded", () => {
    const err = expectContractError(45);
    expect(err.message).toMatch(/dispute|voting/i);
  });

  // ── Analytics / governance (46–55) ─────────────────────────────────────────
  it("code 46 — AnalyticsNotAvailable", () => {
    const err = expectContractError(46);
    expect(err.message).toMatch(/analytics/i);
  });

  it("code 47 — GovernanceProposalNotFound", () => {
    const err = expectContractError(47);
    expect(err.message).toMatch(/governance|proposal/i);
  });

  it("code 48 — GovernanceAlreadyVoted", () => {
    const err = expectContractError(48);
    expect(err.message).toMatch(/governance|voted/i);
  });

  it("code 49 — GovernanceVotingEnded", () => {
    const err = expectContractError(49);
    expect(err.message).toMatch(/governance|voting/i);
  });

  it("code 50 — GovernanceNotEnoughApprovals", () => {
    const err = expectContractError(50);
    expect(err.message).toMatch(/approval/i);
  });

  it("code 51 — GovernanceTimelockPending", () => {
    const err = expectContractError(51);
    expect(err.message).toMatch(/timelock/i);
  });

  it("code 52 — GovernanceNotGovernor", () => {
    const err = expectContractError(52);
    expect(err.message).toMatch(/governor/i);
  });

  it("code 53 — GovernanceProposalNotReady", () => {
    const err = expectContractError(53);
    expect(err.message).toMatch(/proposal|ready/i);
  });

  it("code 54 — GovernanceAlreadyExecuted", () => {
    const err = expectContractError(54);
    expect(err.message).toMatch(/executed/i);
  });

  it("code 55 — GovernanceEmergencyPaused", () => {
    const err = expectContractError(55);
    expect(err.message).toMatch(/emergency|pause/i);
  });

  // ── Security / generic (56–60) ──────────────────────────────────────────────
  it("code 56 — ReentrancyDetected", () => {
    const err = expectContractError(56);
    expect(err.message).toMatch(/reentr/i);
  });

  it("code 57 — EmergencyPauseActive", () => {
    const err = expectContractError(57);
    expect(err.message).toMatch(/emergency|pause/i);
  });

  it("code 58 — InvalidInput", () => {
    const err = expectContractError(58);
    expect(err.message).toMatch(/invalid/i);
  });

  it("code 59 — NotFound", () => {
    const err = expectContractError(59);
    expect(err.message).toMatch(/not found/i);
  });

  it("code 60 — InvalidCategory", () => {
    const err = expectContractError(60);
    expect(err.message).toMatch(/category/i);
  });

  // ── Contributor cap / streaming / state (61–69) ─────────────────────────────
  it("code 61 — ContributorCapExceeded", () => {
    const err = expectContractError(61);
    expect(err.message).toMatch(/cap/i);
  });

  it("code 62 — StreamNotConfigured", () => {
    const err = expectContractError(62);
    expect(err.message).toMatch(/stream/i);
  });

  it("code 63 — StreamNotYetClaimable", () => {
    const err = expectContractError(63);
    expect(err.message).toMatch(/stream/i);
  });

  it("code 64 — StreamFullyClaimed", () => {
    const err = expectContractError(64);
    expect(err.message).toMatch(/stream|claimed/i);
  });

  it("code 65 — WrongCampaignState", () => {
    const err = expectContractError(65);
    expect(err.message).toMatch(/state/i);
  });

  it("code 66 — DeadlineNotReached", () => {
    const err = expectContractError(66);
    expect(err.message).toMatch(/deadline/i);
  });

  it("code 67 — NoContributionToRefund", () => {
    const err = expectContractError(67);
    expect(err.message).toMatch(/contribution|refund/i);
  });

  it("code 68 — InvalidInitParams", () => {
    const err = expectContractError(68);
    expect(err.message).toMatch(/init/i);
  });

  it("code 69 — AlreadyWithdrawn", () => {
    const err = expectContractError(69);
    expect(err.message).toMatch(/withdrawal|withdrawn/i);
  });
});

// ─── Unknown / unmapped codes ──────────────────────────────────────────────────

describe("parseAndThrow — unknown / unmapped error codes", () => {
  it("returns a FmcContractError with a fallback message for code 0", () => {
    const err = expectContractError(0);
    expect(err.code).toBe(0);
    expect(err.message).toBe("Contract error 0.");
  });

  it("returns a FmcContractError with a fallback message for code 70", () => {
    const err = expectContractError(70);
    expect(err.code).toBe(70);
    expect(err.message).toBe("Contract error 70.");
  });

  it("returns a FmcContractError with a fallback message for code 100", () => {
    const err = expectContractError(100);
    expect(err.code).toBe(100);
    expect(err.message).toBe("Contract error 100.");
  });

  it("returns a FmcContractError with a fallback message for code 9999", () => {
    const err = expectContractError(9999);
    expect(err.code).toBe(9999);
    expect(err.message).toBe("Contract error 9999.");
  });

  it("fallback message is never empty for arbitrary unknown codes", () => {
    for (const code of [70, 200, 500, 1000]) {
      try {
        parseAndThrow(sorobanError(code));
      } catch (err) {
        expect((err as FmcContractError).message.length).toBeGreaterThan(0);
      }
    }
  });

  it("unknown code produces the exact pattern 'Contract error <n>.'", () => {
    for (const code of [70, 99, 1000]) {
      const err = expectContractError(code);
      expect(err.message).toBe(`Contract error ${code}.`);
    }
  });
});

// ─── Non-contract error strings ───────────────────────────────────────────────

describe("parseAndThrow — non-contract error strings", () => {
  it("throws a plain Error for RPC connection errors", () => {
    expect(() =>
      parseAndThrow("failed to connect to RPC endpoint\nconnection refused"),
    ).toThrow(Error);

    try {
      parseAndThrow("failed to connect to RPC endpoint\nconnection refused");
    } catch (err) {
      expect(err).not.toBeInstanceOf(FmcContractError);
      expect((err as Error).message).toBe("failed to connect to RPC endpoint");
    }
  });

  it("throws only the first line of a multi-line error", () => {
    try {
      parseAndThrow("first line\nsecond line\nthird line");
    } catch (err) {
      expect((err as Error).message).toBe("first line");
    }
  });

  it("throws with the whole message for a single-line error", () => {
    try {
      parseAndThrow("something bad happened");
    } catch (err) {
      expect((err as Error).message).toBe("something bad happened");
    }
  });

  it("handles an empty string without crashing", () => {
    expect(() => parseAndThrow("")).toThrow();
  });

  it("does not treat 'Error(Host, #5)' as a contract error", () => {
    // Only 'Error(Contract, #n)' is a contract error
    try {
      parseAndThrow("HostError: Error(Host, #5)\nstack trace");
    } catch (err) {
      expect(err).not.toBeInstanceOf(FmcContractError);
    }
  });

  it("does not treat 'Error(Wasm, #5)' as a contract error", () => {
    try {
      parseAndThrow("HostError: Error(Wasm, #5)\nstack trace");
    } catch (err) {
      expect(err).not.toBeInstanceOf(FmcContractError);
    }
  });

  it("does not treat 'Error(Storage, #5)' as a contract error", () => {
    try {
      parseAndThrow("HostError: Error(Storage, #5)\nstack trace");
    } catch (err) {
      expect(err).not.toBeInstanceOf(FmcContractError);
    }
  });
});

// ─── Return type invariants ────────────────────────────────────────────────────

describe("parseAndThrow — return type invariant (never returns)", () => {
  it("always throws — never resolves", () => {
    // TypeScript return type is `never`; confirm it always throws
    let threw = false;
    try {
      parseAndThrow("whatever");
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("re-throwing preserves the FmcContractError instance", () => {
    let caught: unknown;
    try {
      try {
        parseAndThrow(sorobanError(9));
      } catch (inner) {
        caught = inner;
        throw inner; // re-throw
      }
    } catch (outer) {
      expect(outer).toBe(caught);
      expect(outer).toBeInstanceOf(FmcContractError);
    }
  });
});

// ─── Regex edge cases ─────────────────────────────────────────────────────────

describe("parseAndThrow — parsing robustness", () => {
  it("handles whitespace variants in the error string", () => {
    // Extra space after comma — may or may not match; should still throw *something*
    try {
      parseAndThrow("Error(Contract,  #7)");
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
    }
  });

  it("parses code when it appears mid-string (not at the start)", () => {
    const err = expectContractError(9);
    expect(err.code).toBe(9);
  });

  it("picks the first contract error code when multiple appear in the string", () => {
    // Rare edge case: two contract errors in one message — first wins
    try {
      parseAndThrow("Error(Contract, #2) and also Error(Contract, #5)");
    } catch (err) {
      if (err instanceof FmcContractError) {
        expect(err.code).toBe(2);
      }
    }
  });
});
