cat > contracts/crowdfund/src/tests/panic_regression.rs << 'EOF'
#![cfg(test)]
use super::*;
use soroban_sdk::{Env, Address, String, testutils::Address as _};
use crate::ContractError;

/// Test that arithmetic operations don't panic
#[test]
fn test_no_panic_on_arithmetic() {
    // Test safe math operations
    // These should return errors, not panic
    let env = Env::default();
    let addr = Address::random(&env);

    // Test with invalid amounts
    let result = CrowdfundContract::contribute(
        env.clone(),
        addr.clone(),
        0, // Zero amount
        String::from_str(&env, "XLM"),
        None,
    );
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), ContractError::BelowMinimum);

    // Test with negative amount
    let result = CrowdfundContract::contribute(
        env.clone(),
        addr.clone(),
        -100,
        String::from_str(&env, "XLM"),
        None,
    );
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), ContractError::BelowMinimum);
}

#[test]
fn test_no_panic_on_overflow() {
    let env = Env::default();
    let addr = Address::random(&env);

    // Try to contribute a huge amount
    let result = CrowdfundContract::contribute(
        env.clone(),
        addr.clone(),
        i128::MAX,
        String::from_str(&env, "XLM"),
        None,
    );
    // Should return an error, not panic
    assert!(result.is_err());
}

#[test]
fn test_no_panic_on_uninitialized() {
    let env = Env::default();
    let addr = Address::random(&env);

    // Try to contribute to uninitialized campaign
    let result = CrowdfundContract::contribute(
        env.clone(),
        addr.clone(),
        100,
        String::from_str(&env, "XLM"),
        None,
    );
    assert!(result.is_err());
}

#[test]
fn test_no_panic_on_invalid_goal() {
    let env = Env::default();
    let creator = Address::random(&env);

    // Try to create campaign with invalid goal
    let result = CrowdfundContract::initialize(
        env.clone(),
        creator.clone(),
        Address::random(&env),
        0, // Invalid goal
        env.ledger().timestamp() + 1000,
        0,
        0,
        String::from_str(&env, "Title"),
        String::from_str(&env, "Description"),
        None,
        None,
        None,
        Category::Other,
        None,
        None,
    );
    assert!(result.is_err());
}

#[test]
fn test_no_panic_on_past_deadline() {
    let env = Env::default();
    let creator = Address::random(&env);

    // Try to create campaign with past deadline
    let result = CrowdfundContract::initialize(
        env.clone(),
        creator.clone(),
        Address::random(&env),
        1000,
        env.ledger().timestamp() - 1000, // Past deadline
        0,
        0,
        String::from_str(&env, "Title"),
        String::from_str(&env, "Description"),
        None,
        None,
        None,
        Category::Other,
        None,
        None,
    );
    assert!(result.is_err());
}
EOF