//! Shared validation helpers for Fund-My-Cause Soroban contracts.
//!
//! These are primitive, context-free checks with no dependency on
//! contract-specific storage or types.  Each function returns
//! [`CommonError`] so callers can fold the result into their own
//! `ContractError` via the standard `From<CommonError>` impl.

use crate::error::CommonError;

/// Validates that an `i128` amount is strictly positive (> 0).
///
/// This is the single canonical implementation of the "amount must be
/// positive" check previously duplicated as:
/// - `achievements/src/validation.rs::validate_amount` (returns `ContractError::InvalidAmount`)
/// - `crowdfund/src/validation.rs::validate_positive_amount` (returns `ContractError::AmountNotPositive`)
///
/// Both callers now delegate here and let their `From<CommonError>` impl
/// map `CommonError::InvalidInput` onto the appropriate local variant.
///
/// # Arguments
/// * `amount` — the value to check
///
/// # Returns
/// * `Ok(())` if `amount > 0`
/// * `Err(CommonError::InvalidInput)` otherwise
pub fn validate_positive_amount(amount: i128) -> Result<(), CommonError> {
    if amount <= 0 {
        return Err(CommonError::InvalidInput);
    }
    Ok(())
}

/// Validates that a campaign goal is strictly positive and within safe bounds.
///
/// A goal must be `> 0` to represent a meaningful funding target, and must not
/// exceed `i128::MAX / 2` so that comparisons and accumulations against it
/// (e.g. `total_raised >= goal`) cannot overflow.
///
/// # Arguments
/// * `goal` — the campaign goal value to check
///
/// # Returns
/// * `Ok(())` if the goal is valid
/// * `Err(CommonError::InvalidInput)` if `goal <= 0`
/// * `Err(CommonError::Overflow)` if `goal > i128::MAX / 2`
pub fn validate_goal(goal: i128) -> Result<(), CommonError> {
    if goal <= 0 {
        return Err(CommonError::InvalidInput);
    }
    if goal > i128::MAX / 2 {
        return Err(CommonError::Overflow);
    }
    Ok(())
}

/// Validates that a campaign deadline is strictly in the future.
///
/// The deadline must be greater than `current_time` so contributors have a
/// non-zero window to participate.
///
/// # Arguments
/// * `deadline`     — proposed deadline timestamp (Unix seconds)
/// * `current_time` — current ledger timestamp (Unix seconds)
///
/// # Returns
/// * `Ok(())` if `deadline > current_time`
/// * `Err(CommonError::InvalidInput)` otherwise
pub fn validate_deadline(deadline: u64, current_time: u64) -> Result<(), CommonError> {
    if deadline <= current_time {
        return Err(CommonError::InvalidInput);
    }
    Ok(())
}

/// Validates that `min_amount` and `max_amount` form a coherent range.
///
/// Rules:
/// - Neither value may be negative.
/// - If `max_amount > 0`, it must be `>= min_amount`.
///   A `max_amount` of `0` is treated as "no cap".
///
/// # Returns
/// * `Ok(())` if the range is valid
/// * `Err(CommonError::InvalidInput)` otherwise
pub fn validate_amount_range(min_amount: i128, max_amount: i128) -> Result<(), CommonError> {
    if min_amount < 0 || max_amount < 0 {
        return Err(CommonError::InvalidInput);
    }
    if max_amount > 0 && max_amount < min_amount {
        return Err(CommonError::InvalidInput);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn positive_amount_is_valid() {
        assert!(validate_positive_amount(1).is_ok());
        assert!(validate_positive_amount(i128::MAX).is_ok());
    }

    #[test]
    fn zero_is_invalid() {
        assert_eq!(validate_positive_amount(0), Err(CommonError::InvalidInput));
    }

    #[test]
    fn negative_is_invalid() {
        assert_eq!(validate_positive_amount(-1), Err(CommonError::InvalidInput));
        assert_eq!(
            validate_positive_amount(i128::MIN),
            Err(CommonError::InvalidInput)
        );
    }

    // ── validate_goal ────────────────────────────────────────────────────────

    #[test]
    fn goal_positive_is_valid() {
        assert!(validate_goal(1).is_ok());
        assert!(validate_goal(1_000_000).is_ok());
        assert!(validate_goal(i128::MAX / 2).is_ok());
    }

    #[test]
    fn goal_zero_or_negative_is_invalid() {
        assert_eq!(validate_goal(0), Err(CommonError::InvalidInput));
        assert_eq!(validate_goal(-1), Err(CommonError::InvalidInput));
    }

    #[test]
    fn goal_overflow_is_rejected() {
        assert_eq!(validate_goal(i128::MAX / 2 + 1), Err(CommonError::Overflow));
        assert_eq!(validate_goal(i128::MAX), Err(CommonError::Overflow));
    }

    // ── validate_deadline ────────────────────────────────────────────────────

    #[test]
    fn deadline_in_future_is_valid() {
        assert!(validate_deadline(100, 0).is_ok());
        assert!(validate_deadline(u64::MAX, u64::MAX - 1).is_ok());
    }

    #[test]
    fn deadline_equal_or_past_is_invalid() {
        assert_eq!(validate_deadline(0, 0), Err(CommonError::InvalidInput));
        assert_eq!(validate_deadline(5, 10), Err(CommonError::InvalidInput));
    }

    // ── validate_amount_range ────────────────────────────────────────────────

    #[test]
    fn valid_amount_ranges() {
        assert!(validate_amount_range(0, 0).is_ok());
        assert!(validate_amount_range(100, 1000).is_ok());
        assert!(validate_amount_range(100, 100).is_ok());
        assert!(validate_amount_range(100, 0).is_ok());
    }

    #[test]
    fn negative_min_or_max_is_invalid() {
        assert_eq!(validate_amount_range(-1, 100), Err(CommonError::InvalidInput));
        assert_eq!(validate_amount_range(0, -1), Err(CommonError::InvalidInput));
    }

    #[test]
    fn max_less_than_min_is_invalid() {
        assert_eq!(validate_amount_range(200, 100), Err(CommonError::InvalidInput));
    }
}
