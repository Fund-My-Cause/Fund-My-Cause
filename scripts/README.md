# scripts/

Operational, build, and developer-utility scripts for Fund-My-Cause.

All shell scripts require `bash` ≥ 4.  Python scripts require Python 3.10+.
Node scripts (`*.js`, `*.ts`) run with Node 20+ via `node` or `npx ts-node`.

---

## Deployment

| Script | Purpose |
|--------|---------|
| `deploy.sh` | Deploy the crowdfund Soroban contract to Stellar network. Usage: `./scripts/deploy.sh [OPTIONS] <creator> <token> <goal> <deadline>` |
| `bootstrap.sh` | Spin up the full Docker Compose stack in one command. |
| `blue-green-deploy.sh` | Zero-downtime blue-green deployment for the backend services. |
| `blue-green-rollback.sh` | Emergency rollback for blue-green deployments. |
| `canary-deploy.sh` | Gradual traffic-shift canary rollout for Soroban contracts. |
| `canary-frontend.sh` | Canary rollout helper for the Next.js frontend. |
| `multi-region-deploy.sh` | Deploy across multiple geographic regions with geo-routing. |
| `switch-env.sh` | Toggle the active environment (`testnet` / `mainnet`). |

## Verification

| Script | Purpose |
|--------|---------|
| `verify-contract.sh` | Verify a deployed Soroban contract ID against the source WASM. |
| `verify-deployment.sh` | Verify a deployed contract checksum and configuration. |
| `verify-terraform.sh` | Confirm Terraform plan shows no unintended changes. |
| `verify-autoscaling.sh` | Dry-run check of Kubernetes autoscaling configuration. |
| `validate-env.sh` | Validate required environment variables are present and non-empty. |

## Testing

| Script | Purpose |
|--------|---------|
| `test-blue-green-deployment.sh` | Integration tests for blue-green deployment procedures. |
| `test-browsers.sh` | Run Playwright tests across all supported browsers (Bash). |
| `test-browsers.ps1` | Run Playwright tests across all supported browsers (PowerShell). |
| `test-commitlint.sh` | Smoke-test the commitlint commit-message hook. |
| `test-performance-testing.sh` | Validate the performance testing infrastructure itself. |
| `test-secret-management.sh` | Validate secret vault setup and rotation procedures. |
| `test-staging.sh` | Validate the staging environment and collect performance baselines. |
| `run-qf-tests.sh` | Run the quadratic-funding contract test suite. |
| `contract-coverage.sh` | Generate Rust contract coverage report. |
| `coverage-access-control.sh` | Coverage report scoped to access-control paths. |
| `lint-staged-check.sh` | Type-check and run affected tests for staged workspace changes (used by Husky). |

## Monitoring & Observability

| Script | Purpose |
|--------|---------|
| `monitor-events.sh` | Stream and index on-chain contract events. |
| `monitor-costs.sh` | Track and alert on infrastructure costs. |
| `monitor-gas.sh` | Track gas costs across contract versions. |
| `monitoring-setup.sh` | Configure CloudWatch/Prometheus alerts and dashboards. |
| `setup-staging-monitoring.sh` | Monitoring configuration for the staging environment. |
| `performance-monitoring.sh` | Collect performance metrics and generate trend alerts. |
| `performance-test.sh` | Automated load-testing and latency benchmarking. |
| `load-test.sh` | Load test the API to validate autoscaling thresholds. |

## Infrastructure

| Script | Purpose |
|--------|---------|
| `backup.sh` | Full backup of contract state, configuration, and deployment data. |
| `backup-contract-state.sh` | Snapshot the crowdfund contract ledger state. |
| `backup-k8s.sh` | Backup Kubernetes manifests and persistent volumes. |
| `restore-contract-state.sh` | Restore a contract state snapshot. |
| `restore-k8s.sh` | Restore Kubernetes manifests from backup. |
| `setup-backup-automation.sh` | Configure scheduled backups in CI/cron. |
| `purge-cache.sh` | Invalidate CDN and application-level caches. |
| `rotate-secrets.sh` | Rotate all production secrets and update deployments. |
| `secret-access-logging.sh` | Enable/verify audit logging for secret access. |
| `security-check.sh` | Run security audit tools (npm audit, gitleaks, Rust security advisories). |
| `reconcile-autoscaling.sh` | Reconcile live autoscaling config with the declared manifests. |

## Audit & Code Quality

| Script | Purpose |
|--------|---------|
| `audit-autoscaling.sh` | Audit Kubernetes autoscaling configuration for correctness. |
| `audit-events.sh` | Audit contract event emissions for completeness. |
| `audit-null-undefined.sh` | Audit TypeScript packages for unchecked null/undefined. |
| `audit-terraform.sh` | Audit Terraform modules for unused variables. |
| `audit-unwrap.sh` | Audit Rust contracts for unsafe `.unwrap()` / `.expect()` / `panic!`. |
| `check-dead-exports.js` | Detect exported symbols in `apps/interface/src/lib/webhooks` that are never imported (Issue #819). |
| `check-env-parity.js` | Validate that every required env variable in the schema is present in `.env.example` (Issue #715). |
| `cleanup-terraform.sh` | Remove unused Terraform variables and modules. |

## Developer Utilities

| Script | Purpose |
|--------|---------|
| `seed-db.sh` | Seed the local PostgreSQL database with sample data. |
| `seed-testnet.sh` | Seed the Stellar testnet with realistic campaign fixtures (Bash). |
| `seed-testnet.ps1` | Seed the Stellar testnet with realistic campaign fixtures (PowerShell). |
| `generate-fixtures.ts` | Regenerate deterministic TypeScript test fixtures (`npm run fixtures:generate`). |
| `check_wasm_size.py` | Verify the compiled WASM artifact is within the size budget (`make check-wasm-size`). |
| `check_regression.py` | Check benchmark results against stored baselines for instruction-count regressions. |
| `init-db.sql` | Initial SQL schema / seed for local development. |

---

## Usage patterns

```bash
# Deploy to testnet
./scripts/deploy.sh --network testnet <creator> <token> <goal> <deadline>

# Full local stack
./scripts/bootstrap.sh

# Lint + type-check staged files (called by Husky pre-commit)
./scripts/lint-staged-check.sh

# Regenerate test fixtures
npm run fixtures:generate

# WASM size budget check (called by `make check-wasm-size`)
python3 scripts/check_wasm_size.py --budget $(cat contracts/crowdfund/WASM_BUDGET_BYTES) target/wasm32-unknown-unknown/release/*.wasm
```
