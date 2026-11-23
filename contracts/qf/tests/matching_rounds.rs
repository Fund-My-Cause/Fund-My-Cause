//! # Quadratic Funding Matching Round Tests (Issue #1732)
//!
//! Comprehensive tests for QF calculation logic:
//! - Matching round calculations with quadratic funding formula
//! - Edge cases (zero contributions, single contributor, equal distributions)
//! - Invariant validation (monotonicity, distribution bounds)
//!
//! Targets 90% coverage of QF contract logic.

#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env, Map, String};
use qf::{QFInput, QFResult, QuadraticFunding};

// ═══════════════════════════════════════════════════════════════════════════════
// BASIC MATCHING ROUND TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test simple matching round with single recipient
#[test]
fn test_simple_matching_round_single_recipient() {
    let env = Env::default();
    
    let recipient = Address::generate(&env);
    
    let mut contributions = Map::new(&env);
    contributions.set(recipient.clone(), 1000i128);
    
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient.clone(), 1u64);
    
    let input = QFInput {
        matching_pool: 500i128,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    };
    
    let result = QuadraticFunding::calculate(input).unwrap();
    
    // Verify result structure
    assert_eq!(result.allocations.len(), 1);
    assert!(result.total_distributed <= 500i128);
    assert_eq!(result.recipients_funded, 1u64);
    assert_eq!(result.total_contributors, 1u64);
}

/// Test matching round with multiple recipients
#[test]
fn test_matching_round_multiple_recipients() {
    let env = Env::default();
    
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    let recipient3 = Address::generate(&env);
    
    let mut contributions = Map::new(&env);
    contributions.set(recipient1.clone(), 1000i128);
    contributions.set(recipient2.clone(), 2000i128);
    contributions.set(recipient3.clone(), 1500i128);
    
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient1.clone(), 1u64);
    contributor_counts.set(recipient2.clone(), 2u64);
    contributor_counts.set(recipient3.clone(), 3u64);
    
    let input = QFInput {
        matching_pool: 1000i128,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    };
    
    let result = QuadraticFunding::calculate(input).unwrap();
    
    // Verify all recipients funded
    assert_eq!(result.allocations.len(), 3);
    assert!(result.total_distributed <= 1000i128);
    assert_eq!(result.recipients_funded, 3u64);
}

/// Test matching round respects pool limit
#[test]
fn test_matching_round_respects_pool_limit() {
    let env = Env::default();
    
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    
    let mut contributions = Map::new(&env);
    contributions.set(recipient1.clone(), 10000i128);
    contributions.set(recipient2.clone(), 10000i128);
    
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient1.clone(), 10u64);
    contributor_counts.set(recipient2.clone(), 10u64);
    
    let pool = 500i128;
    let input = QFInput {
        matching_pool: pool,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    };
    
    let result = QuadraticFunding::calculate(input).unwrap();
    
    // Verify total distributed doesn't exceed pool
    assert!(result.total_distributed <= pool);
    assert_eq!(result.remaining_pool, pool - result.total_distributed);
}

/// Test matching round with equal contributions
#[test]
fn test_matching_round_equal_contributions() {
    let env = Env::default();
    
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    
    let mut contributions = Map::new(&env);
    contributions.set(recipient1.clone(), 1000i128);
    contributions.set(recipient2.clone(), 1000i128);
    
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient1.clone(), 1u64);
    contributor_counts.set(recipient2.clone(), 1u64);
    
    let input = QFInput {
        matching_pool: 1000i128,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    };
    
    let result = QuadraticFunding::calculate(input).unwrap();
    
    // Verify allocations are equal
    let alloc1 = result.allocations.get(recipient1.clone()).unwrap_or(0i128);
    let alloc2 = result.allocations.get(recipient2.clone()).unwrap_or(0i128);
    
    assert_eq!(alloc1, alloc2);
    assert_eq!(result.recipients_funded, 2u64);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDGE CASE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test matching round with zero pool
#[test]
fn test_matching_round_zero_pool_fails() {
    let env = Env::default();
    
    let recipient = Address::generate(&env);
    
    let mut contributions = Map::new(&env);
    contributions.set(recipient.clone(), 1000i128);
    
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient.clone(), 1u64);
    
    let input = QFInput {
        matching_pool: 0i128,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    };
    
    let result = QuadraticFunding::calculate(input);
    
    // Verify error for zero pool
    assert!(result.is_err());
}

/// Test matching round with negative pool fails
#[test]
fn test_matching_round_negative_pool_fails() {
    let env = Env::default();
    
    let recipient = Address::generate(&env);
    
    let mut contributions = Map::new(&env);
    contributions.set(recipient.clone(), 1000i128);
    
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient.clone(), 1u64);
    
    let input = QFInput {
        matching_pool: -1000i128,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    };
    
    let result = QuadraticFunding::calculate(input);
    
    // Verify error for negative pool
    assert!(result.is_err());
}

/// Test matching round with no contributions fails
#[test]
fn test_matching_round_no_contributions_fails() {
    let env = Env::default();
    
    let contributions = Map::new(&env);
    let contributor_counts = Map::new(&env);
    
    let input = QFInput {
        matching_pool: 1000i128,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    };
    
    let result = QuadraticFunding::calculate(input);
    
    // Verify error for no contributions
    assert!(result.is_err());
}

/// Test matching round with single contributor
#[test]
fn test_matching_round_single_contributor() {
    let env = Env::default();
    
    let recipient = Address::generate(&env);
    
    let mut contributions = Map::new(&env);
    contributions.set(recipient.clone(), 1000i128);
    
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient.clone(), 1u64);
    
    let input = QFInput {
        matching_pool: 500i128,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    };
    
    let result = QuadraticFunding::calculate(input).unwrap();
    
    // Single contributor gets portion based on sqrt(1) = 1
    assert_eq!(result.recipients_funded, 1u64);
    assert_eq!(result.total_contributors, 1u64);
    assert!(result.total_distributed > 0i128);
}

/// Test matching round with many equal contributors
#[test]
fn test_matching_round_many_equal_contributors() {
    let env = Env::default();
    
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    
    // Both recipients get same amount per contributor
    let mut contributions = Map::new(&env);
    contributions.set(recipient1.clone(), 1000i128);
    contributions.set(recipient2.clone(), 1000i128);
    
    // Both have 10 contributors
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient1.clone(), 10u64);
    contributor_counts.set(recipient2.clone(), 10u64);
    
    let input = QFInput {
        matching_pool: 1000i128,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    };
    
    let result = QuadraticFunding::calculate(input).unwrap();
    
    // Both should get equal matching allocations
    let alloc1 = result.allocations.get(recipient1.clone()).unwrap_or(0i128);
    let alloc2 = result.allocations.get(recipient2.clone()).unwrap_or(0i128);
    
    assert_eq!(alloc1, alloc2);
    assert_eq!(result.recipients_funded, 2u64);
}

/// Test matching round with different contributor counts
#[test]
fn test_matching_round_different_contributor_counts() {
    let env = Env::default();
    
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    
    // Same contribution amount but different contributor counts
    let mut contributions = Map::new(&env);
    contributions.set(recipient1.clone(), 1000i128);
    contributions.set(recipient2.clone(), 1000i128);
    
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient1.clone(), 1u64);  // Single contributor
    contributor_counts.set(recipient2.clone(), 10u64); // Many contributors
    
    let input = QFInput {
        matching_pool: 1000i128,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    };
    
    let result = QuadraticFunding::calculate(input).unwrap();
    
    // Recipient with more contributors should get more matching
    let alloc1 = result.allocations.get(recipient1.clone()).unwrap_or(0i128);
    let alloc2 = result.allocations.get(recipient2.clone()).unwrap_or(0i128);
    
    assert!(alloc2 > alloc1);
    assert_eq!(result.recipients_funded, 2u64);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MINIMUM THRESHOLD TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test matching round with minimum threshold
#[test]
fn test_matching_round_min_threshold() {
    let env = Env::default();
    
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    
    let mut contributions = Map::new(&env);
    contributions.set(recipient1.clone(), 500i128);  // Below threshold
    contributions.set(recipient2.clone(), 1500i128); // Above threshold
    
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient1.clone(), 1u64);
    contributor_counts.set(recipient2.clone(), 1u64);
    
    let min_threshold = 1000i128;
    let input = QFInput {
        matching_pool: 1000i128,
        contributions,
        contributor_counts,
        min_threshold,
    };
    
    let result = QuadraticFunding::calculate(input).unwrap();
    
    // Only recipient2 should be funded
    assert_eq!(result.recipients_funded, 1u64);
    assert!(result.allocations.get(recipient1.clone()).is_none() ||
            result.allocations.get(recipient1.clone()).unwrap_or(0i128) == 0i128);
}

/// Test matching round with equal contribution to threshold
#[test]
fn test_matching_round_equal_to_threshold() {
    let env = Env::default();
    
    let recipient = Address::generate(&env);
    
    let mut contributions = Map::new(&env);
    contributions.set(recipient.clone(), 1000i128);
    
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient.clone(), 1u64);
    
    let min_threshold = 1000i128;
    let input = QFInput {
        matching_pool: 500i128,
        contributions,
        contributor_counts,
        min_threshold,
    };
    
    let result = QuadraticFunding::calculate(input).unwrap();
    
    // Recipient should be funded (equal to threshold)
    assert_eq!(result.recipients_funded, 1u64);
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVARIANT TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test monotonicity: more contributions → more funding
#[test]
fn test_monotonicity_contributions() {
    let env = Env::default();
    
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    
    // Test with same number of contributors, different contributions
    let mut contributions1 = Map::new(&env);
    contributions1.set(recipient1.clone(), 500i128);
    contributions1.set(recipient2.clone(), 1500i128);
    
    let mut contributor_counts1 = Map::new(&env);
    contributor_counts1.set(recipient1.clone(), 1u64);
    contributor_counts1.set(recipient2.clone(), 1u64);
    
    let input1 = QFInput {
        matching_pool: 1000i128,
        contributions: contributions1,
        contributor_counts: contributor_counts1,
        min_threshold: 0i128,
    };
    
    let result1 = QuadraticFunding::calculate(input1).unwrap();
    
    let alloc1_low = result1.allocations.get(recipient1.clone()).unwrap_or(0i128);
    let alloc1_high = result1.allocations.get(recipient2.clone()).unwrap_or(0i128);
    
    // Higher contribution should result in higher matching
    assert!(alloc1_high > alloc1_low);
}

/// Test monotonicity: more contributors → more matching
#[test]
fn test_monotonicity_contributors() {
    let env = Env::default();
    
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    
    // Test with same contribution, different number of contributors
    let mut contributions = Map::new(&env);
    contributions.set(recipient1.clone(), 1000i128);
    contributions.set(recipient2.clone(), 1000i128);
    
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient1.clone(), 1u64);
    contributor_counts.set(recipient2.clone(), 10u64);
    
    let input = QFInput {
        matching_pool: 1000i128,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    };
    
    let result = QuadraticFunding::calculate(input).unwrap();
    
    let alloc_few = result.allocations.get(recipient1.clone()).unwrap_or(0i128);
    let alloc_many = result.allocations.get(recipient2.clone()).unwrap_or(0i128);
    
    // More contributors should result in more matching
    assert!(alloc_many > alloc_few);
}

/// Test zero contribution → zero funding
#[test]
fn test_zero_contribution_zero_funding() {
    let env = Env::default();
    
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    
    let mut contributions = Map::new(&env);
    contributions.set(recipient1.clone(), 0i128);
    contributions.set(recipient2.clone(), 1000i128);
    
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient1.clone(), 0u64);
    contributor_counts.set(recipient2.clone(), 1u64);
    
    let input = QFInput {
        matching_pool: 1000i128,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    };
    
    let result = QuadraticFunding::calculate(input).unwrap();
    
    // Zero contribution recipient shouldn't be funded
    let alloc_zero = result.allocations.get(recipient1.clone()).unwrap_or(0i128);
    assert_eq!(alloc_zero, 0i128);
}

/// Test total distributed ≤ pool
#[test]
fn test_total_distributed_bounded() {
    let env = Env::default();
    
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    let recipient3 = Address::generate(&env);
    
    let mut contributions = Map::new(&env);
    contributions.set(recipient1.clone(), 10000i128);
    contributions.set(recipient2.clone(), 20000i128);
    contributions.set(recipient3.clone(), 30000i128);
    
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient1.clone(), 10u64);
    contributor_counts.set(recipient2.clone(), 20u64);
    contributor_counts.set(recipient3.clone(), 30u64);
    
    let pool = 500i128;
    let input = QFInput {
        matching_pool: pool,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    };
    
    let result = QuadraticFunding::calculate(input).unwrap();
    
    // Total distributed must not exceed pool
    assert!(result.total_distributed <= pool);
    // Remaining must be pool - distributed
    assert_eq!(result.remaining_pool, pool - result.total_distributed);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATION ACCURACY TESTS
// ═══════════════════════════════════════════════════════════════════════════════

/// Test QF formula correctness: simple case
#[test]
fn test_qf_formula_simple() {
    let env = Env::default();
    
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    
    // Equal contributions, equal contributors
    // Should split pool equally
    let mut contributions = Map::new(&env);
    contributions.set(recipient1.clone(), 1000i128);
    contributions.set(recipient2.clone(), 1000i128);
    
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient1.clone(), 1u64);
    contributor_counts.set(recipient2.clone(), 1u64);
    
    let input = QFInput {
        matching_pool: 1000i128,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    };
    
    let result = QuadraticFunding::calculate(input).unwrap();
    
    let alloc1 = result.allocations.get(recipient1.clone()).unwrap_or(0i128);
    let alloc2 = result.allocations.get(recipient2.clone()).unwrap_or(0i128);
    
    // Both should receive equal matching (by symmetry)
    assert_eq!(alloc1, alloc2);
    
    // Combined shouldn't exceed pool
    assert!(alloc1 + alloc2 <= 1000i128);
}

/// Test large value handling
#[test]
fn test_large_value_handling() {
    let env = Env::default();
    
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    
    let mut contributions = Map::new(&env);
    contributions.set(recipient1.clone(), 1_000_000_000i128);
    contributions.set(recipient2.clone(), 2_000_000_000i128);
    
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient1.clone(), 1_000u64);
    contributor_counts.set(recipient2.clone(), 2_000u64);
    
    let input = QFInput {
        matching_pool: 1_000_000i128,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    };
    
    let result = QuadraticFunding::calculate(input).unwrap();
    
    // Verify no overflow and valid result
    assert!(result.total_distributed > 0i128);
    assert!(result.total_distributed <= 1_000_000i128);
}

/// Test small value handling
#[test]
fn test_small_value_handling() {
    let env = Env::default();
    
    let recipient = Address::generate(&env);
    
    let mut contributions = Map::new(&env);
    contributions.set(recipient.clone(), 1i128);
    
    let mut contributor_counts = Map::new(&env);
    contributor_counts.set(recipient.clone(), 1u64);
    
    let input = QFInput {
        matching_pool: 1i128,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    };
    
    let result = QuadraticFunding::calculate(input).unwrap();
    
    // Should handle small values correctly
    assert!(result.total_distributed >= 0i128);
    assert!(result.total_distributed <= 1i128);
}
