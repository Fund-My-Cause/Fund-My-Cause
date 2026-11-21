//! # Internal Helper Functions
//!
//! Shared helpers used across multiple contract endpoints.

use soroban_sdk::{Address, Env};

use crate::{errors::ContractError, storage::KEY_CREATOR};

/// Reads the campaign creator and requires their authorization, without any
/// status check.
///
/// Access-control changes (whitelist, blacklist, visibility, ownership) are
/// deliberately allowed on a non-Active campaign: a creator still has to be able
/// to correct an access list after the campaign is paused or has ended. Only
/// `pause()` gates on `Status::Active`, and it checks that itself.
///
/// ## Issue #1147
/// Delegates to [`common::AccessControl::require_stored_auth`] — the shared
/// helper that replaced the inline "read KEY_CREATOR → require_auth" pattern
/// that was duplicated across `access.rs` and this file. The behaviour is
/// identical: returns the creator address on success or
/// `ContractError::InvalidAddress` when the contract is uninitialised.
///
/// # Returns
/// - `Ok(Address)` with the creator's address, having required their auth
/// - `Err(ContractError::InvalidAddress)` if the contract was never initialized
pub(crate) fn require_auth_creator(env: &Env) -> Result<Address, ContractError> {
    common::AccessControl::require_stored_auth(env, &KEY_CREATOR)
        .map_err(|_| ContractError::InvalidAddress)
}

/// Returns the current ledger timestamp (in seconds).
///
/// ## Issue #1718
/// Single source of truth for ledger-time reads. All deadline comparisons in
/// the contract must go through this helper (or the wrappers below) so that
/// time handling stays consistent and auditable.
#[inline]
pub(crate) fn now(env: &Env) -> u64 {
    env.ledger().timestamp()
}

/// Returns `true` when the current ledger time is strictly past `deadline`.
///
/// A campaign is considered ended only once `now > deadline`; at exactly
/// `now == deadline` the campaign is still open (inclusive deadline).
#[inline]
pub(crate) fn deadline_passed(env: &Env, deadline: u64) -> bool {
    now(env) > deadline
}

/// Returns `true` when the current ledger time is at or before `deadline`.
///
/// This is the exact complement of [`deadline_passed`]: at `now == deadline`
/// the campaign is still open.
#[inline]
pub(crate) fn deadline_not_passed(env: &Env, deadline: u64) -> bool {
    !deadline_passed(env, deadline)
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Ledger;

    fn env_at(timestamp: u64) -> Env {
        let env = Env::default();
        env.ledger().set_timestamp(timestamp);
        env
    }

    #[test]
    fn now_returns_ledger_timestamp() {
        let env = env_at(1_234_567);
        assert_eq!(now(&env), 1_234_567);
    }

    #[test]
    fn deadline_boundary_before() {
        let deadline = 1_000u64;
        let env = env_at(deadline - 1);
        assert!(!deadline_passed(&env, deadline));
        assert!(deadline_not_passed(&env, deadline));
    }

    #[test]
    fn deadline_boundary_at() {
        let deadline = 1_000u64;
        let env = env_at(deadline);
        assert!(!deadline_passed(&env, deadline));
        assert!(deadline_not_passed(&env, deadline));
    }

    #[test]
    fn deadline_boundary_after() {
        let deadline = 1_000u64;
        let env = env_at(deadline + 1);
        assert!(deadline_passed(&env, deadline));
        assert!(!deadline_not_passed(&env, deadline));
    }
}