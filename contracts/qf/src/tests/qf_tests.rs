#![cfg(test)]
use super::*;
use soroban_sdk::{Env, Address, Map};
use proptest::prelude::*;

/// Property: QF calculation is deterministic
proptest! {
    #[test]
    fn property_deterministic(
        pool in 1000i128..100000i128,
        num_recipients in 2u64..10u64,
        contrib in 1i128..5000i128,
        contributors in 1u64..50u64,
    ) {
        let env = Env::default();

        let mut contributions1 = Map::new(&env);
        let mut contributions2 = Map::new(&env);
        let mut contributor_counts1 = Map::new(&env);
        let mut contributor_counts2 = Map::new(&env);

        let mut recipients = Vec::new(&env);
        for i in 0..num_recipients {
            let addr = Address::random(&env);
            recipients.push_back(addr.clone());
            contributions1.set(addr.clone(), contrib);
            contributions2.set(addr.clone(), contrib);
            contributor_counts1.set(addr.clone(), contributors);
            contributor_counts2.set(addr.clone(), contributors);
        }

        let input1 = QFInput {
            matching_pool: pool,
            contributions: contributions1,
            contributor_counts: contributor_counts1,
            min_threshold: 0,
        };

        let input2 = QFInput {
            matching_pool: pool,
            contributions: contributions2,
            contributor_counts: contributor_counts2,
            min_threshold: 0,
        };

        let result1 = QuadraticFunding::calculate(input1);
        let result2 = QuadraticFunding::calculate(input2);

        // Both results should be identical
        if let (Ok(r1), Ok(r2)) = (result1, result2) {
            assert_eq!(r1.total_distributed, r2.total_distributed);
            assert_eq!(r1.remaining_pool, r2.remaining_pool);
            assert_eq!(r1.recipients_funded, r2.recipients_funded);

            // Check allocations match
            for (addr, amount) in r1.allocations.iter() {
                let amount2 = r2.allocations.get(addr).unwrap();
                assert_eq!(amount, amount2);
            }
        }
    }
}

/// Property: Recipients with zero contributions get zero funding
proptest! {
    #[test]
    fn property_zero_contrib_zero_funding(
        pool in 1000i128..100000i128,
        num_recipients in 2u64..10u64,
        contrib in 1i128..5000i128,
        contributors in 1u64..50u64,
    ) {
        let env = Env::default();

        let mut contributions = Map::new(&env);
        let mut contributor_counts = Map::new(&env);

        // First recipient gets contributions
        let addr1 = Address::random(&env);
        contributions.set(addr1.clone(), contrib);
        contributor_counts.set(addr1.clone(), contributors);

        // Second recipient gets zero
        let addr2 = Address::random(&env);
        contributions.set(addr2.clone(), 0);
        contributor_counts.set(addr2.clone(), 0);

        let input = QFInput {
            matching_pool: pool,
            contributions,
            contributor_counts,
            min_threshold: 0,
        };

        let result = QuadraticFunding::calculate(input);

        if let Ok(r) = result {
            // Only the first recipient should get funding
            assert_eq!(r.recipients_funded, 1);
            // The second recipient should not be in the allocations
            assert!(!r.allocations.contains_key(&addr2));
            // The first recipient should have at least their contribution
            let allocation = r.allocations.get(addr1).unwrap();
            assert!(allocation >= contrib);
        }
    }
}
