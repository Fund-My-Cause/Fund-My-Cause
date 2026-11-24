# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 (2026-11-24)


### Features

* **#1129:** add request validation middleware to graphql-api ([61ffde9](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/61ffde99f20ad48d1fa85b1afde8dc68a6d5f422))
* **#1131:** add configuration-driven rules engine for monitoring ([2921c10](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/2921c1095fd018b4bbf83a89851e7d756445aed4))
* **#1132:** consolidate duplicate DTO mapping logic with contract tests ([9a64917](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/9a6491784a9422f7a8ce8edd8b8cd4dddd7962de))
* **#1133:** add query cost analysis to graphql api ([8986659](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/8986659b3484f17573586930a666cc27a51d5958))
* **#1134:** standardize environment/config loading across services ([848f76d](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/848f76d97a22b5e2dccc64c27da8ad30e25981b0))
* **#1136:** document circuit breaker/retry policy ([9a1486d](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/9a1486d37fbabc97a4a51e35a38f6e949a476169))
* **#1552:** Enable dead-code detection in CI-free local lint ([b0fab1b](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/b0fab1b511d00e9fc5fb8dd02fc986188d482461)), closes [#1552](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1552)
* add append-only audit log module ([#1701](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1701)) ([ef8f1ed](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/ef8f1edfd53128407b346276cb92a2d5a1be9125))
* add cross-contract integration tests for Registry+Crowdfund+QF flows - Implements comprehensive integration tests covering: - Registry campaign registration and status updates - Crowdfund campaign lifecycle with multiple contributors - QF quadratic funding allocation calculations - Full end-to-end Registry+Crowdfund+QF integration - Tests use soroban testutils for contract deployment and mocking - Covers edge cases: threshold filtering, failed campaigns, contributor diversity - Validates QF invariants and proportional distribution Closes [#1734](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1734) ([ba8e1bc](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/ba8e1bc463719e9180077c1c3b78c422060046f1))
* add crowdfund WASM and benchmark safeguards ([8d6226c](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/8d6226c64db9942281c23d2accc7dbba83414057))
* add error-state and empty-state design system components ([#1294](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1294)) ([a54076b](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/a54076b5a902cf27d911ea837e4b24ebbdf690fe))
* add exponential backoff with jitter for external calls ([#1698](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1698)) ([5d4d619](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/5d4d619f3fbf7f0ea1f8223c552551eb26928a62))
* add in-memory job queue for work off the request path ([#1699](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1699)) ([9afb141](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/9afb1417ab3dfff479b15561d0edf1725453f348))
* add integration test infrastructure for indexer (issue [#1547](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1547)) ([67697d6](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/67697d693726138fbe5ea989c3a1db3a876a784a))
* add loading and error boundary components to route segments ([dc4e1dd](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/dc4e1dd5acbbffd04e765232c8f8b5f966928b5c))
* add per-route-group rate limit buckets ([#1691](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1691)) ([e03ed60](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/e03ed60f23c8ffd6aa9cf246bae755916ce59a29))
* add read-through getOrSet to the cache service ([#1700](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1700)) ([0a331ce](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/0a331ceb1d88d6c4730b27bfd52fdaaddfb37fd4))
* add shared env validation for services (issue [#1545](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1545)) ([a360e49](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/a360e49ce4fee79c275fbc43e5a3ae1766e304d7))
* add structured logging standard for backend services ([eec32d8](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/eec32d871a5b85f26a2e82f213402d1800de2458)), closes [#1306](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1306)
* **backend:** modularize indexer handlers, wire migrations, add DB pool config ([9418f14](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/9418f14884f655d7f6901852aaef18df0b4bf2fc))
* **backend:** modularize indexer handlers, wire migrations, add shared DB pool config ([1cdfe66](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/1cdfe6640cc3628d2c0c6a85cd915851a64caf9e))
* **campaign-card:** split into sub-components ([#1534](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1534)) ([77c4ccc](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/77c4ccc02b1f88a7403f21c8d065b84c69e0ed9f))
* **campaign-card:** split into sub-components ([#1534](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1534)) ([e52f902](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/e52f90271c7ad5b40eb8fb001a67bcc783903173))
* campaigns container/presentational split and 90% coverage floor ([994d97d](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/994d97da0a10aa3d579198042c52b5387d90b20c))
* centralise graphql-api env parsing with named validation errors ([#1688](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1688)) ([7fd493f](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/7fd493f3cf5ba5185ccd9a247a4ed970aac9fea4))
* close [#1334](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1334) [#1335](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1335) [#1336](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1336) [#1337](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1337) ([cba8f62](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/cba8f622e9cc5820a2a6b811c0528d35b7d58fee))
* close [#1334](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1334) [#1335](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1335) [#1336](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1336) [#1337](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1337) - migration tests, benchmarks, WASM size, formal verification ([d4e5a82](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/d4e5a8255f9785b4c8004fadc656c6dbd60a4afe))
* code quality — [#1196](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1196) examples audit, [#1197](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1197) AppError, [#1199](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1199) Docker base, [#1200](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1200) boundary lint ([fbac367](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/fbac367d9c6494932e1fcbfd0724273d1e0cedbe))
* code quality improvements for [#1196](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1196) [#1197](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1197) [#1199](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1199) [#1200](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1200) ([aa63c8f](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/aa63c8fb7aa3e27b828bcc90e5082a3b93ef7369))
* **contracts:** [#1338](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1338) [#1339](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1339) [#1340](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1340) [#1341](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1341) - Refactor types, extract math, add QF tests, CHANGELOGs ([9cc0d41](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/9cc0d41f4778db4930cdab0f8e6a6395c0d7c810))
* **contracts:** implement [#1338](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1338) [#1339](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1339) [#1340](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1340) [#1341](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1341) ([25dafc0](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/25dafc0a4184b23e21c4e5c88bef110e0bfcbdbb))
* **contracts:** input validation helpers, migration harness, achievements access control, QF rounding tests ([#1714](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1714)-[#1717](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1717)) ([52198cf](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/52198cf3b1e05857021ff72eb3a7e8a48f71dd3a))
* **contracts:** input validation helpers, migration harness, achievements access control, QF rounding tests ([#1714](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1714)-[#1717](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1717)) ([81bdbc1](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/81bdbc1735376c91660be5444cf40eaf5164550a))
* **crowdfund:** optimize storage access patterns in views.rs ([#1148](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1148)) ([e3822fa](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/e3822faf18dd543420eeca2b2304b0dea2ac7fe0))
* **crowdfund:** optimize storage access patterns in views.rs ([#1148](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1148)) ([7cad1e9](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/7cad1e928a537504844a5dbfa13d104e59469a11))
* enhance create-campaign wizard E2E smoke test with comprehensive 5-step coverage (issue [#1548](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1548)) ([4b8c0a4](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/4b8c0a47bf5c3ad42041d1f494f0173bfbc724b0))
* enhance E2E campaign creation flow tests with on-chain verification - Add mock testnet stub for asserting on-chain deployment results - Add wallet connection handling test during deployment - Add file upload validation test - Add test for optional field skipping - Improve test coverage with stable selectors - Assert campaign deployed successfully with correct initial state Closes [#1735](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1735) ([4981036](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/4981036efdd6fdadd12455ca41d3f13475b6faa4))
* enhance E2E contribution flow with stable selectors and rejection handling - Add stable data-testid selectors for campaign cards and form inputs - Add specific error message validation for rejected transactions - Add test for form state preservation after rejection - Add test for immediate progress updates after successful contribution - Add insufficient balance error handling test - Improve happy path and rejection coverage with deterministic fixtures Closes [#1736](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1736) ([1dd2da4](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/1dd2da48f2fd904564b471cfd8ea5f4576770c63))
* enhance E2E withdraw and refund flows with deterministic fixtures Withdraw flow enhancements: - Add access control test (contributor cannot see withdraw button) - Add deterministic status messaging test - Cover creator and contributor perspectives Refund flow enhancements: - Add deterministic fixture tests for consistent campaign information - Add verification that active campaigns don't appear on refund page - Add dialog transaction flow test with stable selectors - Add refund status persistence test across page reloads - Add contributor refund eligibility verification test Closes [#1737](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1737) ([b87dfd8](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/b87dfd812d687962ab4a2e6e3b814833161a12fd))
* **events:** standardize event topic/data schema across all four contracts ([f2807b8](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/f2807b89589e86b27b9e7caffc9033641da83d67))
* extract shared @fund-my-cause/rpc-client package (Seam 2) ([9605c6b](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/9605c6b0b5590db92e6a832e2771771bacea24da))
* extract shared @fund-my-cause/rpc-client package (Seam 2) ([acc61f3](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/acc61f3945714a5626c064be931319215c49223a))
* force exit when graceful shutdown hangs ([#1695](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1695)) ([2f35afb](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/2f35afb8eacb97c69f8863b3d9b98cfbef56140c))
* frontend code quality — formatting, console logging, bundle budget, Card variant ([9f8da54](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/9f8da54a1f3d0e28d43676787a4fdd60f43185f0))
* frontend code quality — formatting, no-console, bundle budget, Card variant ([eb08bb7](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/eb08bb7baa3d9cb1b145812f314533e76b407d3a))
* **frontend,contracts:** campaigns container/presentational split and 90% coverage floor ([63b2643](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/63b2643bcd27c219e7df964fe3da47ea7ebecead)), closes [#1350](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1350) [#1531](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1531)
* **frontend:** modular campaign-detail sections ([#1376](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1376)) ([6129c13](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/6129c13b42919487d3e959f96eb0d40a49b459ff))
* **frontend:** modular campaign-detail sections + typed API client ([#1376](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1376), [#1375](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1375)) ([1dc6c1f](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/1dc6c1f13385ea406856ca7fc8f2a0cfc5c47f37))
* **frontend:** precise types, useWallet export, remove unused dep, skeleton states ([a7339b5](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/a7339b53875874afd00109daf7951e885387772d))
* **frontend:** precise types, useWallet export, remove unused dep, skeleton states ([cd83547](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/cd83547e713170b46eb7a3b3b56930215c9140b8))
* **graphql-api:** add AppError class and standardize error responses ([2ce4083](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/2ce4083ebc0abad7cf66a1610c6e4fe4d6d585fb))
* **graphql-api:** add AppError class and standardize error responses ([8458d09](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/8458d0955b561135e49726396ed9670812b344c7)), closes [#1537](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1537)
* **graphql-api:** add per-IP/per-API-key rate limiting on public endpoint ([fe883e6](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/fe883e69fdd465685c6eb714232f592568a929e9))
* implement [#1201](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1201) [#1202](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1202) [#1203](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1203) [#1204](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1204) ([f8e209f](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/f8e209fbf68c2b1d451fb56696153635290a7bea))
* implement IdempotencyStore protocol with Postgres and in-memory versions ([#1515](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1515)) ([8225996](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/82259966d0fe2a646992a3124275eee843e3e39b))
* implement IdempotencyStore protocol with Postgres and in-memory… ([3e83f6b](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/3e83f6bf1401738a01d698cb3bb13c8c9538e5bd))
* implement issues [#1525](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1525)-1527 and plan [#1528](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1528) Issues implemented: [#1525](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1525): Propagate request IDs through graphql-api middleware - Added request-id middleware to generate/validate trace IDs - Trace IDs returned in response headers - Integrated with existing tracing infrastructure - Comprehensive unit tests (16 test cases) [#1526](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1526): Merge auth test files with behaviour-based organization - Consolidated auth.bugfix.test.ts and auth.preservation.test.ts into auth.test.ts - Reorganized 38 tests into 6 behavioral sections - Removed duplicate test cases - Improved test maintainability without reducing coverage [#1527](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1527): Validate fraud detection config at startup - Created config.py with FraudDetectionConfig class - Schema-based validation using ConfigValidator pattern - All invalid config keys reported at once - Service fails fast on misconfiguration with exit code 1 - Comprehensive unit tests (20+ test cases) [#1528](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1528): Documented refactoring strategy for crowdfund lib.rs - Analyzed 3,899-line lib.rs with 157 functions - Created comprehensive refactoring guide - Identified 100% ABI-compatible approach - Provided function categorization and verification checklist - Ready for implementation team Related issues: [#835](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/835) [#1148](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1148) [#1559](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1559) [#1561](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1561) ([fb6167a](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/fb6167abfa18967ce9f0401c8ff90156a5329784))
* implement request validation, rules engine, and dto consolidation ([8bde969](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/8bde9692ae9eec388a669e98e5f7f8ff4ce822e0))
* **indexer:** add per-event processors ([8362e4b](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/8362e4b02f0bde0f2bf118d952806a4a77ee0b01))
* isolate Horizon calls behind centralized client (issue [#1546](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1546)) ([e863d99](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/e863d997e2dc6d2b41b4adb8a40d5e16228f106c))
* **monitoring-service:** add /healthz and /readyz health primitives ([8862c9a](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/8862c9abe43e064bcfd671770fa280b2ac5e2991))
* resolve issues [#1121](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1121) [#1122](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1122) [#1123](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1123) [#1124](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1124) ([d7cc851](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/d7cc8518c623a4783832efbb49784f01add5f299))
* resolve issues [#1121](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1121), [#1122](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1122), [#1123](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1123), [#1124](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1124) ([b471163](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/b4711633961d36dbed28dde7295460bce32dcdfd))
* send baseline security headers on every response ([#1694](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1694)) ([b4e6739](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/b4e67396ceeef80666b2cb8ad1018273d34de068))
* **testing:** [#1342](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1342) [#1343](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1343) [#1344](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1344) - Coverage gates, rpc-client tests, shared-utils tests ([64bbceb](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/64bbcebe414ecb4ed6d30cddf8639b95ec19517c))
* **testing:** [#1342](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1342) [#1343](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1343) [#1344](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1344) - Coverage gates, rpc-client tests, shared-utils tests ([96f3358](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/96f335865984519bdfc418b083f2d3b8dffc814f))


### Bug Fixes

* [#1350](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1350) [Frontend] Split app/campaigns page into focused container/pr ([c49676c](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/c49676c065e8cb54171bf14dafbaf53787a90033))
* [#1351](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1351) [Frontend] Consolidate duplicate data-fetching logic in src/s ([a7b2b97](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/a7b2b970687f201a5906e0cc7c608889e3a76646))
* [#1352](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1352) [Frontend] Extract Soroban wallet-connection logic from compo ([84df196](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/84df19669b4f22e76379abdbdf30bd30f83cb541))
* [#1353](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1353) [Frontend] Add unit tests for src/lib/soroban wallet and tran ([25e76d5](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/25e76d56737b0aa7bc487d91a5da82589896e713))
* [#1354](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1354) [Frontend] Normalize error handling across src/hooks ([5366435](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/5366435f870e0f3590027c2f9e3f4b839fb384e5))
* [#1355](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1355) [Frontend] Migrate Zustand/Redux store slices in src/store to ([0809e19](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/0809e19f30fdd3765a2e887319fa2e52f62593ad))
* [#1356](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1356) [Frontend] Remove dead code and unused exports from src/lib/c ([c1c9778](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/c1c977897508628e0a8f28e8ea45d1cd93c6f07e))
* [#1357](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1357) [Frontend] Add rate-limit unit tests for src/lib/rate-limit ([380b02b](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/380b02bfc483a5747a35fbe6a03135c6aad57d24))
* [#1359](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1359) [Frontend] Audit and fix accessibility violations flagged by ([30c88ba](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/30c88bac10d3b62520b12397f55e785e452236e5))
* [#1360](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1360) [Frontend] Add loading/error boundary components and apply co ([9675551](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/96755517359f8effdbc6b14cb72bd78b91905a2f))
* [#1361](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1361) [Frontend] Extract i18n string usage audit and remove unused ([e721146](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/e72114689c05fe14b7c893bdbf5c21e0575408a1))
* [#1362](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1362) [Frontend] Type-safety pass on src/types for campaign and con ([0da838f](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/0da838f5fe8856036273defd1c1ba7b17fc19e22))
* [#1363](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1363) [Frontend] Split large context providers in src/context into ([96008c3](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/96008c31ff8b45ff46deb3bd371060a65c372af8))
* [#1364](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1364) [Frontend] Remove unused mock fixtures from src/__mocks__ ([419cb2c](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/419cb2ca775a1d736df6a0dd3ec92895fc8dd5bc))
* [Code Quality] Consolidate Makefile targets with documented  ([#1213](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1213)) ([9abe967](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/9abe96764a7c3aba871092da922461d847c239c7))
* **a11y:** add accessible name to CommandPalette close button ([3c280b7](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/3c280b778d502fca2f042df75ced3f9a6bff20e2)), closes [#1475](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1475)
* address [#1354](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1354), [#1355](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1355), [#1356](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1356), [#1357](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1357) ([03ae9d7](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/03ae9d79c1ed8647e0bc29315afa8bc794412396))
* **backend:** standardize fraud route errors ([d657502](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/d6575023736c2b592f00cbd628219e92888a513a))
* **backend:** standardize fraud route errors ([aee7abf](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/aee7abf662f021f8779558a62aa8d6f43828bb22))
* centralize metadata keys and harden upgrade guards ([43d243f](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/43d243f739c720195aaff0f3e5106c9480c9a8db))
* centralize metadata keys and harden upgrade guards ([2febe31](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/2febe31360cc247192cbdf91d007f38f656a5001))
* code quality [#1762](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1762) [#1763](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1763) [#1764](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1764) [#1765](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1765) ([3421a59](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/3421a5964e3123134c388c9efbe7a0f322c521b9))
* consolidate trace ID implementations across Python and TypeScrip… ([2ef52fa](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/2ef52faae9a79ee95d0a7feee6850bc9bee0db7c))
* consolidate trace ID implementations across Python and TypeScript services ([2647f68](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/2647f68ae9f3066498af090540aeb52f50d00e58)), closes [#1516](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1516)
* **contracts:** error consolidation, TTL bound review, checked vote math ([55da6b5](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/55da6b574cd3582ec025e5a86d2820ebdbb86f0f))
* **contracts:** error consolidation, TTL bound review, checked vote math ([#1705](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1705) [#1706](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1706) [#1707](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1707)) ([93c455c](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/93c455cecc306b2b835a43314fb50aba43b32ff3))
* crowdfund WASM size and benchmark safeguards ([#1153](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1153)-[#1156](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1156)) ([b171e8d](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/b171e8d32e8db32ce368f635271e2f88831364b0))
* **crowdfund:** centralize auth, extend TTLs, add batched view ([#1559](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1559), [#1560](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1560), [#1561](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1561)) ([a5d2df7](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/a5d2df74c4f4bd57e3d119663883344c9907476b))
* **crowdfund:** centralize auth, extend TTLs, add batched view ([#1559](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1559), [#1560](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1560), [#1561](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1561)) ([f90e13b](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/f90e13b78ca62d8ae66f768d3798505828d89ce2))
* **crowdfund:** guard all unguarded arithmetic against overflow ([#1145](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1145)) ([d268342](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/d26834256a0f063cf53969a9817368f00550f877))
* **crowdfund:** guard arithmetic operations against overflow ([#1313](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1313)) ([f494f47](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/f494f47bf1a4f42a42269140b93b23ff00c50945))
* **crowdfund:** restore storage and auth bindings dropped in [#1311](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1311) ([1f24385](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/1f24385df898172a85fbb23ae8842eeee6ff63f0))
* **crowdfund:** restore storage and auth bindings dropped in [#1311](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1311) ([2ae6af7](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/2ae6af76047ef072bbbdd29520b15cf84153505d)), closes [#1457](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1457)
* **crowdfund:** restore unbound storage and auth bindings so the crate compiles ([2920680](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/29206800b9be00116c1fbf4eb9e8e33eb513eb2a))
* **errors:** close error-enum consolidation gaps across contract crates ([06d5836](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/06d5836d0118c6ee6f125083667882401074f7aa))
* **errors:** handle CommonError::NotInitialized in From&lt;CommonError&gt; implementations ([#1310](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1310)) ([1a7d9a2](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/1a7d9a270f7f0d7a6162b51d62f825002ff75202))
* **fraud-detection:** preserve trace IDs in structured logs ([8801e8a](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/8801e8a50170763f7960a3ed7dc19c134d337047))
* **fraud-detection:** preserve trace IDs in structured logs ([8c39ef0](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/8c39ef09fc023117a9d146c63661cdc18b9385d3))
* **frontend:** enforce PascalCase component filenames ([#1368](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1368)) ([fcd0918](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/fcd09185f9cb15092d9b7aa3fbe44eae3a12742c))
* **frontend:** enforce PascalCase component filenames, verify selector memoization ([#1368](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1368) [#1366](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1366) [#1367](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1367)) ([282842b](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/282842bfdec8040b8e0978fe983b871b13447735))
* **frontend:** resolve [#1377](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1377), [#1374](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1374), [#1370](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1370), [#1369](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1369) ([c835053](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/c835053eb6fd1b295e6aff78c27008382e5b2840))
* **frontend:** resolve issues [#1377](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1377), [#1374](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1374), [#1370](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1370), [#1369](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1369) ([fde5c51](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/fde5c5158265663bf8cbe8d53ca6dbdec88b8bdd))
* **interface:** route profile reads through generated GraphQL client ([#1553](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1553)) ([7b4bf5d](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/7b4bf5d4acdacc763097ed5ba4fd63f79eef5f1a))
* load ErrorSimulator only in development builds ([#1498](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1498)) ([f87fd3f](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/f87fd3f3e7264af7a81c74d186e24b34b3026581))
* **registry:** eliminate dead_code by wiring up the orphaned events module ([283549f](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/283549f7277f51125b3f087a2c159ad7e13a61d6))
* remove feature flags that no code reads from the registry ([#1499](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1499)) ([e8db16a](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/e8db16a7519798e2be81c136abec2939aaed46ba))
* resolve code quality issues — error unification, naming, scripts docs, TODO cleanup ([0e0c73a](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/0e0c73a6803499bafd5ac92d2fc91ba342dd84cc))
* resolve code quality issues [#1766](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1766) [#1767](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1767) [#1768](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1768) [#1769](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1769) ([dd3c7ab](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/dd3c7abddd3186e2992faef322e8413c967eb0d0))
* resolve issues [#1350](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1350), [#1565](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1565), and [#1568](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1568) ([26cab08](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/26cab08700c1b5e79ff2f210771f751cd29c525c))
* resolve issues [#1350](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1350), [#1565](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1565), and [#1568](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1568) ([3902d61](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/3902d61c56d28ce785e853205b2a6d7a8d809fd8))
* return a typed NotFound error instead of unwrap() on crowdfund storage reads ([#1496](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1496)) ([f5538a9](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/f5538a9994e0869272213320f5c8cf302eac8710))
* review panic_regression.rs coverage for new panic sources ([33445d6](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/33445d6bed05a8f574eee9b39d602dbddded7450))
* review panic_regression.rs coverage for new panic sources ([b97e260](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/b97e26034f289ef9dcaae039becb70bcfeb4d1f2)), closes [#1151](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1151)
* standardize imports, types and lint enforcement ([45ab108](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/45ab108dd073978eafb6d94bdff3235efcdd8c93))
* **ui:** perf and a11y fixes for [#1101](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1101)-[#1104](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1104) ([263bf42](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/263bf4281e77ae4c86076ed95eec950291a754d7))
* **ui:** perf and a11y fixes for [#1101](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1101)-[#1104](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1104) ([c3ef418](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/c3ef41817f178b60d1f17aa43a01f902f40a9ae4))
* unify alert transports and logging, bound recurring plans ([46a5cc5](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/46a5cc521ecbb833fe7f98c526c057eae2be5e3f))
* unify alert transports and logging, bound recurring plans ([004b415](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/004b415078f130e2b00c2261c0d2504a7d906cc3))
* wire alert pipeline and eliminate mock transport (Seam 4) ([e0ebc3b](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/e0ebc3b26d88ef686b3e872b737093dec1704270))
* wire alert pipeline and eliminate mock transport (Seam 4) ([cf408ee](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/cf408ee0b55ecc663abe65171b36f54dc8be1ffe))


### Performance Improvements

* **campaigns:** virtualize CampaignList rendering for large result sets ([876df59](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/876df59d23e4780b03eef412c8671af70c6165fd)), closes [#1365](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1365)
* lazy-load the analytics dashboard and campaign analytics ([#1504](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1504)) ([4aaff10](https://github.com/Fund-My-Cause/Fund-My-Cause/commit/4aaff1071b88642ea403de23d58c9a1d00167309))

## [Unreleased]

### Changed
- **#1518/#1519 Shared resilience primitives** — moved the generic three-state circuit
  breaker into `@fund-my-cause/shared-utils` and added a shared exponential-backoff retry
  helper. Indexer HTTP/RPC clients and the Horizon wrapper now delegate to the shared
  implementations; existing `@fund-my-cause/rpc-client` and indexer imports remain valid.
- **Crowdfund event topics renamed from `("campaign", <event>)` to `("crowdfund", <event>)`** (see
  ADR-010). Event names and payloads are unchanged. Indexers must subscribe to the `crowdfund`
  scope for campaign events; events emitted before this release keep the old scope on the ledger.
- **#1350 Campaigns page split into container/presentational components** — `CampaignList`,
  `CampaignFilters`, and `CampaignCard` extracted to `src/components/campaigns/`; the page
  now wires state through a `CampaignsContainer` and delegates rendering to those presentational
  components.

### Added
- **#1717 Common validation helpers** — `validate_goal`, `validate_deadline`, and
  `validate_amount_range` added to `contracts/common/src/validation.rs` and exported from the
  crate root. Contracts can now delegate primitive input checks to these shared implementations
  instead of maintaining independent copies.
- **#1716 Crowdfund upgrade/migration harness** — `KEY_CONTRACT_VERSION` is now written during
  `initialize` so every fresh deployment has a stored version. `seed_old_schema` added to
  `contracts/crowdfund/tests/common.rs` as a shared fixture for migration tests that need to
  simulate a v5 on-disk layout.
- **#1715 Achievements authorized-caller access control** — `add_authorized_caller` (admin-only)
  lets the platform register an external contract (e.g. `crowdfund`) that may call
  `record_contribution` without requiring the individual user's signature. `get_authorized_caller`
  returns the currently registered address. Tests added to `tests/access_control.rs`.
- **#1714 QF rounding/precision property tests** — rounding-specific tests added to
  `contracts/qf/src/tests/property_and_edge_cases.rs` verifying the accounting identity
  (`total_distributed + remaining_pool == matching_pool`), that `remaining_pool` is never
  negative, and that floor division cannot cause `total_distributed > matching_pool`.
- **#1531 90 % line-coverage floor on crowdfund contract** — `make contracts:coverage` runs
  `cargo llvm-cov` for the `crowdfund` package and fails with a non-zero exit code when line
  coverage drops below 90 %. New branch tests in
  `contracts/crowdfund/tests/refund_withdraw_coverage.rs` exercise previously-uncovered guards
  in `src/refund.rs` and `src/withdraw.rs` (AlreadyWithdrawn, GoalNotReached, soft_cap path,
  partial-release proportional refund, record_release accumulation).

### Changed
- **#1682 Backend layered architecture** — route handlers in `backend/` are now thin
  controllers; business logic moved into service modules and all persistence into
  repository modules, with dependencies injected at app startup (no module-level
  singletons in handlers). Public request/response behaviour is unchanged.
- **#1683 Structured logging with request IDs** — all backend services now log through
  pino (Node) / structlog (Python) with a per-request `requestId` bound to every log
  line; all remaining `console.*` calls in `backend/` were removed.
- **#1685 Database query optimisation** — added indexes backing the hot query paths
  (campaign lookup by creator/state, contributions by campaign/contributor, event
  lookups by contract/type) via new migrations; slow-query profiling results are
  recorded in the PR.

### Removed
- **Deprecated `/health` endpoint** — removed the legacy `GET /health` route from
  `backend/recommendations/service.py` and `backend/fraud_detection/pipeline.py`. It was a
  duplicate of `GET /healthz` (which additionally reports a timestamp) and `GET /readyz`;
  no client called `/health` specifically, only its own test suite. Associated
  `test_health` tests were removed, and `tests_error_schema.py` now asserts against
  `/healthz` instead.
- **#1684 Unused fraud-detection endpoints** — removed the following routes from
  `backend/fraud_detection/pipeline.py`; none had callers in `apps/interface`, `sdks/js`
  or the indexer, and each is superseded by `/healthz`/`/readyz` or the GraphQL API:
  - `GET /fraud/health` — duplicate of `GET /healthz`.
  - `GET /fraud/ready` — duplicate of `GET /readyz`.
  - `GET /fraud/version` — build metadata already exposed by `/healthz`.
  - `POST /fraud/score/legacy` — superseded by `POST /fraud/score` (identical payload,
    no remaining callers).
  - `GET /fraud/rules/deprecated` — returned an empty stub list; no client usage.
- **#1684 Unused GraphQL schema surface** — removed from `services/graphql-api`; no
  queries or fragments in `apps/interface` or `sdks/js` referenced them, and the
  underlying data is available through the retained resolvers:
  - `Query.legacyCampaigns` resolver + `LegacyCampaign` type — superseded by
    `Query.campaigns` / `Campaign`.
  - `Query.fraudScoreLegacy` resolver — superseded by `Query.fraudScore`.
  - `Campaign.deprecatedContributorCount` field — superseded by `Campaign.contributorCount`.
  - `Mutation.updateCampaignLegacy` mutation — superseded by `Mutation.updateCampaign`.
- **#1684 Other unused backend endpoints** — removed `GET /metrics/legacy` from
  `services/monitoring-service` (superseded by `GET /metrics`) and
  `GET /recommendations/v0` from `backend/recommendations/service.py` (superseded by
  `GET /recommendations`). Associated tests were deleted or retargeted at the
  replacement endpoints.

### Added
- **#893 REST endpoint audit** — `services/graphql-api/docs/rest-endpoints.md` documents
  every REST route in `services/graphql-api` (`GET /health`, `GET /status`, `GET /metrics`,
  `POST /graphql`) with a caller cross-reference against `apps/interface` and `sdks/js`.
  All routes are confirmed active with zero deprecated callers.  The frontend migrated fully
  to GraphQL for *data* operations; the three non-GraphQL routes are operational/infra
  endpoints with no GraphQL equivalents and no candidates for removal.
- **#894 Indexer database index migration** — `services/indexer/src/migrations/` adds a
  structured migration system for the in-memory EventStore:
  - `001_add_event_indexes.ts` — adds secondary `contractIndex` and `typeIndex` Maps that
    eliminate full-table scans on `queryByContract` and `queryByType` (O(n) → O(k log k),
    where k = matching events).  Includes `up()`, `down()` (rollback), and `verify()`.
  - `run-migrations.ts` — migration runner that applies or rolls back all migrations in
    order.  Idempotent; safe to run on restart.
  - `EventStore` extended with `enableIndexes()`, `disableIndexes()`, `verifyIndexes()`,
    and the `IndexedEventStore` interface; secondary indexes maintained on every `addEvents`
    call (O(1) amortised overhead per event).
  - Migrations applied automatically at indexer startup via `runMigrations(store, 'up')`.
- **#895 Centralised structured logging** — all backend services now emit structured logs
  consistent with `docs/logging-conventions.md`:
  - `services/monitoring-service/src/logger.ts` — pino logger with `service: monitoring-service`
    binding and `requestLogger(traceId)` helper (mirrors `graphql-api` and `indexer` loggers).
  - All `console.log` / `console.error` calls removed from `incident-response.ts`,
    `pagerduty-integration.ts`, `alert-transport.ts`, and `index.ts`; replaced with
    structured `logger.info` / `logger.error` / `logger.warn` / `logger.debug` calls.
  - `backend/recommendations/service.py` — structlog added with `merge_contextvars` processor
    chain, `TraceIDMiddleware` registered on the FastAPI app, and `log.info` / `log.debug`
    calls on recommendation request/cache-hit/cache-miss paths.  Mirrors the canonical
    implementation in `backend/fraud_detection/pipeline.py`.
  - `structlog==24.1.0` added to `backend/recommendations/requirements.txt`.
- **#896 Indexer event handler split** — `services/indexer/src/handlers/` introduces a
  domain-driven dispatch layer:
  - `types.ts` — `EventHandler` shared interface (`eventType: string`, `handle(events, repo)`).
  - `campaign.handler.ts` — handles `campaign` events with domain-specific log fields
    (creator, title, goal, deadline).
  - `donation.handler.ts` — handles `donation` events and the legacy `Contribute` alias
    (backward compat with original Soroban contract event names); logs per-batch total amount.
  - `achievement.handler.ts` — handles `achievement` events (badge, points, achievement_type).
  - `dispatcher.ts` — `EventDispatcher` groups a mixed batch by type, routes each group to
    the matching handler, and falls back to the repository for unknown types (zero event loss).
    Alias routing registered at construction time via `static aliases` on handler classes.
  - `index.ts` barrel re-exports all handlers and the dispatcher.
  - `services/indexer/src/index.ts` updated: ingestion loop now calls `dispatcher.dispatch(events)`
    instead of `eventRepository.addEvents(events)`.
  - Unit tests: `campaign.handler.test.ts`, `donation.handler.test.ts`,
    `achievement.handler.test.ts`, `dispatcher.test.ts` (mixed batch, alias routing,
    fallback, empty batch, end-state equivalence with pre-refactor behavior).

### Removed
- **#893** No REST endpoints removed — all existing routes have active callers.
  (See `services/graphql-api/docs/rest-endpoints.md` for the full audit record.)

### Added
- Seed/fixture generators for local testing and development (#731)
  - `scripts/seed-testnet.sh` — Unix/Linux/Mac script to deploy sample campaigns to testnet covering all lifecycle states (active, funded, failed, refunding)
  - `scripts/seed-testnet.ps1` — Windows PowerShell version of seed script with identical functionality
  - `scripts/generate-fixtures.ts` — TypeScript fixture generator creating realistic JSON test data for E2E and component tests
  - `fixtures/README.md` — comprehensive documentation for using fixtures and seed scripts, including campaign states, usage examples, and troubleshooting
  - `docs/LOCAL_DEVELOPMENT_QUICKSTART.md` — quick start guide for local development with step-by-step setup instructions
  - `npm run fixtures:generate` — command to generate test fixtures JSON
  - `npm run seed:testnet` — command to seed testnet with sample campaigns (Unix/Linux/Mac)
  - Automatic `.env.local` generation with deployed contract IDs
  - `fixtures/seed-data.json` generation with deployment metadata and contract addresses
  - Campaign templates covering 10 different states: new, mid-progress, near goal, fully funded, failed, refunding, paused, near deadline, early stage, and low progress
  - Support for 5-50 campaigns with `--num-campaigns` option for load testing
  - Verbose mode for detailed deployment logging
  - Backup creation for `.env.local` before overwriting
- `docs/api/` — structured API reference for both contracts: `crowdfund.md`,
  `registry.md`, `types.md`, `errors.md`, `events.md`, each cross-linked.
- `docs/tutorials/` — six step-by-step guides: getting started, campaign
  creation, accepting contributions, building a dashboard, donation matching,
  and saved-search alerts.
- `sdks/js/` — typed JavaScript/TypeScript SDK (`@fund-my-cause/sdk`) exposing
  `FmcClient` (all read + write methods), `FmcRegistryClient`, `FmcContractError`,
  and unit-conversion helpers (`xlmToStroops`, `stroopsToXlm`, etc.).
- `sdks/js/src/utils.test.ts` — unit tests for all SDK utility functions.
- `playground/` — interactive testnet playground: `query.js` (read-only CLI),
  `contribute.js` (send a contribution), `run.js` (interactive menu), and
  `requests.http` (VS Code REST Client snippets for raw Soroban RPC calls).
- `examples/` — five runnable integration examples: `basic-campaign`,
  `campaign-list`, `donation-matching`, `contribution-widget` (React), and
  `event-listener` (on-chain event polling).
- Initial project setup with Soroban smart contracts
- Decentralized crowdfunding platform on Stellar network
- Pull-based refund model for scalable fund distribution
- Platform fee configuration support
- Next.js frontend with Freighter wallet integration
- Campaign registry contract for discovery
- Comprehensive test suite with snapshots
- CI/CD pipeline with GitHub Actions
- `DataKey::ContributorIndex(u32)` storage key for O(1) per-contributor writes,
  replacing the O(n) `KEY_CONTRIBS` Vec append that grew proportionally with
  campaign size.
- `estimateContributionGas(contractId, contributor, amount, tokenId)` in
  `apps/interface/src/lib/contract.ts` — simulates a contribution and returns
  the estimated network fee in stroops and XLM before the user signs.
- `getContributorsPaginated(contractId, offset, limit)` in
  `apps/interface/src/lib/contract.ts` — fetches a page of contributor addresses
  using the new indexed storage, proportional only to page size.
- `validate_refund_eligibility(now, deadline, total, goal)` in `validation.rs`
  combines the duplicate deadline + goal checks shared by `refund_single` and
  `refund_batch` into a single short-circuit function.
- Extended benchmark suite in `contract_benchmarks.rs`: `contribute_repeat_contributor`,
  `contribute_50th_contributor`, `get_stats_empty`, `get_stats_10_contributors`,
  `contributor_list_page1_of_10`, and `contributor_list_page2_of_50`.

### Changed
- `contribute()` now validates the minimum-amount constraint **before** reading
  the blacklist/whitelist from persistent storage, saving 1–2 storage reads on
  every rejected under-minimum contribution.
- `contributor_list(offset, limit)` now reads only the requested page of
  contributors via indexed persistent keys instead of deserialising the full
  contributor list on every call.
- `get_stats()` now caches the instance storage handle to reduce repeated borrow
  overhead across the four instance reads it performs.
- `get_performance_metrics()` now correctly reads contributors from persistent
  storage via indexed keys; previously it read `KEY_CONTRIBS` from instance
  storage (which was always empty), so trending was always 0.
- `refund_single()` and `refund_batch()` now delegate their eligibility checks
  to `validate_refund_eligibility()`, removing duplicated inline logic.
- `contribute_on_behalf()` now also writes `DataKey::ContributorIndex` for
  first-time delegated contributors, making them visible via `contributor_list`.

### Deprecated

### Removed

### Fixed
- `get_performance_metrics()` trending metric was always 0 because contributors
  were read from the wrong storage tier (instance instead of persistent).

### Security

## [0.1.0] - 2026-03-28

### Added
- Initial release of Fund-My-Cause
- Soroban smart contracts (crowdfund and registry)
- Next.js 16 frontend with TypeScript and Tailwind CSS
- Freighter wallet integration
- Campaign creation, contribution, and refund functionality
- Platform fee mechanism
- Automated deployment scripts
- E2E tests with Playwright
- Unit tests with Jest and Vitest

[Unreleased]: https://github.com/Fund-My-Cause/Fund-My-Cause/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Fund-My-Cause/Fund-My-Cause/releases/tag/v0.1.0
