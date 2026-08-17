# Plan: Stat Emission From `mate_solver`

## Overview

Add root-solve stats emission to upstream `mate_solver`, then propagate those stats through this web solver's wasm answer and TypeScript answer type.

The emitted payload is returned in the answer JSON only. No browser console logging or separate visible stats UI is in scope.

Stats shape:

```json
{
  "stats": {
    "df_pn": { "positions_inspected": "123" },
    "eval": { "positions_inspected": "456" }
  }
}
```

`positions_inspected` is serialized as a string to avoid precision loss in JSON consumers that parse numbers as doubles.

Stats count only the top-level root solve. The extra searches used during branch reconstruction must not contribute to emitted counters.

## Files To Change

Upstream `mate_solver`:

- `mate_solver/src/lib.rs`
  - Add public root stats structs.
  - Add `stats` to root `Answer`.
  - Collect stats in `search` for the top-level df-pn and eval calls only.
  - Leave `find_branches` using the existing non-stats wrappers so branch reconstruction does not affect emitted stats.
- Upstream PR
  - Commit and push the upstream `mate_solver` branch.
  - Create an upstream PR for the root stats API change before updating this repo back to the git dependency revision.

This repo:

- `Cargo.toml`
  - During local integration, point `mate_solver` at the upstream worktree if needed.
  - After the upstream commit is available, consume the git dependency revision again.
- `Cargo.lock`
  - Update the pinned `mate_solver` revision after upstream is committed.
- `src/lib.rs`
  - Add serializable local stats DTOs.
  - Add `stats` to wasm `Answer`.
  - Convert upstream `answer.stats` into string-valued wasm stats.
- `www/src/branches.ts`
  - Add matching TypeScript stats types with string `positions_inspected`.
- `codex-notes/stat-emitting-feature/feature_list.json`
  - Track implementation progress.

## Worktree And Branch

- Web solver worktree: `../tsumeshogi-web-solver-worktrees/stat-emitting-feature`
- Web solver branch: `stat-emitting-feature`
- Upstream mate-solver worktree: `../shogi_mate_solver-worktrees/stat-emitting-feature`
- Upstream mate-solver branch: `stat-emitting-feature`

## Detailed Implementation Steps

1. Create the upstream `mate_solver` worktree from its current `main`.
2. In upstream `mate_solver/src/lib.rs`, add public root stats structs, likely:

```rust
#[derive(Clone, Copy, Debug, Default)]
pub struct SearchStats {
    pub df_pn: DfPnStats,
    pub eval: EvalStats,
}

#[derive(Clone, Copy, Debug, Default)]
pub struct DfPnStats {
    pub positions_inspected: u64,
}

#[derive(Clone, Copy, Debug, Default)]
pub struct EvalStats {
    pub positions_inspected: u64,
}
```

3. Add `pub stats: SearchStats` to upstream `Answer`.
4. In upstream `search`, allocate `df_pn::search::SearchStats` and `eval::search::SearchStats` before the root solve calls.
5. Replace only the top-level calls:
   - `dfpnsearch::df_pn` -> `dfpnsearch::df_pn_with_stats`
   - `evalsearch::search` -> `evalsearch::search_with_stats`
6. Convert the internal stats into the public root `SearchStats` and include that value in every `Answer` return path.
7. Do not thread stats into `find_branches`; this preserves the root-solve-only counter scope.
8. Validate upstream with `cargo fmt` and `cargo test`.
9. Commit, push, and open the upstream `mate_solver` PR for the root stats API.
10. Update this repo to consume the new upstream API.
11. In `src/lib.rs`, add serde DTOs:
    - `Stats`
    - `DfPnStats`
    - `EvalStats`
12. Set `Answer.stats` in the success payload, converting each `u64` counter with `.to_string()`.
13. In `www/src/branches.ts`, add `stats: Stats` to `Answer`; `positions_inspected` fields are `string`.
14. Validate this repo with:
    - `cargo test`
    - `cd www && npm run lint`
    - `cd www && npm run test:prettier`
    - `cd www && npm run build`
15. Smoke check a sample solve and confirm JSON includes string-valued `stats.df_pn.positions_inspected` and `stats.eval.positions_inspected`.

## Alternatives Considered

- Reimplement root `mate_solver::search` locally.
  - Rejected because `mate_solver` changes are in scope and duplicating private branch reconstruction logic here would be unnecessary coupling.
- Count branch reconstruction work.
  - Rejected because the research now specifies top-level root solve only.
- Emit logs or a dedicated UI stats display.
  - Rejected because the requested surface is the returned answer JSON payload only.
- Serialize `positions_inspected` as JSON numbers.
  - Rejected because `u64` precision can be lost in common JSON consumers.

## Risks

- This spans two repositories; the upstream commit and this repo's dependency lock need to stay aligned.
- The web-solver PR depends on an upstream `mate_solver` PR landing or otherwise being intentionally consumed by git revision.
- Existing `timeout_ms` is still not enforced by upstream search, so stats emission does not imply cancellation behavior.
- Existing `elapsed_ms` remains `0.0`; this change should not suggest timing was fixed.
- The upstream root stats API should avoid leaking internal module stats types if those internals may change later.

## Test Strategy

- Upstream: `cargo test`
- Web Rust: `cargo test`
- Frontend: `cd www && npm run lint && npm run test:prettier && npm run build`
- Manual smoke: solve a known SFEN and inspect the returned JSON payload.

## Assumptions

- `mate_solver` changes are in scope.
- The upstream `mate_solver` change should be published as its own PR.
- Stats are returned in the answer JSON payload only.
- Stats count only the top-level root solve.
- `positions_inspected` is string-valued in the web JSON payload.

## Open Questions

- None.
