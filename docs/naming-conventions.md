# Naming Conventions

This document defines the naming conventions enforced across the Fund-My-Cause codebase. All new code must follow these rules; existing outliers are tracked in [#1769](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1769).

---

## Files and directories

| Scope | Convention | Examples |
|-------|-----------|---------|
| TypeScript source files (non-component, non-hook) | `kebab-case.ts` | `api-client.ts`, `circuit-breaker.ts` |
| React component files | `PascalCase.tsx` | `CampaignCard.tsx`, `PledgeModal.tsx` |
| React hook files | `camelCase.ts` starting with `use` | `useWallet.ts`, `useCampaignDraft.ts` |
| Test files | Same as the file under test + `.test.ts(x)` | `api-client.test.ts`, `CampaignCard.test.tsx` |
| Directories | `kebab-case` | `shared-utils/`, `graphql-api/` |
| Config and tool files | Follow tool convention | `eslint.config.mjs`, `vitest.config.ts` |

> **React components** follow the convention documented in [`component-naming-convention.md`](./component-naming-convention.md). That document takes precedence for `apps/interface/src/components/`.

---

## TypeScript identifiers

### Variables and function parameters

Use `camelCase`.

```ts
const campaignId = "cmp_abc";
function fetchCampaign(id: string) { ... }
```

### Functions and methods

Use `camelCase`. Factory functions that return objects should still use `camelCase`; use a noun phrase for constructors.

```ts
export function createRateLimiter(opts: RateLimitOptions): RateLimiter { ... }
export function buildConnection<T>(items: T[], ...): Connection<T> { ... }
```

### Classes

Use `PascalCase`.

```ts
export class AppError extends Error { ... }
export class CircuitBreaker { ... }
```

### Interfaces and type aliases

Use `PascalCase`. Do **not** prefix interfaces with `I`.

```ts
export interface CampaignPayload { ... }   // ✅
export interface ICampaignPayload { ... }  // ❌
export type ErrorSeverity = "error" | "warn";
```

### Enums and enum members

Use `PascalCase` for the enum name. Use `SCREAMING_SNAKE_CASE` for members that map to fixed external values (HTTP codes, contract error codes); use `PascalCase` for semantic/domain members.

```ts
// Domain enum — PascalCase members
export enum AchievementType {
  FirstContribution = "FIRST_CONTRIBUTION",
  SuperSupporter    = "SUPER_SUPPORTER",
}

// Flags enum or error codes — SCREAMING_SNAKE_CASE members
export enum ErrorCode {
  WALLET_NOT_CONNECTED   = "WALLET_NOT_CONNECTED",
  CONTRACT_CALL_FAILED   = "CONTRACT_CALL_FAILED",
}
```

### Constants

Module-level constants that are truly fixed and exported use `SCREAMING_SNAKE_CASE`.
Local or function-scoped constants use `camelCase`.

```ts
export const DEFAULT_PAGE_SIZE = 20;      // ✅ exported constant
export const MAX_PAGE_SIZE = 200;         // ✅ exported constant
const retryDelayMs = 1000;               // ✅ local constant
```

### Generic type parameters

Use single uppercase letters (`T`, `K`, `V`) for simple generics, or descriptive `PascalCase` nouns for constrained generics.

```ts
function buildConnection<T>(...): Connection<T> { ... }
function createSlice<TState, TName extends string>(...) { ... }
```

---

## Rust identifiers (contracts)

Follow the official [Rust naming conventions](https://rust-lang.github.io/api-guidelines/naming.html):

| Item | Convention |
|------|-----------|
| Variables, function parameters | `snake_case` |
| Functions and methods | `snake_case` |
| Structs, enums, traits | `PascalCase` |
| Enum variants | `PascalCase` |
| Constants | `SCREAMING_SNAKE_CASE` |
| Modules | `snake_case` |

---

## Shell scripts

- File names: `kebab-case.sh` (e.g. `blue-green-deploy.sh`).
- Functions within scripts: `snake_case`.
- Environment variables and exported names: `SCREAMING_SNAKE_CASE`.

---

## Error classes

All application-level errors must extend `AppError` from `@fund-my-cause/shared-utils` and follow this pattern:

- Class name: `PascalCase` ending in `Error` (e.g. `CursorDecodeError`).
- Constructor sets `this.name` to the class name string.
- The first argument to `super(...)` is a stable `SCREAMING_SNAKE_CASE` error code.

```ts
export class CursorDecodeError extends AppError {
  constructor(cursor: string) {
    super("CURSOR_INVALID", `Invalid pagination cursor: "${cursor}"`, {
      severity: "warn",
      context: { cursor },
    });
    this.name = "CursorDecodeError";
  }
}
```

See [`packages/shared-utils/src/errors.ts`](../packages/shared-utils/src/errors.ts) for the base class.

---

## Enforcement

| Rule | Mechanism |
|------|-----------|
| Component file names are `PascalCase` | ESLint rule `local-rules/pascal-case-component-files`; test `component-naming-convention.test.ts` |
| No unlinked `TODO`/`FIXME` in services or contracts | `services/__tests__/todo-markers.test.ts` |
| Error classes extend `AppError` | Code review; tracked in [#1766](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1766) |

Remaining outliers from the initial naming audit are tracked in [#1769](https://github.com/Fund-My-Cause/Fund-My-Cause/issues/1769).
