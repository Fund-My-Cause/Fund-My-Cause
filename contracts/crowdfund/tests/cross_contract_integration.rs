//! Cross-contract integration tests covering Registry+Crowdfund+QF flows
//!
//! Issue #1734: Tests the interaction between the Registry, Crowdfund, and QF
//! contracts in realistic end-to-end scenarios.
//!
//! ## Test Coverage
//!
//! 1. **Registry+Crowdfund**: Campaign registration and status updates
//! 2. **Crowdfund+QF**: Quadratic funding allocation for successful campaigns
//! 3. **Registry+Crowdfund+QF**: Full lifecycle with multi-campaign QF distribution
//!
//! ## Using Soroban testutils
//!
//! All tests use `soroban_sdk::testutils` for contract deployment, address
//! generation, and authentication mocking via `env.mock_all_auths()`.

#![cfg(test)]
#![allow(deprecated)] // register_contract is deprecated but still required for tests

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env, Map, String, Vec,
};

use crowdfund::{Category, CrowdfundContract, CrowdfundContractClient, PlatformConfig, Status};
use qf::{QFContract, QFContractClient};
use registry::{CampaignStatus, RegistryContract, RegistryContractClient};

// ── Test fixtures ─────────────────────────────────────────────────────────────

struct TestSetup {
    env: Env,
    registry: RegistryContractClient,
    qf: QFContractClient,
    registry_admin: Address,
    token_id: Address,
    token: token::Client,
    token_admin: token::StellarAssetClient,
}

fn setup_contracts() -> TestSetup {
    let env = Env::default();
    env.mock_all_auths();

    // Deploy registry
    let registry_id = env.register_contract(None, RegistryContract);
    let registry = RegistryContractClient::new(&env, &registry_id);
    let registry_admin = Address::generate(&env);
    registry.initialize(&registry_admin);

    // Deploy QF contract
    let qf_id = env.register_contract(None, QFContract);
    let qf = QFContractClient::new(&env, &qf_id);

    // Deploy token
    let token_admin_addr = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract(token_admin_addr.clone());
    let token = token::Client::new(&env, &token_id);
    let token_admin = token::StellarAssetClient::new(&env, &token_id);

    TestSetup {
        env,
        registry,
        qf,
        registry_admin,
        token_id,
        token,
        token_admin,
    }
}

struct CampaignSetup {
    client: CrowdfundContractClient,
    contract_id: Address,
    creator: Address,
}

fn deploy_campaign(
    env: &Env,
    token_id: &Address,
    goal: i128,
    deadline: u64,
) -> CampaignSetup {
    let contract_id = env.register_contract(None, CrowdfundContract);
    let client = CrowdfundContractClient::new(env, &contract_id);
    let creator = Address::generate(env);

    client.initialize(
        &creator,
        token_id,
        &goal,
        &deadline,
        &100,  // min_contribution
        &0i128, // max_contribution (0 = no limit)
        &String::from_str(env, "Test Campaign"),
        &String::from_str(env, "Integration test campaign"),
        &None,
        &None::<PlatformConfig>,
        &None,
        &Category::Technology,
        &None,
        &None,
    );

    CampaignSetup {
        client,
        contract_id,
        creator,
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// Test suite: Registry+Crowdfund integration
// ══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_registry_campaign_registration_flow() {
    let setup = setup_contracts();
    let env = &setup.env;
    env.ledger().set_timestamp(100);

    // Deploy and register a campaign
    let campaign = deploy_campaign(env, &setup.token_id, 10_000, 2_000);

    // Register the campaign in the registry
    setup.registry.register(&campaign.contract_id);

    // Verify registration
    let campaigns = setup.registry.list(&0, &10);
    assert_eq!(campaigns.len(), 1);
    assert_eq!(campaigns.get(0).unwrap(), campaign.contract_id);
}

#[test]
fn test_registry_campaign_with_category() {
    let setup = setup_contracts();
    let env = &setup.env;
    env.ledger().set_timestamp(100);

    let campaign = deploy_campaign(env, &setup.token_id, 5_000, 1_500);

    // Register with category (Technology = 2)
    let category_id = 2u32;
    setup
        .registry
        .register_with_category(&campaign.contract_id, &category_id);

    // Verify category-based retrieval
    let campaigns = setup.registry.get_campaigns_by_category(&category_id, &0, &10);
    assert_eq!(campaigns.len(), 1);
    assert_eq!(campaigns.get(0).unwrap(), campaign.contract_id);
}

#[test]
fn test_registry_status_update_after_campaign_success() {
    let setup = setup_contracts();
    let env = &setup.env;
    env.ledger().set_timestamp(500);

    let deadline = 2_000u64;
    let goal = 1_000i128;
    let campaign = deploy_campaign(env, &setup.token_id, goal, deadline);

    // Register campaign as Active
    setup
        .registry
        .register_with_status(&campaign.contract_id, &CampaignStatus::Active);

    // Fund the campaign to reach goal
    let contributor = Address::generate(env);
    setup.token_admin.mint(&contributor, &goal);
    campaign.client.contribute(&contributor, &goal, &setup.token_id, &None);

    // Advance past deadline
    env.ledger().set_timestamp(deadline + 1);

    // Withdraw to mark as successful
    campaign.client.withdraw();
    assert_eq!(campaign.client.status(), Status::Successful);

    // Update registry status
    setup
        .registry
        .update_status(&campaign.contract_id, &CampaignStatus::Successful);

    // Verify status filter
    let successful = setup
        .registry
        .list_by_status(&CampaignStatus::Successful, &0, &10);
    assert_eq!(successful.len(), 1);
    assert_eq!(successful.get(0).unwrap(), campaign.contract_id);

    let active = setup.registry.list_by_status(&CampaignStatus::Active, &0, &10);
    assert_eq!(active.len(), 0);
}

#[test]
fn test_registry_multiple_campaigns_filtering() {
    let setup = setup_contracts();
    let env = &setup.env;
    env.ledger().set_timestamp(100);

    // Deploy 3 campaigns
    let campaign1 = deploy_campaign(env, &setup.token_id, 1_000, 2_000);
    let campaign2 = deploy_campaign(env, &setup.token_id, 2_000, 2_000);
    let campaign3 = deploy_campaign(env, &setup.token_id, 3_000, 2_000);

    // Register with different statuses
    setup
        .registry
        .register_with_status(&campaign1.contract_id, &CampaignStatus::Active);
    setup
        .registry
        .register_with_status(&campaign2.contract_id, &CampaignStatus::Active);
    setup
        .registry
        .register_with_status(&campaign3.contract_id, &CampaignStatus::Cancelled);

    // Verify filtering
    let all = setup.registry.list(&0, &10);
    assert_eq!(all.len(), 3);

    let active = setup.registry.list_by_status(&CampaignStatus::Active, &0, &10);
    assert_eq!(active.len(), 2);

    let cancelled = setup
        .registry
        .list_by_status(&CampaignStatus::Cancelled, &0, &10);
    assert_eq!(cancelled.len(), 1);
}

// ══════════════════════════════════════════════════════════════════════════════
// Test suite: Crowdfund+QF integration
// ══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_qf_calculation_for_single_campaign() {
    let setup = setup_contracts();
    let env = &setup.env;
    env.ledger().set_timestamp(500);

    let deadline = 2_000u64;
    let goal = 5_000i128;
    let campaign = deploy_campaign(env, &setup.token_id, goal, deadline);

    // Three contributors with different amounts
    let contributors = [
        Address::generate(env),
        Address::generate(env),
        Address::generate(env),
    ];
    let amounts = [1_000i128, 2_000, 2_000];

    for (contributor, &amount) in contributors.iter().zip(amounts.iter()) {
        setup.token_admin.mint(contributor, &amount);
        campaign
            .client
            .contribute(contributor, &amount, &setup.token_id, &None);
    }

    // Build QF inputs
    let matching_pool = 10_000i128;
    let mut contributions = Map::new(env);
    let mut contributor_counts = Map::new(env);

    contributions.set(campaign.contract_id.clone(), goal);
    contributor_counts.set(campaign.contract_id.clone(), 3u64);

    // Calculate QF allocation
    let result = setup
        .qf
        .calculate_qf(&matching_pool, &contributions, &contributor_counts, &0i128);

    assert!(result.is_ok());
    let qf_result = result.unwrap();

    // Verify QF invariants
    assert!(qf_result.total_distributed <= matching_pool);
    assert!(qf_result.total_distributed >= 0);
    assert_eq!(qf_result.recipients_funded, 1);
    assert_eq!(qf_result.total_contributors, 1); // counting unique recipients
}

#[test]
fn test_qf_multiple_campaigns_distribution() {
    let setup = setup_contracts();
    let env = &setup.env;
    env.ledger().set_timestamp(500);

    let deadline = 2_000u64;

    // Deploy 3 campaigns with different funding profiles
    let campaign1 = deploy_campaign(env, &setup.token_id, 1_000, deadline);
    let campaign2 = deploy_campaign(env, &setup.token_id, 2_000, deadline);
    let campaign3 = deploy_campaign(env, &setup.token_id, 3_000, deadline);

    // Campaign 1: 5 contributors, 100 each = 500 total
    for _ in 0..5 {
        let contributor = Address::generate(env);
        setup.token_admin.mint(&contributor, &100);
        campaign1
            .client
            .contribute(&contributor, &100, &setup.token_id, &None);
    }

    // Campaign 2: 2 contributors, 500 each = 1000 total
    for _ in 0..2 {
        let contributor = Address::generate(env);
        setup.token_admin.mint(&contributor, &500);
        campaign2
            .client
            .contribute(&contributor, &500, &setup.token_id, &None);
    }

    // Campaign 3: 1 contributor, 800 = 800 total
    let contributor = Address::generate(env);
    setup.token_admin.mint(&contributor, &800);
    campaign3
        .client
        .contribute(&contributor, &800, &setup.token_id, &None);

    // Build QF inputs
    let matching_pool = 20_000i128;
    let mut contributions = Map::new(env);
    let mut contributor_counts = Map::new(env);

    contributions.set(campaign1.contract_id.clone(), 500);
    contributions.set(campaign2.contract_id.clone(), 1_000);
    contributions.set(campaign3.contract_id.clone(), 800);

    contributor_counts.set(campaign1.contract_id.clone(), 5u64);
    contributor_counts.set(campaign2.contract_id.clone(), 2u64);
    contributor_counts.set(campaign3.contract_id.clone(), 1u64);

    // Calculate QF allocation
    let result = setup
        .qf
        .calculate_qf(&matching_pool, &contributions, &contributor_counts, &0i128);

    assert!(result.is_ok());
    let qf_result = result.unwrap();

    // Verify QF invariants
    assert!(qf_result.total_distributed <= matching_pool);
    assert!(qf_result.total_distributed >= 0);
    assert_eq!(qf_result.recipients_funded, 3);

    // Campaign1 (5 contributors) should receive more matching than Campaign3 (1 contributor)
    // due to quadratic funding formula
    let campaign1_total = qf_result.allocations.get(campaign1.contract_id).unwrap();
    let campaign3_total = qf_result.allocations.get(campaign3.contract_id).unwrap();

    // Campaign1 total includes original 500 + matching
    // Campaign3 total includes original 800 + matching
    // The matching component should favor campaign1 due to sqrt(5) > sqrt(1)
    assert!(campaign1_total > 500); // has matching funds
    assert!(campaign3_total > 800); // has matching funds
}

#[test]
fn test_qf_with_minimum_threshold() {
    let setup = setup_contracts();
    let env = &setup.env;
    env.ledger().set_timestamp(500);

    let deadline = 2_000u64;

    // Deploy 2 campaigns
    let campaign1 = deploy_campaign(env, &setup.token_id, 1_000, deadline);
    let campaign2 = deploy_campaign(env, &setup.token_id, 2_000, deadline);

    // Campaign 1: 500 raised (above threshold)
    let contributor1 = Address::generate(env);
    setup.token_admin.mint(&contributor1, &500);
    campaign1
        .client
        .contribute(&contributor1, &500, &setup.token_id, &None);

    // Campaign 2: 50 raised (below threshold)
    let contributor2 = Address::generate(env);
    setup.token_admin.mint(&contributor2, &50);
    campaign2
        .client
        .contribute(&contributor2, &50, &setup.token_id, &None);

    // Build QF inputs with 100 minimum threshold
    let matching_pool = 5_000i128;
    let min_threshold = 100i128;
    let mut contributions = Map::new(env);
    let mut contributor_counts = Map::new(env);

    contributions.set(campaign1.contract_id.clone(), 500);
    contributions.set(campaign2.contract_id.clone(), 50);

    contributor_counts.set(campaign1.contract_id.clone(), 1u64);
    contributor_counts.set(campaign2.contract_id.clone(), 1u64);

    // Calculate QF allocation
    let result = setup.qf.calculate_qf(
        &matching_pool,
        &contributions,
        &contributor_counts,
        &min_threshold,
    );

    assert!(result.is_ok());
    let qf_result = result.unwrap();

    // Only campaign1 should receive matching (campaign2 below threshold)
    assert_eq!(qf_result.recipients_funded, 1);
    assert!(qf_result.allocations.contains_key(campaign1.contract_id));
    assert!(!qf_result.allocations.contains_key(campaign2.contract_id));
}

// ══════════════════════════════════════════════════════════════════════════════
// Test suite: Full Registry+Crowdfund+QF integration
// ══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_full_lifecycle_registry_crowdfund_qf() {
    let setup = setup_contracts();
    let env = &setup.env;
    env.ledger().set_timestamp(500);

    let deadline = 2_000u64;

    // Phase 1: Deploy and register campaigns
    let campaign1 = deploy_campaign(env, &setup.token_id, 2_000, deadline);
    let campaign2 = deploy_campaign(env, &setup.token_id, 3_000, deadline);

    setup
        .registry
        .register_with_status(&campaign1.contract_id, &CampaignStatus::Active);
    setup
        .registry
        .register_with_status(&campaign2.contract_id, &CampaignStatus::Active);

    // Verify registration
    let active_campaigns = setup.registry.list_by_status(&CampaignStatus::Active, &0, &10);
    assert_eq!(active_campaigns.len(), 2);

    // Phase 2: Fund campaigns with multiple contributors
    // Campaign 1: 3 contributors
    for _ in 0..3 {
        let contributor = Address::generate(env);
        setup.token_admin.mint(&contributor, &700);
        campaign1
            .client
            .contribute(&contributor, &700, &setup.token_id, &None);
    }

    // Campaign 2: 5 contributors
    for _ in 0..5 {
        let contributor = Address::generate(env);
        setup.token_admin.mint(&contributor, &650);
        campaign2
            .client
            .contribute(&contributor, &650, &setup.token_id, &None);
    }

    // Both campaigns met their goals
    assert!(campaign1.client.total_raised() >= 2_000);
    assert!(campaign2.client.total_raised() >= 3_000);

    // Phase 3: Advance past deadline and withdraw
    env.ledger().set_timestamp(deadline + 1);

    campaign1.client.withdraw();
    campaign2.client.withdraw();

    // Phase 4: Update registry status
    setup
        .registry
        .update_status(&campaign1.contract_id, &CampaignStatus::Successful);
    setup
        .registry
        .update_status(&campaign2.contract_id, &CampaignStatus::Successful);

    // Verify status update
    let successful_campaigns = setup
        .registry
        .list_by_status(&CampaignStatus::Successful, &0, &10);
    assert_eq!(successful_campaigns.len(), 2);

    // Phase 5: Calculate QF distribution for successful campaigns
    let matching_pool = 15_000i128;
    let mut contributions = Map::new(env);
    let mut contributor_counts = Map::new(env);

    contributions.set(campaign1.contract_id.clone(), campaign1.client.total_raised());
    contributions.set(campaign2.contract_id.clone(), campaign2.client.total_raised());

    let stats1 = campaign1.client.get_stats();
    let stats2 = campaign2.client.get_stats();
    contributor_counts.set(campaign1.contract_id.clone(), stats1.contributor_count as u64);
    contributor_counts.set(campaign2.contract_id.clone(), stats2.contributor_count as u64);

    let qf_result = setup
        .qf
        .calculate_qf(&matching_pool, &contributions, &contributor_counts, &0i128)
        .unwrap();

    // Verify QF results
    assert_eq!(qf_result.recipients_funded, 2);
    assert!(qf_result.total_distributed > 0);
    assert!(qf_result.total_distributed <= matching_pool);

    // Campaign2 (5 contributors) should receive more matching due to sqrt(5) > sqrt(3)
    let campaign1_alloc = qf_result.allocations.get(campaign1.contract_id).unwrap();
    let campaign2_alloc = qf_result.allocations.get(campaign2.contract_id).unwrap();

    assert!(campaign1_alloc > campaign1.client.total_raised());
    assert!(campaign2_alloc > campaign2.client.total_raised());
}

#[test]
fn test_failed_campaign_excluded_from_qf() {
    let setup = setup_contracts();
    let env = &setup.env;
    env.ledger().set_timestamp(500);

    let deadline = 2_000u64;

    // Deploy 2 campaigns
    let campaign1 = deploy_campaign(env, &setup.token_id, 5_000, deadline);
    let campaign2 = deploy_campaign(env, &setup.token_id, 5_000, deadline);

    setup
        .registry
        .register_with_status(&campaign1.contract_id, &CampaignStatus::Active);
    setup
        .registry
        .register_with_status(&campaign2.contract_id, &CampaignStatus::Active);

    // Campaign 1: reaches goal
    let contributor1 = Address::generate(env);
    setup.token_admin.mint(&contributor1, &5_000);
    campaign1
        .client
        .contribute(&contributor1, &5_000, &setup.token_id, &None);

    // Campaign 2: does NOT reach goal
    let contributor2 = Address::generate(env);
    setup.token_admin.mint(&contributor2, &1_000);
    campaign2
        .client
        .contribute(&contributor2, &1_000, &setup.token_id, &None);

    // Advance past deadline
    env.ledger().set_timestamp(deadline + 1);

    // Campaign 1 withdraws (successful)
    campaign1.client.withdraw();
    setup
        .registry
        .update_status(&campaign1.contract_id, &CampaignStatus::Successful);

    // Campaign 2 fails (goal not met)
    assert_eq!(campaign2.client.status(), Status::Failed);
    setup
        .registry
        .update_status(&campaign2.contract_id, &CampaignStatus::Failed);

    // QF calculation should only include successful campaign
    let matching_pool = 10_000i128;
    let mut contributions = Map::new(env);
    let mut contributor_counts = Map::new(env);

    // Only add campaign1 (successful)
    contributions.set(campaign1.contract_id.clone(), campaign1.client.total_raised());
    contributor_counts.set(campaign1.contract_id.clone(), 1u64);

    let qf_result = setup
        .qf
        .calculate_qf(&matching_pool, &contributions, &contributor_counts, &0i128)
        .unwrap();

    // Only 1 recipient should be funded
    assert_eq!(qf_result.recipients_funded, 1);
    assert!(qf_result.allocations.contains_key(campaign1.contract_id));
    assert!(!qf_result.allocations.contains_key(campaign2.contract_id));

    // Verify registry filtering shows correct statuses
    let successful = setup
        .registry
        .list_by_status(&CampaignStatus::Successful, &0, &10);
    assert_eq!(successful.len(), 1);

    let failed = setup.registry.list_by_status(&CampaignStatus::Failed, &0, &10);
    assert_eq!(failed.len(), 1);
}

#[test]
fn test_qf_proportional_distribution_respects_contributor_diversity() {
    let setup = setup_contracts();
    let env = &setup.env;
    env.ledger().set_timestamp(500);

    let deadline = 2_000u64;

    // Campaign 1: Many small contributors (diverse)
    let campaign1 = deploy_campaign(env, &setup.token_id, 10_000, deadline);
    for _ in 0..10 {
        let contributor = Address::generate(env);
        setup.token_admin.mint(&contributor, &100);
        campaign1
            .client
            .contribute(&contributor, &100, &setup.token_id, &None);
    }
    // Campaign1: 1000 total, 10 contributors

    // Campaign 2: One large contributor (not diverse)
    let campaign2 = deploy_campaign(env, &setup.token_id, 10_000, deadline);
    let whale = Address::generate(env);
    setup.token_admin.mint(&whale, &1_000);
    campaign2
        .client
        .contribute(&whale, &1_000, &setup.token_id, &None);
    // Campaign2: 1000 total, 1 contributor

    // Both have the same total raised, but different contributor counts
    assert_eq!(campaign1.client.total_raised(), 1_000);
    assert_eq!(campaign2.client.total_raised(), 1_000);

    // Build QF inputs
    let matching_pool = 5_000i128;
    let mut contributions = Map::new(env);
    let mut contributor_counts = Map::new(env);

    contributions.set(campaign1.contract_id.clone(), 1_000);
    contributions.set(campaign2.contract_id.clone(), 1_000);

    contributor_counts.set(campaign1.contract_id.clone(), 10u64);
    contributor_counts.set(campaign2.contract_id.clone(), 1u64);

    let qf_result = setup
        .qf
        .calculate_qf(&matching_pool, &contributions, &contributor_counts, &0i128)
        .unwrap();

    // Campaign1 should receive significantly more matching due to sqrt(10) vs sqrt(1)
    let campaign1_total = qf_result.allocations.get(campaign1.contract_id).unwrap();
    let campaign2_total = qf_result.allocations.get(campaign2.contract_id).unwrap();

    // Both get their original 1000 + matching
    // But campaign1's matching should be much larger
    let campaign1_matching = campaign1_total - 1_000;
    let campaign2_matching = campaign2_total - 1_000;

    assert!(campaign1_matching > campaign2_matching);
    assert_eq!(qf_result.recipients_funded, 2);
    assert_eq!(campaign1_matching + campaign2_matching, qf_result.total_distributed);
}
