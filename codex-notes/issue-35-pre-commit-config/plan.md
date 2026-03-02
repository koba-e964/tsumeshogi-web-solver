# Plan: Issue #35 Add `.pre-commit-config.yaml`

## Overview
Add a root-level `.pre-commit-config.yaml` with a minimal, low-cost hook set that improves local commit hygiene and aligns with existing CI checks without duplicating heavy test workloads.

Design goals:
- Introduce pre-commit safely with fast hooks.
- Reuse existing project tooling for language checks where practical.
- Pin external hook repositories to immutable commit hashes.
- Keep scope to one logical change requested by issue #35.

## Files To Change
- `.pre-commit-config.yaml` (new)

Optional (only if explicitly requested later, not in current scope):
- `README.md` for setup instructions.

## Detailed Implementation Steps
1. Select minimal hook categories:
- Generic text hygiene hooks from `pre-commit-hooks`:
  - `end-of-file-fixer`
  - `trailing-whitespace`
  - `check-yaml`
  - `check-merge-conflict`
- Rust formatting check via local hook:
  - `cargo fmt --all -- --check`
- TypeScript lint/format checks via local hooks (run in `www/`):
  - `npm run lint`
  - `npm run test:prettier`

2. Pin repository hooks by commit hash:
- Resolve latest `pre-commit-hooks` tag and hash.
- Use hash in `rev` with inline comment `# frozen: vX.Y.Z`.

3. Configure local hooks for subdirectory-aware execution:
- Use `entry` commands that execute in `www/` for npm scripts (e.g., `cd www && npm run lint`).
- Scope file patterns to avoid unnecessary execution where possible.

4. Keep hook cost controlled:
- Do not add full `cargo test` or `npm test` to pre-commit.
- Avoid auto-fixing transforms beyond basic text hygiene.

5. Validate configuration syntactically and behaviorally:
- Run `pre-commit run --all-files`.
- If hooks fail due to existing code issues, capture failures and remediate only if directly required for this issue scope.

6. Confirm final diff is single-change scoped:
- Ensure only `.pre-commit-config.yaml` is introduced unless fixing unavoidable hook config issues.

## Alternatives Considered
1. Generic hooks only (no Rust/TS hooks)
- Pros: fastest commits, zero toolchain assumptions.
- Cons: weak value for this repo’s actual quality gates.
- Rejected: under-delivers compared to current CI expectations.

2. Full CI parity hooks (`cargo test`, `npm test`)
- Pros: stronger local gate.
- Cons: high latency; poor commit UX.
- Rejected: violates minimal/low-cost pre-commit objective.

3. Use language-specific third-party pre-commit repos for Rust/JS
- Pros: less custom shell wiring.
- Cons: more external dependencies and maintenance.
- Rejected: local hooks using existing project scripts are simpler and match current tooling.

## Risks
- Local environments missing required tools (`pre-commit`, Rust toolchain, Node deps under `www`) can cause hook failures.
- Running npm hooks from wrong directory would fail; requires explicit `cd www`.
- Strict lint/format checks may block commits until existing issues are fixed.

## Test Strategy
- Validate `.pre-commit-config.yaml` parse and hook execution by running:
  - `pre-commit run --all-files`
- Spot-check targeted commands:
  - `cargo fmt --all -- --check`
  - `cd www && npm run lint`
  - `cd www && npm run test:prettier`
- Confirm no unrelated file modifications are introduced by hooks.

## Assumptions
- Issue #35 expects creation of `.pre-commit-config.yaml` only.
- Adding minimal Rust/TS checks in pre-commit is acceptable and consistent with repository intent.
- Using pinned external hook repo commits is desired.

## Open Questions
- Should README setup instructions (`pre-commit install`) be included in this issue scope?
- Should Rust/TS checks run at `pre-commit` stage or be moved to `pre-push` for performance?

## Implementation Checklist
- [x] Determine pinned commit hash for `pre-commit-hooks` and record tag comment.
- [x] Add root `.pre-commit-config.yaml` with minimal generic hooks.
- [x] Add local Rust format check hook.
- [x] Add local TypeScript lint/prettier hooks for `www/`.
- [x] Run `pre-commit run --all-files` and fix config-level issues if needed.
- [x] Verify diff remains scoped to issue #35 request.
