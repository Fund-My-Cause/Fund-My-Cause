/** Thrown when the Soroban contract returns a `ContractError(n)`. */
export class FmcContractError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
    this.name = "FmcContractError";
  }
}

/**
 * Human-readable messages for every `ContractError` variant defined in
 * `contracts/crowdfund/src/errors.rs` (codes 1–69).
 *
 * The map is intentionally exhaustive — every code that exists on-chain has a
 * descriptive entry here.  Unknown future codes fall back to the generic
 * `"Contract error <n>."` template produced by `parseAndThrow`.
 */
const ERROR_MESSAGES: Record<number, string> = {
  // ── Lifecycle / state ──────────────────────────────────────────────────────
  1:  "Contract is already initialized.",
  2:  "Campaign has ended.",
  3:  "Campaign is still active.",
  4:  "Funding goal has not been reached.",
  5:  "Funding goal was reached — refunds are not available.",
  6:  "Arithmetic overflow.",
  7:  "Campaign is not in Active status.",
  8:  "Fee basis points exceed 10 000.",
  9:  "Amount is below the minimum contribution.",
  10: "Invalid deadline.",
  11: "Campaign is paused.",
  12: "Invalid goal — must be greater than 0.",
  13: "Token is not accepted by this campaign.",
  14: "This would exceed your per-contributor cap.",
  15: "This is a whitelist-only campaign.",
  16: "Your address is blacklisted.",
  17: "Invalid delegation.",
  18: "No delegation found.",
  19: "Invalid template.",
  20: "Voting period has ended.",
  21: "Invalid recurring contribution plan.",
  22: "Partial refund exceeds 50% of your contribution.",
  23: "Vesting cliff has not been reached yet.",
  24: "Emergency withdrawal is locked.",
  25: "Rate limit exceeded — try again later.",
  26: "Message is too long (max 256 characters).",
  27: "String field must not be empty.",
  28: "String field exceeds the maximum allowed length.",
  29: "Amount must be a positive number.",
  30: "Platform fee address must differ from the campaign creator.",
  31: "Goal would overflow — value too large.",
  32: "Insufficient funds.",
  33: "Unauthorized.",
  34: "Rate limit configuration is invalid.",
  35: "Multi-sig approval requirement not met.",
  36: "Proposal not found.",
  37: "You have already voted on this proposal.",
  38: "Rewards are not configured for this campaign.",
  39: "You are not the campaign creator.",
  40: "Milestone not found.",
  41: "Milestone has already been reached.",
  42: "Campaign verification has not been approved.",
  43: "Dispute not found.",
  44: "You have already voted on this dispute.",
  45: "Dispute voting period has ended.",
  46: "Analytics data is not available.",
  47: "Governance proposal not found.",
  48: "You have already voted on this governance proposal.",
  49: "Governance voting period has ended.",
  50: "Not enough approvals to execute this governance proposal.",
  51: "Governance timelock has not yet expired.",
  52: "Address is not a designated governor.",
  53: "Governance proposal is not in a ready state.",
  54: "Governance proposal has already been executed.",
  55: "Contract is emergency-paused by governance.",
  56: "Reentrancy detected — recursive call not allowed.",
  57: "Emergency pause is active.",
  58: "Invalid input provided.",
  59: "Requested item not found.",
  60: "Invalid campaign category.",
  61: "Contribution would exceed the per-contributor cap.",
  62: "No withdrawal stream is configured for this campaign.",
  63: "Stream amount is not yet claimable.",
  64: "Stream has been fully claimed — nothing left to withdraw.",
  65: "Campaign is not in the correct state for this operation.",
  66: "Campaign deadline has not been reached yet.",
  67: "No contribution found to refund.",
  68: "Initialization parameters are invalid.",
  69: "Withdrawal has already been executed.",
};

/**
 * Parse a raw Soroban simulation/execution error string and throw a typed
 * `FmcContractError` when a contract error code is detected.
 *
 * Recognises the canonical Soroban simulation error format:
 * ```
 * HostError: Error(Contract, #<code>)
 * ```
 *
 * For any code not present in `ERROR_MESSAGES` a fallback message of the form
 * `"Contract error <code>."` is used so the caller always gets a non-empty
 * message string.
 *
 * For error strings that do not match the contract error pattern, a plain
 * `Error` is thrown with only the first line of `raw` as the message (so
 * stack-trace noise is stripped).
 *
 * @param raw - The raw error string returned by a Soroban RPC call.
 * @returns never — always throws.
 */
export function parseAndThrow(raw: string): never {
  const codeMatch = raw.match(/Error\(Contract,\s*#(\d+)\)/);
  if (codeMatch) {
    const code = Number(codeMatch[1]);
    const msg  = ERROR_MESSAGES[code] ?? `Contract error ${code}.`;
    throw new FmcContractError(code, msg);
  }
  throw new Error(raw.split("\n")[0] ?? "Unknown contract error.");
}
