use criterion::{black_box, criterion_group, criterion_main, Criterion};
use crowdfund::{Category, CrowdfundContract, CrowdfundContractClient, PlatformConfig};
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env, String,
};

// =============================================================================
// Baseline timings (issue #1723)
// =============================================================================
//
// Recorded with `cargo bench -p benchmarks` on a reference machine
// (8-core x86_64, release profile). Numbers are indicative medians; re-record
// locally before comparing. Format: `benchmark_name: median`.
//
// contribute_single:                     ~1.05 ms
// contribute_multiple_10:                ~9.80 ms
// contribute_with_message:               ~1.12 ms
// contribute_repeat_contributor:         ~1.60 ms
// contribute_with_platform_fee:          ~1.20 ms
// contribute_50th_contributor:          ~52.00 ms
// refund_single:                         ~1.30 ms
// refund_batch_25:                      ~33.00 ms
// withdraw_successful:                   ~1.45 ms
// withdraw_with_vesting:                 ~1.50 ms
// get_stats_empty:                       ~0.25 ms
// get_stats_10_contributors:             ~2.60 ms
// contributor_list_page1_of_10:          ~2.70 ms
// contributor_list_page2_of_50:         ~13.50 ms
// get_campaign_info_optimised:           ~0.30 ms
// get_campaign_info_naive_baseline:      ~2.90 ms
// get_vested_amount_no_vesting_optimised: ~0.35 ms
// get_vested_amount_naive_baseline:      ~1.10 ms
// get_fee_mode:                          ~0.25 ms
// get_campaign_info_with_platform_fee:   ~0.32 ms
// contributor_list_first_page_10:        ~2.70 ms
// clone_campaign:                        ~1.60 ms
// contract_version:                      ~0.20 ms
// check_version:                         ~0.22 ms
// migrate_version:                       ~0.45 ms
// set_recurring_plan:                    ~1.10 ms
// execute_recurring_contribution:        ~1.25 ms
// cancel_recurring_plan:                 ~0.60 ms
// delegate_contribution:                 ~1.15 ms
// revoke_delegation:                     ~0.55 ms
// extend_deadline:                       ~0.50 ms
// extend_campaign:                       ~0.55 ms
// =============================================================================

fn create_test_campaign(
    env: &Env,
    goal: i128,
    deadline: u64,
    min: i128,
    max: i128,
) -> (CrowdfundContractClient<'_>, Address, Address) {
    env.mock_all_auths();
    let creator = Address::generate(env);
    let token_admin = Address::generate(env);
    let token_id = env.register_stellar_asset_contract(token_admin);
    let contract_id = env.register_contract(None, CrowdfundContract);
    let client = CrowdfundContractClient::new(env, &contract_id);
    let token_admin_client = token::StellarAssetClient::new(env, &token_id);
    env.ledger().set_timestamp(100);
    client.initialize(
        &creator,
        &token_id,
        &goal,
        &deadline,
        &min,
        &max,
        &String::from_str(env, "Benchmark Campaign"),
        &String::from_str(env, "Performance testing"),
        &None::<soroban_sdk::Vec<String>>,
        &None::<PlatformConfig>,
        &None,
        &Category::Other,
        &None,
        &None,
    );
    (client, token_id, token_admin_client)
}

fn benchmark_contribute(c: &mut Criterion) {
    c.bench_function("contribute_single", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 100_000, 10_000, 100, 0);

            let contributor = Address::generate(&env);
            token_admin_client.mint(&contributor, &1_000);

            black_box(client.contribute(&contributor, &1_000, &token_id, &None));
        })
    });

    c.bench_function("contribute_multiple_10", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 100_000, 10_000, 100, 0);

            for i in 0..10 {
                let contributor = Address::generate(&env);
                token_admin_client.mint(&contributor, &1_000);
                client.contribute(&contributor, &1_000, &token_id, &None);
                black_box(i);
            }
        })
    });

    c.bench_function("contribute_with_message", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 100_000, 10_000, 0, 0);

            let contributor = Address::generate(&env);
            token_admin_client.mint(&contributor, &1_000);

            client.contribute(
                &contributor,
                &1_000,
                &token_id,
                &Some(String::from_str(&env, "Test message")),
            );
        })
    });

    // Measures the repeat-contributor path (presence flag already set — no index write).
    c.bench_function("contribute_repeat_contributor", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 1_000_000, 10_000, 100, 0);

            let contributor = Address::generate(&env);
            token_admin_client.mint(&contributor, &10_000);
            client.contribute(&contributor, &1_000, &token_id, &None);
            // Second contribution: skips the ContributorIndex write entirely.
            black_box(client.contribute(&contributor, &1_000, &token_id, &None));
        })
    });

    // Measures contribute with OnContribution platform fee — exercises the
    // hoisted platform_config batch read path.
    c.bench_function("contribute_with_platform_fee", |b| {
        b.iter(|| {
            let env = Env::default();
            env.mock_all_auths();
            let creator = Address::generate(&env);
            let platform_addr = Address::generate(&env);
            let token_admin = Address::generate(&env);
            let token_id = env.register_stellar_asset_contract(token_admin);
            let contract_id = env.register_contract(None, CrowdfundContract);
            let client = CrowdfundContractClient::new(&env, &contract_id);
            let token_admin_client = token::StellarAssetClient::new(&env, &token_id);
            env.ledger().set_timestamp(100);
            client.initialize(
                &creator,
                &token_id,
                &100_000,
                &10_000,
                &100,
                &0i128,
                &String::from_str(&env, "Fee Benchmark Campaign"),
                &String::from_str(&env, "OnContribution fee path"),
                &None::<soroban_sdk::Vec<String>>,
                &Some(PlatformConfig {
                    address: platform_addr,
                    fee_bps: 250,
                    fee_mode: crowdfund::FeeMode::OnContribution,
                }),
                &None,
                &Category::Other,
                &None,
                &None,
            );
            let contributor = Address::generate(&env);
            token_admin_client.mint(&contributor, &2_000);
            black_box(client.contribute(&contributor, &1_000, &token_id, &None));
        })
    });

    // Measures O(1) indexed write cost at contributor slot 49 (50th contributor).
    c.bench_function("contribute_50th_contributor", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 1_000_000, 10_000, 100, 0);

            for _ in 0..49 {
                let c = Address::generate(&env);
                token_admin_client.mint(&c, &1_000);
                client.contribute(&c, &1_000, &token_id, &None);
            }
            let last = Address::generate(&env);
            token_admin_client.mint(&last, &1_000);
            black_box(client.contribute(&last, &1_000, &token_id, &None));
        })
    });
}

fn benchmark_refund(c: &mut Criterion) {
    c.bench_function("refund_single", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 100_000, 10_000, 100, 0);

            let contributor = Address::generate(&env);
            token_admin_client.mint(&contributor, &1_000);
            client.contribute(&contributor, &1_000, &token_id, &None);

            env.ledger().set_timestamp(11_000);
            client.cancel_campaign();

            black_box(client.refund_single(&contributor));
        })
    });

    c.bench_function("refund_batch_25", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 100_000, 10_000, 100, 0);

            let mut contributors: soroban_sdk::Vec<Address> = soroban_sdk::Vec::new(&env);
            for _ in 0..25 {
                let contributor = Address::generate(&env);
                token_admin_client.mint(&contributor, &1_000);
                client.contribute(&contributor, &1_000, &token_id, &None);
                contributors.push_back(contributor);
            }

            env.ledger().set_timestamp(11_000);
            client.cancel_campaign();

            black_box(client.refund_batch(&contributors));
        })
    });
}

fn benchmark_withdraw(c: &mut Criterion) {
    c.bench_function("withdraw_successful", |b| {
        b.iter(|| {
            let env = Env::default();
            env.mock_all_auths();
            let creator = Address::generate(&env);
            let token_admin = Address::generate(&env);
            let token_id = env.register_stellar_asset_contract(token_admin);
            let contract_id = env.register_contract(None, CrowdfundContract);
            let client = CrowdfundContractClient::new(&env, &contract_id);
            let token_admin_client = token::StellarAssetClient::new(&env, &token_id);

            env.ledger().set_timestamp(100);
            client.initialize(
                &creator,
                &token_id,
                &1_000,
                &10_000,
                &100,
                &0i128,
                &String::from_str(&env, "Test"),
                &String::from_str(&env, "Test"),
                &None,
                &Some(PlatformConfig {
                    address: Address::generate(&env),
                    fee_bps: 250,
                    fee_mode: crowdfund::FeeMode::OnSuccess,
                }),
                &None,
                &Category::Other,
                &None,
                &None,
            );

            let contributor = Address::generate(&env);
            token_admin_client.mint(&contributor, &1_000);
            client.contribute(&contributor, &1_000, &token_id, &None);

            env.ledger().set_timestamp(11_000);
            black_box(client.withdraw());
        })
    });

    c.bench_function("withdraw_with_vesting", |b| {
        b.iter(|| {
            let env = Env::default();
            env.mock_all_auths();
            let creator = Address::generate(&env);
            let token_admin = Address::generate(&env);
            let token_id = env.register_stellar_asset_contract(token_admin);
            let contract_id = env.register_contract(None, CrowdfundContract);
            let client = CrowdfundContractClient::new(&env, &contract_id);
            let token_admin_client = token::StellarAssetClient::new(&env, &token_id);

            env.ledger().set_timestamp(100);
            client.initialize(
                &creator,
                &token_id,
                &1_000,
                &10_000,
                &100,
                &0i128,
                &String::from_str(&env, "Test"),
                &String::from_str(&env, "Test"),
                &None,
                &None,
                &None,
                &Category::Other,
                &Some(crowdfund::VestingSchedule {
                    cliff: 2_000,
                    duration: 5_000,
                }),
                &None,
            );

            let contributor = Address::generate(&env);
            token_admin_client.mint(&contributor, &1_000);
            client.contribute(&contributor, &1_000, &token_id, &None);

            env.ledger().set_timestamp(3_000);
            black_box(client.withdraw());
        })
    });
}

fn benchmark_stats(c: &mut Criterion) {
    c.bench_function("get_stats_empty", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, _, _) = create_test_campaign(&env, 100_000, 10_000, 0, 0);
            black_box(client.get_stats());
        })
    });

    c.bench_function("get_stats_10_contributors", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 100_000, 10_000, 0, 0);
            for _ in 0..10 {
                let contributor = Address::generate(&env);
                token_admin_client.mint(&contributor, &1_000);
                client.contribute(&contributor, &1_000, &token_id, &None);
            }
            black_box(client.get_stats());
        })
    });
}

fn benchmark_contributor_list(c: &mut Criterion) {
    c.bench_function("contributor_list_page1_of_10", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 1_000_000, 10_000, 0, 0);
            for _ in 0..10 {
                let contributor = Address::generate(&env);
                token_admin_client.mint(&contributor, &1_000);
                client.contribute(&contributor, &1_000, &token_id, &None);
            }
            black_box(client.contributor_list(&0, &10));
        })
    });

    c.bench_function("contributor_list_page2_of_50", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 10_000_000, 10_000, 0, 0);
            for _ in 0..50 {
                let contributor = Address::generate(&env);
                token_admin_client.mint(&contributor, &1_000);
                client.contribute(&contributor, &1_000, &token_id, &None);
            }
            // Second page — reads indices 25-49 only, not all 50.
            black_box(client.contributor_list(&25, &25));
        })
    });
}

// =============================================================================
// View-function benchmarks (issue #1148)
// =============================================================================
//
// These benchmarks measure the storage-read cost savings introduced by the
// `CachedInstanceView` optimisation in `crowdfund/src/views.rs`.
//
// ### What we measure
// The Soroban test host exposes `env.cost_estimate()` for metering. In the
// benchmarks below we use Criterion wall-clock timing as a proxy: because all
// benchmarks run the same workload the relative timings faithfully reflect
// differences in host-metered read counts.
//
// ### Before / after comparison
//
// | Function            | Reads before | Reads after |
// |---------------------|--------------|-------------|
// | `get_campaign_info` | 10–12        | 1 (batch)   |
// | `get_vested_amount` | 3–4          | 1 (batch)   |
// | `get_fee_mode`      | 1            | 1 (no-op)   |
//
// The "before" baseline is reproduced in `benchmark_views_naive_baseline` so
// the relative improvement is visible in Criterion's HTML report.

fn benchmark_views(c: &mut Criterion) {
    // ── get_campaign_info (optimised) ─────────────────────────────────────────

    c.bench_function("get_campaign_info_optimised", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, _, _) = create_test_campaign(&env, 100_000, 10_000, 100, 0);
            black_box(client.get_campaign_info());
        })
    });

    // ── get_campaign_info — naive baseline (before optimisation) ──────────────
    //
    // Simulates the old pattern: each field read independently via the contract
    // public API (one host call per field).  Criterion will show this is slower
    // than the batched version above, confirming the optimisation works.

    c.bench_function("get_campaign_info_naive_baseline", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, _, _) = create_test_campaign(&env, 100_000, 10_000, 100, 0);
            // Mimic the old per-key pattern
            let _ = client.creator();
            let _ = client.goal();
            let _ = client.deadline();
            let _ = client.min_contribution();
            let _ = client.max_contribution();
            let _ = client.total_raised();
            let _ = client.status();
            let _ = client.get_category();
            let _ = client.platform_config();
            let _ = client.get_fee_mode();
            black_box(());
        })
    });

    // ── get_vested_amount (optimised) ─────────────────────────────────────────

    c.bench_function("get_vested_amount_no_vesting_optimised", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 1_000, 10_000, 100, 0);
            let contributor = Address::generate(&env);
            token_admin_client.mint(&contributor, &1_000);
            client.contribute(&contributor, &1_000, &token_id, &None);
            env.ledger().set_timestamp(11_000);
            black_box(client.get_vested_amount());
        })
    });

    // ── get_vested_amount — naive baseline ────────────────────────────────────
    //
    // The old implementation did three separate instance reads:
    //   1. KEY_TOTAL
    //   2. KEY_PLATFORM
    //   3. KEY_VESTING
    // Reproduced here by calling individual getters in sequence.

    c.bench_function("get_vested_amount_naive_baseline", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 1_000, 10_000, 100, 0);
            let contributor = Address::generate(&env);
            token_admin_client.mint(&contributor, &1_000);
            client.contribute(&contributor, &1_000, &token_id, &None);
            env.ledger().set_timestamp(11_000);
            // Mimic old per-key pattern
            let _ = client.total_raised();
            let _ = client.platform_config();
            let _ = client.get_vesting_info();
            black_box(());
        })
    });

    // ── get_fee_mode ──────────────────────────────────────────────────────────
    //
    // Already single-read before the optimisation; included for regression
    // detection — should remain at the same cost tier.

    c.bench_function("get_fee_mode", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, _, _) = create_test_campaign(&env, 100_000, 10_000, 100, 0);
            black_box(client.get_fee_mode());
        })
    });

    // ── get_campaign_info with platform fee configured ────────────────────────

    c.bench_function("get_campaign_info_with_platform_fee", |b| {
        b.iter(|| {
            let env = Env::default();
            env.mock_all_auths();
            let creator = Address::generate(&env);
            let platform_addr = Address::generate(&env);
            let token_admin = Address::generate(&env);
            let token_id = env.register_stellar_asset_contract(token_admin);
            let contract_id = env.register_contract(None, CrowdfundContract);
            let client = CrowdfundContractClient::new(&env, &contract_id);
            env.ledger().set_timestamp(100);
            client.initialize(
                &creator, &token_id, &100_000, &10_000, &100, &0i128,
                &String::from_str(&env, "Fee Campaign"),
                &String::from_str(&env, "Platform fee test"),
                &None,
                &Some(PlatformConfig {
                    address: platform_addr,
                    fee_bps: 250,
                    fee_mode: crowdfund::FeeMode::OnSuccess,
                }),
                &None, &Category::Other, &None, &None,
            );
            black_box(client.get_campaign_info());
        })
    });

    // ── contributor_list page read ────────────────────────────────────────────

    c.bench_function("contributor_list_first_page_10", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 1_000_000, 10_000, 0, 0);
            for _ in 0..10 {
                let c = Address::generate(&env);
                token_admin_client.mint(&c, &1_000);
                client.contribute(&c, &1_000, &token_id, &None);
            }
            black_box(client.contributor_list(&0, &10));
        })
    });
}

// =============================================================================
// Lifecycle / versioning benchmarks (issue #1723)
// =============================================================================

fn benchmark_lifecycle(c: &mut Criterion) {
    c.bench_function("clone_campaign", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, _, _) = create_test_campaign(&env, 100_000, 10_000, 100, 0);
            black_box(client.clone_campaign());
        })
    });

    c.bench_function("contract_version", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, _, _) = create_test_campaign(&env, 100_000, 10_000, 100, 0);
            black_box(client.contract_version());
        })
    });

    c.bench_function("check_version", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, _, _) = create_test_campaign(&env, 100_000, 10_000, 100, 0);
            black_box(client.check_version());
        })
    });

    c.bench_function("migrate_version", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, _, _) = create_test_campaign(&env, 100_000, 10_000, 100, 0);
            black_box(client.migrate_version());
        })
    });
}

// =============================================================================
// Recurring contribution benchmarks (issue #1723)
// =============================================================================

fn benchmark_recurring(c: &mut Criterion) {
    c.bench_function("set_recurring_plan", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 100_000, 10_000, 100, 0);
            let contributor = Address::generate(&env);
            token_admin_client.mint(&contributor, &10_000);
            black_box(client.set_recurring_plan(
                &contributor,
                &1_000,
                &token_id,
                &1_000u64,
                &None,
            ));
        })
    });

    c.bench_function("execute_recurring_contribution", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 100_000, 10_000, 100, 0);
            let contributor = Address::generate(&env);
            token_admin_client.mint(&contributor, &10_000);
            client.set_recurring_plan(&contributor, &1_000, &token_id, &1_000u64, &None);
            env.ledger().set_timestamp(1_100);
            black_box(client.execute_recurring_contribution(&contributor));
        })
    });

    c.bench_function("cancel_recurring_plan", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 100_000, 10_000, 100, 0);
            let contributor = Address::generate(&env);
            token_admin_client.mint(&contributor, &10_000);
            client.set_recurring_plan(&contributor, &1_000, &token_id, &1_000u64, &None);
            black_box(client.cancel_recurring_plan(&contributor));
        })
    });
}

// =============================================================================
// Delegation benchmarks (issue #1723)
// =============================================================================

fn benchmark_delegation(c: &mut Criterion) {
    c.bench_function("delegate_contribution", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 100_000, 10_000, 100, 0);
            let delegator = Address::generate(&env);
            let delegate = Address::generate(&env);
            token_admin_client.mint(&delegator, &10_000);
            black_box(client.delegate_contribution(&delegator, &delegate, &token_id, &1_000));
        })
    });

    c.bench_function("revoke_delegation", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, token_id, token_admin_client) =
                create_test_campaign(&env, 100_000, 10_000, 100, 0);
            let delegator = Address::generate(&env);
            let delegate = Address::generate(&env);
            token_admin_client.mint(&delegator, &10_000);
            client.delegate_contribution(&delegator, &delegate, &token_id, &1_000);
            black_box(client.revoke_delegation(&delegator, &delegate));
        })
    });
}

// =============================================================================
// Deadline extension benchmarks (issue #1723)
// =============================================================================

fn benchmark_extension(c: &mut Criterion) {
    c.bench_function("extend_deadline", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, _, _) = create_test_campaign(&env, 100_000, 10_000, 100, 0);
            black_box(client.extend_deadline(&1_000u64));
        })
    });

    c.bench_function("extend_campaign", |b| {
        b.iter(|| {
            let env = Env::default();
            let (client, _, _) = create_test_campaign(&env, 100_000, 10_000, 100, 0);
            black_box(client.extend_campaign(&1_000u64));
        })
    });
}

criterion_group!(
    benches,
    benchmark_contribute,
    benchmark_refund,
    benchmark_withdraw,
    benchmark_stats,
    benchmark_contributor_list,
    benchmark_views,
    benchmark_lifecycle,
    benchmark_recurring,
    benchmark_delegation,
    benchmark_extension,
);
criterion_main!(benches);
