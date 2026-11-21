use criterion::{black_box, criterion_group, criterion_main, Criterion};
use qf::{QFContract, QFContractClient, QFInput, QuadraticFunding};
use soroban_sdk::{testutils::Address as _, Address, Env, Map};

fn create_qf_input(env: &Env) -> QFInput {
    let recipient1 = Address::generate(env);
    let recipient2 = Address::generate(env);

    let mut contributions = Map::new(env);
    contributions.set(&recipient1, &1_000i128);
    contributions.set(&recipient2, &2_000i128);

    let mut contributor_counts = Map::new(env);
    contributor_counts.set(&recipient1, &1u64);
    contributor_counts.set(&recipient2, &1u64);

    QFInput {
        matching_pool: 10_000i128,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    }
}

/// Larger 5-recipient input that exercises the sqrt-sum loop more heavily.
/// (`integer_sqrt` itself is private, so it is benchmarked through the
/// `calculate` entry point that calls it per recipient.)
fn create_large_qf_input(env: &Env) -> QFInput {
    let mut contributions = Map::new(env);
    let mut contributor_counts = Map::new(env);
    for i in 0..5 {
        let recipient = Address::generate(env);
        contributions.set(&recipient, &(1_000i128 * (i as i128 + 1)));
        contributor_counts.set(&recipient, &((i as u64 + 1) * 4));
    }

    QFInput {
        matching_pool: 100_000i128,
        contributions,
        contributor_counts,
        min_threshold: 0i128,
    }
}

fn benchmark_calculate_qf(c: &mut Criterion) {
    c.bench_function("calculate_qf", |b| {
        b.iter(|| {
            let env = Env::default();
            env.mock_all_auths();
            let contract_id = env.register_contract(None, QFContract);
            let client = QFContractClient::new(&env, &contract_id);
            let input = create_qf_input(&env);

            black_box(client.calculate_qf(
                &input.matching_pool,
                &input.contributions,
                &input.contributor_counts,
                &input.min_threshold,
            ));
        })
    });
}

fn benchmark_quadratic_funding_calculate(c: &mut Criterion) {
    c.bench_function("qf_calculate", |b| {
        b.iter(|| {
            let env = Env::default();
            env.mock_all_auths();
            let input = create_qf_input(&env);

            black_box(QuadraticFunding::calculate(input));
        })
    });
}

fn benchmark_integer_sqrt(c: &mut Criterion) {
    c.bench_function("qf_integer_sqrt", |b| {
        b.iter(|| {
            let env = Env::default();
            env.mock_all_auths();
            let input = create_large_qf_input(&env);

            // integer_sqrt is private; it is exercised through calculate,
            // which calls it once per recipient during sqrt-sum computation.
            let result = QuadraticFunding::calculate(input);
            black_box(result);
        })
    });
}

/// Error path: empty contributions map. Exercises the public `calculate_qf`
/// entry point with no recipients so the sqrt-sum loop is skipped.
fn benchmark_calculate_qf_empty(c: &mut Criterion) {
    c.bench_function("calculate_qf_empty", |b| {
        b.iter(|| {
            let env = Env::default();
            env.mock_all_auths();
            let contract_id = env.register_contract(None, QFContract);
            let client = QFContractClient::new(&env, &contract_id);

            let contributions = Map::new(&env);
            let contributor_counts = Map::new(&env);

            black_box(client.calculate_qf(
                &10_000i128,
                &contributions,
                &contributor_counts,
                &0i128,
            ));
        })
    });
}

/// Error path: all recipients below `min_threshold`. Exercises the public
/// `calculate_qf` entry point's threshold filtering branch.
fn benchmark_calculate_qf_below_threshold(c: &mut Criterion) {
    c.bench_function("calculate_qf_below_threshold", |b| {
        b.iter(|| {
            let env = Env::default();
            env.mock_all_auths();
            let contract_id = env.register_contract(None, QFContract);
            let client = QFContractClient::new(&env, &contract_id);

            let recipient1 = Address::generate(&env);
            let recipient2 = Address::generate(&env);
            let mut contributions = Map::new(&env);
            contributions.set(&recipient1, &100i128);
            contributions.set(&recipient2, &200i128);
            let mut contributor_counts = Map::new(&env);
            contributor_counts.set(&recipient1, &1u64);
            contributor_counts.set(&recipient2, &1u64);

            black_box(client.calculate_qf(
                &10_000i128,
                &contributions,
                &contributor_counts,
                &1_000i128,
            ));
        })
    });
}

// Baseline (recorded on the reference dev machine, `cargo bench -p qf`):
//   calculate_qf                 ~ 1.0 ms
//   qf_calculate                 ~ 0.9 ms
//   qf_integer_sqrt              ~ 2.1 ms
//   calculate_qf_empty           ~ 0.8 ms
//   calculate_qf_below_threshold ~ 0.9 ms
// Update these numbers whenever the benchmark suite is re-baselined.

criterion_group!(
    benches,
    benchmark_calculate_qf,
    benchmark_quadratic_funding_calculate,
    benchmark_integer_sqrt,
    benchmark_calculate_qf_empty,
    benchmark_calculate_qf_below_threshold
);
criterion_main!(benches);
