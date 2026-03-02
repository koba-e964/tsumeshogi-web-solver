# Research: Issue #35 Add `.pre-commit-config.yaml`

## Task Context
- GitHub issue: `koba-e964/tsumeshogi-web-solver#35`
- Issue title: `Add .pre-commit-config.yaml`
- Issue body: none
- Scope inferred from issue title: add root-level pre-commit configuration for this repository.

## Relevant Files and Modules
- `Cargo.toml`
  - Rust crate metadata and dependency graph.
- `.github/workflows/rust.yml`
  - Rust CI checks currently enforced:
    - `cargo build`
    - `cargo test --locked`
    - `cargo clippy --all-targets --locked`
    - `cargo fmt -- --check`
- `www/package.json`
  - TypeScript/Web checks and scripts:
    - `npm run lint` -> `eslint .`
    - `npm run test:prettier` -> `prettier --check src/*.ts?`
    - `npm test` -> `jest`
- `.github/workflows/test-ts.yml`
  - TypeScript CI checks in `www/`:
    - `npm ci`
    - `npm run lint`
    - `npm run test:prettier`
    - `npm test -- --bail --maxWorkers=100% --watchAll=false --coverage`
- `.gitignore`
  - Existing ignore policy; useful to confirm formatting and generated files handling.
- (Missing currently) `.pre-commit-config.yaml`

## Existing Hook and Git Hook Infrastructure
- `.pre-commit-config.yaml`: not present.
- `.git/hooks/pre-commit`: not present.
- `core.hooksPath` git config: unset.

## Execution Flow and Call Graph (Current)
- Local developer commits currently do not trigger repository-managed automated checks.
- Quality gates run in CI only:
  - Push/PR -> GitHub Actions workflows (`rust.yml`, `test-ts.yml`) execute language-specific checks.
- Therefore local feedback loop before commit is manual (developer must run tools explicitly).

## Data Structures and Invariants
- There is no existing pre-commit configuration schema in-repo.
- CI implies these quality invariants are intended:
  - Rust code should remain formatted (`cargo fmt --check`).
  - Rust code should be warning-clean under clippy settings used by CI.
  - TypeScript code should pass ESLint.
  - Targeted TS formatting (`src/*.ts?`) should pass Prettier check.
- Any future pre-commit config should avoid violating existing command assumptions (working directory differences between root and `www/`).

## Existing Architectural Patterns and Conventions
- Repository is polyglot:
  - Rust at repository root.
  - TypeScript frontend under `www/`.
- CI check separation by language/workflow file.
- Existing npm scripts indicate preferred command entrypoints for TS checks.
- GitHub Actions pin policy in this repo uses trusted first-party actions by tag (`actions/*@v6`) and third-party by tag (`dtolnay/rust-toolchain@stable`).

## Naming and Style Conventions
- YAML files and workflow naming are descriptive and concise.
- Script names in `www/package.json` are explicit (`lint`, `test:prettier`, `test`).
- Root README is concise and mostly Japanese text; no current pre-commit setup instructions.

## Error Handling and Operational Constraints
- Pre-commit runs from repository root by default; hooks must account for subdirectory tooling (`www`).
- Heavy hooks may degrade commit UX if they run full test suites.
- Existing skill constraints for pre-commit in this environment require:
  - Minimal, low-cost checks first.
  - Prefer repo-based hooks where feasible.
  - Pin hook repositories to immutable commit hashes.

## Typing and Tooling Conventions
- Rust: stable toolchain in CI with clippy/rustfmt.
- TS: npm + eslint/prettier/jest.
- No evidence of alternative hook frameworks (lefthook/husky) currently in use.

## Potential Pitfalls
- Duplicating expensive CI checks in pre-commit may slow commits excessively.
- Running `npm`-based checks from root without path handling may fail if hook config assumes `www/` cwd.
- Overly broad formatting hooks could modify generated artifacts unintentionally.
- If pre-commit is not installed locally, config addition alone does not activate hooks.

## Constraints
- Follow issue scope only: add pre-commit config (single logical change).
- Keep behavior aligned with existing CI policies.
- Avoid introducing unrelated refactors.

## Unknowns
- Exact desired hook breadth (minimal hygiene only vs language-specific lint/format checks).
- Whether user wants accompanying README note or only config file.
- Whether local environment has `pre-commit` installed.
