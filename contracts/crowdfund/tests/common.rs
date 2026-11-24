// Test harness still uses the deprecated `register_contract` /
// `register_stellar_asset_contract` helpers; migrating them is separate work.
#![allow(deprecated)]

use soroban_sdk::{testutils::Address as _, token, Address, Env, String, Vec};

use crowdfund::{
    Category, CrowdfundContract, CrowdfundContractClient, DataKey, PlatformConfig, Status,
    VersionMigration, Visibility, KEY_ADMIN, KEY_CATEGORY, KEY_CONTRACT_VERSION, KEY_CREATOR,
    KEY_DEADLINE, KEY_DESC, KEY_GOAL, KEY_MAX, KEY_MIN, KEY_START_TIME, KEY_STATUS, KEY_TITLE,
    KEY_TOKEN, KEY_TOTAL, KEY_VERSION_HISTORY, KEY_VISIBILITY, TTL_PERSISTENT_ENTRY,
};

// ── Re-export common::test_utils::setup_env ──────────────────────────────────
//
// `migration_harness.rs` and `storage_schema_test.rs` both import
// `common::test_utils::setup_env`.  Providing the re-export here means
// those files can keep using the same `use common::test_utils::setup_env`
// path while the actual implementation lives in the shared crate.
pub mod test_utils {
    pub use common::test_utils::setup_env;
}

// ── Campaign fixture ──────────────────────────────────────────────────────────

#[allow(dead_code)] // fixture fields are used selectively across test files
pub struct Campaign<'a> {
    pub client: CrowdfundContractClient<'a>,
    pub token: token::Client<'a>,
    pub token_admin: token::StellarAssetClient<'a>,
    pub token_id: Address,
    pub contract_id: Address,
    pub creator: Address,
}

/// Deploy and fully initialize a campaign with sensible defaults.
///
/// Called by every file that previously copy-pasted its own `setup_campaign`
/// helper (issue #1565).
pub fn setup(
    env: &Env,
    goal: i128,
    deadline: u64,
    platform_config: Option<PlatformConfig>,
) -> Campaign<'_> {
    let creator = Address::generate(env);
    let token_admin_addr = Address::generate(env);
    let token_id = env.register_stellar_asset_contract(token_admin_addr);
    let contract_id = env.register_contract(None, CrowdfundContract);

    let client = CrowdfundContractClient::new(env, &contract_id);
    let token = token::Client::new(env, &token_id);
    let token_admin = token::StellarAssetClient::new(env, &token_id);

    client.initialize(
        &creator,
        &token_id,
        &goal,
        &deadline,
        &100,
        &0i128,
        &String::from_str(env, "Test Campaign"),
        &String::from_str(env, "Integration test"),
        &None,
        &platform_config,
        &None,
        &Category::Other,
        &None,
        &None,
    );

    Campaign {
        client,
        token,
        token_admin,
        token_id,
        contract_id,
        creator,
    }
}

/// Shared fixture for the upgrade-path tests (issue #1490).
///
/// Builds a campaign at the current schema version so every upgrade step test
/// starts from the same setup instead of re-implementing it.
#[allow(dead_code)] // used by upgrade_step_harness.rs and upgrade_tests.rs
pub fn setup_upgrade_campaign(env: &Env) -> Campaign<'_> {
    setup(env, 10_000, 1_000_000, None)
}

/// Mint `amount` tokens to a fresh address and contribute them to the campaign.
///
/// Returns the contributor address so callers can make assertions about balances.
#[allow(dead_code)] // used by refund_withdraw_coverage.rs and other test files
pub fn fund(env: &Env, c: &Campaign<'_>, amount: i128) -> Address {
    let contributor = Address::generate(env);
    c.token_admin.mint(&contributor, &amount);
    c.client
        .contribute(&contributor, &amount, &c.token_id, &None);
    contributor
}

// ── Migration seeding harness ─────────────────────────────────────────────────

/// Result returned by [`seed_old_schema`]: the addresses needed to exercise
/// the migration harness.
#[allow(dead_code)]
pub struct SeedResult {
    /// The registered crowdfund contract address.
    pub contract_id: Address,
    /// The campaign creator address.
    pub creator: Address,
    /// The token contract address.
    pub token_id: Address,
    /// A single contributor whose data was written at schema v5.
    pub contributor: Address,
}

/// Seeds a crowdfund contract instance with storage that matches the v5
/// on-disk schema, then returns a [`SeedResult`] so callers can exercise the
/// `migrate_version` path without having to replicate the seeding logic.
///
/// Storage keys are written directly (bypassing `initialize`) so the test
/// proves that the migration path is robust even when encountering a real
/// older-binary layout.
#[allow(dead_code)]
pub fn seed_old_schema(env: &Env) -> SeedResult {
    let creator = Address::generate(env);
    let token_admin_addr = Address::generate(env);
    let token_id = env.register_stellar_asset_contract(token_admin_addr);
    let contributor = Address::generate(env);

    let contract_id = env.register_contract(None, CrowdfundContract);

    env.as_contract(&contract_id, || {
        let inst = env.storage().instance();

        inst.set(&KEY_CONTRACT_VERSION, &5u32);
        inst.set(&KEY_CREATOR, &creator);
        inst.set(&KEY_ADMIN, &creator);
        inst.set(&KEY_TOKEN, &token_id);
        inst.set(&KEY_GOAL, &10_000i128);
        inst.set(&KEY_DEADLINE, &1_000_000u64);
        inst.set(&KEY_TOTAL, &2_500i128);
        inst.set(&KEY_MIN, &100i128);
        inst.set(&KEY_MAX, &0i128);
        inst.set(&KEY_STATUS, &Status::Active);
        inst.set(&KEY_CATEGORY, &Category::Technology);
        inst.set(&KEY_VISIBILITY, &Visibility::Public);
        inst.set(&KEY_TITLE, &String::from_str(env, "Old Campaign"));
        inst.set(&KEY_DESC, &String::from_str(env, "Seeded at schema v5"));
        inst.set(&KEY_START_TIME, &100u64);
        inst.set(&DataKey::ContributorCount, &1u32);
        inst.set(&DataKey::LargestContribution, &2_500i128);

        // Contributor persistent keys — Contribution amount is what
        // `is_contributor` and `contribution()` read.
        env.storage()
            .persistent()
            .set(&DataKey::Contribution(contributor.clone()), &2_500i128);
        env.storage().persistent().extend_ttl(
            &DataKey::Contribution(contributor.clone()),
            TTL_PERSISTENT_ENTRY,
            TTL_PERSISTENT_ENTRY,
        );

        // Version history: one record showing the 4 → 5 migration.
        let mut history: Vec<VersionMigration> = Vec::new(env);
        history.push_back(VersionMigration {
            from_version: 4,
            to_version: 5,
            timestamp: 100,
        });
        env.storage()
            .persistent()
            .set(&KEY_VERSION_HISTORY, &history);
        env.storage().persistent().extend_ttl(
            &KEY_VERSION_HISTORY,
            TTL_PERSISTENT_ENTRY,
            TTL_PERSISTENT_ENTRY,
        );
    });

    SeedResult {
        contract_id,
        creator,
        token_id,
        contributor,
    }
}
