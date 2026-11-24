#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env,
};

use crowdfund::PlatformConfig;

mod common;
use common::setup;

// ── full lifecycle: 5 contributors → deadline passes → creator withdraws ─────

#[test]
fn test_full_lifecycle_success_with_platform_fee() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 5_000i128;
    let platform_addr = Address::generate(&env);
    let fee_bps = 250u32; // 2.5 %

    let c = setup(
        &env,
        goal,
        deadline,
        Some(PlatformConfig {
            address: platform_addr.clone(),
            fee_bps,
            fee_mode: crowdfund::FeeMode::OnSuccess,
        }),
    );

    let contributors: Vec<Address> = (0..5).map(|_| Address::generate(&env)).collect();
    let amounts = [1_000i128, 1_000, 1_000, 1_000, 1_000];

    env.ledger().set_timestamp(500);
    for (addr, &amt) in contributors.iter().zip(amounts.iter()) {
        c.token_admin.mint(addr, &amt);
        c.client.contribute(addr, &amt, &c.token_id, &None);
    }

    // Goal reached
    assert_eq!(c.client.total_raised(), goal);
    let stats = c.client.get_stats();
    assert_eq!(stats.progress_bps, 10_000);
    assert_eq!(stats.contributor_count, 5);

    // Advance past deadline
    env.ledger().set_timestamp(deadline + 1);

    let creator_before = c.token.balance(&c.creator);
    let platform_before = c.token.balance(&platform_addr);

    c.client.withdraw();

    // ── balance assertions ────────────────────────────────────────────────────
    let fee = goal * fee_bps as i128 / 10_000; // 125
    let payout = goal - fee; // 4_875

    assert_eq!(c.token.balance(&c.creator), creator_before + payout);
    assert_eq!(c.token.balance(&platform_addr), platform_before + fee);
    assert_eq!(c.token.balance(&c.contract_id), 0);

    // ── post-withdraw state ───────────────────────────────────────────────────
    assert_eq!(c.client.total_raised(), 0);

    // Contributor storage is not zeroed by withdraw (only by refund_single).
    // Verify the 5 contributions are still recorded (non-zero) in persistent storage.
    for (addr, &amt) in contributors.iter().zip(amounts.iter()) {
        assert_eq!(c.client.contribution(addr), amt);
    }
}

// ── goal not met → all 5 contributors claim refunds → contract empty ──────────

#[test]
fn test_full_lifecycle_refund_path() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 10_000i128;

    let c = setup(&env, goal, deadline, None);

    let contributors: Vec<Address> = (0..5).map(|_| Address::generate(&env)).collect();
    let amounts = [500i128, 800, 1_200, 600, 900]; // total = 4_000 < goal

    env.ledger().set_timestamp(500);
    for (addr, &amt) in contributors.iter().zip(amounts.iter()) {
        c.token_admin.mint(addr, &amt);
        c.client.contribute(addr, &amt, &c.token_id, &None);
    }

    assert_eq!(c.client.total_raised(), 4_000);

    // Advance past deadline — withdraw must fail (goal not met)
    env.ledger().set_timestamp(deadline + 1);
    assert!(c.client.try_withdraw().is_err());

    // Each contributor claims their refund
    let balances_before: Vec<i128> = contributors
        .iter()
        .map(|addr| c.token.balance(addr))
        .collect();

    for addr in &contributors {
        c.client.refund_single(addr);
    }

    // ── verify each contributor recovered their exact amount ──────────────────
    for (i, (addr, &amt)) in contributors.iter().zip(amounts.iter()).enumerate() {
        assert_eq!(c.token.balance(addr), balances_before[i] + amt);
        assert_eq!(c.client.contribution(addr), 0); // storage zeroed
    }

    // Contract holds nothing
    assert_eq!(c.token.balance(&c.contract_id), 0);
}

#[test]
fn test_pull_based_refund_model_multiple_contributors_goal_not_met() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 10_000i128;

    let c = setup(&env, goal, deadline, None);

    let contributors: Vec<Address> = (0..10).map(|_| Address::generate(&env)).collect();
    let amounts = [100i128, 200, 300, 400, 500, 600, 700, 800, 900, 1_000]; // total = 5_500 < goal

    env.ledger().set_timestamp(500);
    for (addr, &amt) in contributors.iter().zip(amounts.iter()) {
        c.token_admin.mint(addr, &amt);
        c.client.contribute(addr, &amt, &c.token_id, &None);
    }

    assert_eq!(c.client.total_raised(), 5_500);

    // Advance past deadline — withdraw must fail (goal not met)
    env.ledger().set_timestamp(deadline + 1);
    assert!(c.client.try_withdraw().is_err());

    // Each contributor claims their refund (and cannot claim twice)
    let balances_before: Vec<i128> = contributors
        .iter()
        .map(|addr| c.token.balance(addr))
        .collect();

    for (i, (addr, &amt)) in contributors.iter().zip(amounts.iter()).enumerate() {
        c.client.refund_single(addr);
        assert_eq!(c.token.balance(addr), balances_before[i] + amt);
        assert_eq!(c.client.contribution(addr), 0); // storage zeroed

        let after_first = c.token.balance(addr);
        c.client.refund_single(addr);
        assert_eq!(c.token.balance(addr), after_first); // no double payout
    }

    // total_raised is not modified by refunds in the pull-based model
    assert_eq!(c.client.total_raised(), 5_500);

    // Contract holds nothing
    assert_eq!(c.token.balance(&c.contract_id), 0);
}

// ── deadline boundary: contribute at deadline-1 ok, at deadline rejected ─────

#[test]
fn test_contribute_deadline_boundary() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 10_000i128;
    let c = setup(&env, goal, deadline, None);

    let contributor = Address::generate(&env);
    c.token_admin.mint(&contributor, &2_000);

    // One second before the deadline: accepted.
    env.ledger().set_timestamp(deadline - 1);
    c.client
        .contribute(&contributor, &1_000, &c.token_id, &None);
    assert_eq!(c.client.total_raised(), 1_000);

    // Exactly at the deadline: rejected.
    env.ledger().set_timestamp(deadline);
    assert!(c
        .client
        .try_contribute(&contributor, &1_000, &c.token_id, &None)
        .is_err());
    assert_eq!(c.client.total_raised(), 1_000);

    // After the deadline: rejected.
    env.ledger().set_timestamp(deadline + 1);
    assert!(c
        .client
        .try_contribute(&contributor, &1_000, &c.token_id, &None)
        .is_err());
    assert_eq!(c.client.total_raised(), 1_000);
}

// ── withdraw boundary: rejected before deadline, allowed after ───────────────

#[test]
fn test_withdraw_deadline_boundary() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 1_000i128;
    let c = setup(&env, goal, deadline, None);

    let contributor = Address::generate(&env);
    c.token_admin.mint(&contributor, &goal);
    env.ledger().set_timestamp(500);
    c.client.contribute(&contributor, &goal, &c.token_id, &None);

    // Before the deadline: withdraw rejected.
    env.ledger().set_timestamp(deadline - 1);
    assert!(c.client.try_withdraw().is_err());

    // Exactly at the deadline: still rejected (deadline must have passed).
    env.ledger().set_timestamp(deadline);
    assert!(c.client.try_withdraw().is_err());

    // One second past the deadline: allowed.
    env.ledger().set_timestamp(deadline + 1);
    c.client.withdraw();
    assert_eq!(c.token.balance(&c.creator), goal);
    assert_eq!(c.token.balance(&c.contract_id), 0);
}

// ── refund boundary: rejected before deadline, allowed after ─────────────────

#[test]
fn test_refund_deadline_boundary() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 10_000i128;
    let c = setup(&env, goal, deadline, None);

    let contributor = Address::generate(&env);
    let amount = 1_000i128;
    c.token_admin.mint(&contributor, &amount);
    env.ledger().set_timestamp(500);
    c.client
        .contribute(&contributor, &amount, &c.token_id, &None);

    // Before the deadline: refund rejected.
    env.ledger().set_timestamp(deadline - 1);
    assert!(c.client.try_refund_single(&contributor).is_err());
    assert_eq!(c.client.contribution(&contributor), amount);

    // Exactly at the deadline: still rejected.
    env.ledger().set_timestamp(deadline);
    assert!(c.client.try_refund_single(&contributor).is_err());
    assert_eq!(c.client.contribution(&contributor), amount);

    // One second past the deadline: allowed.
    env.ledger().set_timestamp(deadline + 1);
    c.client.refund_single(&contributor);
    assert_eq!(c.client.contribution(&contributor), 0);
    assert_eq!(c.token.balance(&contributor), amount);
    assert_eq!(c.token.balance(&c.contract_id), 0);
}

// ── refund edge case: zero contribution ──────────────────────────────────────

#[test]
fn test_refund_zero_contribution() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 10_000i128;
    let c = setup(&env, goal, deadline, None);

    let stranger = Address::generate(&env);
    env.ledger().set_timestamp(deadline + 1);

    // No contribution recorded: refund must not pay out.
    let before = c.token.balance(&stranger);
    let _ = c.client.try_refund_single(&stranger);
    assert_eq!(c.token.balance(&stranger), before);
    assert_eq!(c.client.contribution(&stranger), 0);
    assert_eq!(c.token.balance(&c.contract_id), 0);
}

// ── refund edge case: partial refunds leave remainder intact ─────────────────

#[test]
fn test_refund_partial_multiple_contributors() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 10_000i128;
    let c = setup(&env, goal, deadline, None);

    let a = Address::generate(&env);
    let b = Address::generate(&env);
    let c_addr = Address::generate(&env);
    let amounts = [1_000i128, 2_000, 3_000];

    env.ledger().set_timestamp(500);
    for (addr, &amt) in [&a, &b, &c_addr].iter().zip(amounts.iter()) {
        c.token_admin.mint(addr, &amt);
        c.client.contribute(addr, &amt, &c.token_id, &None);
    }
    assert_eq!(c.client.total_raised(), 6_000);

    env.ledger().set_timestamp(deadline + 1);

    // Refund only the first contributor; the others remain claimable.
    c.client.refund_single(&a);
    assert_eq!(c.client.contribution(&a), 0);
    assert_eq!(c.client.contribution(&b), 2_000);
    assert_eq!(c.client.contribution(&c_addr), 3_000);
    assert_eq!(c.token.balance(&c.contract_id), 5_000);

    // Refund the rest.
    c.client.refund_single(&b);
    c.client.refund_single(&c_addr);
    assert_eq!(c.token.balance(&c.contract_id), 0);
    assert_eq!(c.token.balance(&a), 1_000);
    assert_eq!(c.token.balance(&b), 2_000);
    assert_eq!(c.token.balance(&c_addr), 3_000);
}

// ── withdraw edge case: goal met exactly at deadline boundary ────────────────

#[test]
fn test_withdraw_exact_goal_after_deadline() {
    let env = Env::default();
    env.mock_all_auths();

    let deadline = 1_000u64;
    let goal = 3_000i128;
    let c = setup(&env, goal, deadline, None);

    let a = Address::generate(&env);
    let b = Address::generate(&env);

    env.ledger().set_timestamp(500);
    c.token_admin.mint(&a, &1_000);
    c.client.contribute(&a, &1_000, &c.token_id, &None);
    c.token_admin.mint(&b, &2_000);
    c.client.contribute(&b, &2_000, &c.token_id, &None);

    // Exactly at goal.
    assert_eq!(c.client.total_raised(), goal);

    env.ledger().set_timestamp(deadline + 1);
    c.client.withdraw();
    assert_eq!(c.token.balance(&c.creator), goal);
    assert_eq!(c.token.balance(&c.contract_id), 0);

    // Second withdraw must fail (nothing left / already withdrawn).
    assert!(c.client.try_withdraw().is_err());
}
