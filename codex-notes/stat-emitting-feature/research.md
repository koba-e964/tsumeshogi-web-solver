# Research: Stat Emission From `mate_solver`

## Relevant Files And Modules

- `Cargo.toml`
  - Depends on `mate_solver` from `https://github.com/rust-shogi-crates/shogi_mate_solver`.
  - `Cargo.lock` pins `mate_solver` to commit `bfcb3c73c88ba30fb8457d7dd67fb5cbcd6681b5`, matching the local sibling checkout at `../shogi_mate_solver`.
- `src/lib.rs`
  - Wasm boundary for the web app.
  - Calls `mate_solver::search(&position, timeout_ms as u64)`.
  - Serializes a local `Answer { branches, elapsed_ms }` to JavaScript via `serde_wasm_bindgen`.
  - Converts `mate_solver::BranchEntry` and `mate_solver::Eval` into local serializable structs.
- `www/src/branches.ts`
  - Defines the TypeScript `Answer` type consumed by the React UI.
  - Current shape is `{ branches: Branches; elapsed_ms: number }`.
- `www/src/solve.ts`
  - Wraps the wasm `solve` function and returns `Result<Answer, Error>`.
  - Logs the raw wasm result to the console.
- `www/src/worker.ts` and `www/src/index.tsx`
  - Move wasm solving into a web worker.
  - Marshal `neverthrow` results through JSON.
- `www/src/whole_player.tsx`
  - Stores the `Answer` JSON in `jsonOutput`.
  - Displays the full serialized result in the "JSON output" textarea.

Relevant upstream `mate_solver` files in the sibling checkout:

- `../shogi_mate_solver/mate_solver/src/lib.rs`
  - Public root API defines `Answer`, `OkType`, `ErrType`, `Resolution`, `BranchEntry`, `Eval`, and `search`.
  - `search` orchestrates:
    - Create `DfPnTable`.
    - Run `dfpnsearch::df_pn`.
    - If mate remains possible, create `EvalTable`.
    - Run `evalsearch::search`.
    - If mate, run private `find_branches` to create branch data.
  - The root `Answer` currently contains `inner` and `elapsed`; it does not expose search stats.
- `../shogi_mate_solver/mate_solver/src/df_pn/search.rs`
  - Defines `pub struct SearchStats { pub positions_inspected: u64 }`.
  - Provides `pub fn df_pn_with_stats(..., stats: &mut SearchStats)`.
  - Existing `df_pn` delegates to `df_pn_with_stats` with a default temporary stats object.
- `../shogi_mate_solver/mate_solver/src/eval/search.rs`
  - Defines `pub struct SearchStats { pub positions_inspected: u64 }`.
  - Provides `pub fn search_with_stats(..., stats: &mut SearchStats, df_pn_stats: &mut crate::df_pn::search::SearchStats)`.
  - Existing `search` delegates to `search_with_stats` with default temporary stats objects.
  - `alpha_beta_*_with_stats` increments eval positions and also passes `df_pn_stats` into lower-level df-pn calls.

## Execution Flow And Call Graph

Current web flow:

1. UI calls `solveWithWorker(initialSfen)` in `www/src/whole_player.tsx`.
2. `solveWithWorker` posts the SFEN to `www/src/worker.ts`.
3. `worker.ts` calls `www/src/solve.ts`.
4. `solve.ts` calls wasm `solve(sfen, 1000)`.
5. Rust `src/lib.rs::solve` parses `"sfen " + sfen` into `PartialPosition`.
6. Rust calls `mate_solver::search`.
7. Successful `mate_solver` branches are converted into serializable branch objects.
8. Rust returns a JS value with `branches` and `elapsed_ms`.
9. Worker JSON-stringifies the `neverthrow` result.
10. UI parses it, updates branches, and prints the full JSON.

Upstream stats flow:

1. `df_pn_with_stats` increments `df_pn::search::SearchStats.positions_inspected` in `mid_with_stats`.
2. `eval::search_with_stats` increments `eval::search::SearchStats.positions_inspected` in both attacker and defender alpha-beta functions.
3. `eval::search_with_stats` also passes the same df-pn stats object into nested df-pn searches.
4. Root `mate_solver::search` does not retain or return these stats because it calls the non-stats wrapper functions.
5. For this task, stats should cover only the top-level root solve, not the additional searches currently performed while constructing branches.

## Data Structures And Invariants

- Rust wasm `Answer` is local to `src/lib.rs` and is serialized with Serde.
- TypeScript `Answer` in `www/src/branches.ts` must match the serialized Rust shape.
- `BranchEntry::from_with_position` assumes `entry.moves` can be replayed from the initial position.
- `BranchEntry::from_with_position` uses `split_last().expect("mvs.len() >= 1 must hold")` only while mapping prefixes of non-empty `entry.moves`; the root branch with empty moves is allowed because the `moves.iter()` loop produces no prefixes.
- The UI depends on branch data being indexed by underscore-joined USI moves; adding top-level fields should not affect `branchDictFromBranches`.
- `serde_wasm_bindgen` will serialize Rust snake_case field names as snake_case unless annotations are added.
- `positions_inspected` should be serialized as a string, not a JavaScript number. JSON itself does not require numbers to be parsed as double-precision floats, but many JSON consumers do parse them that way, and `u64` counters can exceed exact JavaScript number precision.

## Existing Architectural Patterns

- The wasm boundary uses small local DTO structs instead of exporting upstream types directly.
- Errors are returned as `JsError` values and detected in TypeScript with `instanceof Error`.
- The UI already displays the entire `Answer` object as formatted JSON, so adding fields to `Answer` automatically makes them visible in the JSON output.
- TypeScript type maintenance is manual; wasm-generated `.d.ts` output is not part of the checked-in source.
- Changing `mate_solver` itself is in scope for this task, so this repo should not work around the missing root stats API by duplicating upstream solver orchestration locally.
- The intended emission surface is the returned answer JSON payload. Browser console logging and a separate visible stats UI are not part of the current requested behavior.

## Naming Conventions

- Rust serialized fields use snake_case: `elapsed_ms`, `possible_next_moves`, `num_moves`.
- TypeScript types mirror the wire shape using snake_case field names.
- Upstream stats types are both named `SearchStats`, scoped under `df_pn::search` and `eval::search`.
- The preferred stats payload shape is namespaced by subsystem:
  - `stats: { df_pn: { positions_inspected }, eval: { positions_inspected } }`
- A flattened shape such as `stats: { df_pn_positions_inspected, eval_positions_inspected }` is not preferred.

## Error Handling Patterns

- Invalid SFEN returns `JsError::new("Invalid SFEN").into()`.
- Upstream search errors are formatted with debug output: `JsError::new(&format!("error: {:?}", err)).into()`.
- Branch conversion panics on impossible invalid-move states, consistent with existing assumptions that upstream branches are valid.

## Typing Conventions

- Rust serializable DTOs derive `Serialize` and `Deserialize`.
- TypeScript has explicit structural types in `www/src/branches.ts`.
- `solveType` in `www/src/solve.ts` accepts a `Promise<Answer | Error>`.

## Potential Pitfalls

- Root `mate_solver::search` does not expose stats today. This project cannot get exact root-search stats just by changing its local DTO unless upstream `mate_solver` adds a stats-bearing root API or root `Answer` fields.
- Reimplementing root `mate_solver::search` orchestration in this repo would require access to private upstream `find_branches`; since it is private, duplicating orchestration would either omit branch generation or require copying logic and touching more upstream internals.
- If stats are added as `u64` and serialized directly, very large values may lose precision in JavaScript.
- If the answer shape changes without updating `www/src/branches.ts`, TypeScript callers will be stale even though runtime JSON may still work.
- The current `elapsed_ms` is always `0.0`; upstream `mate_solver::Answer.elapsed` is also currently `0.0`, so stats work should avoid implying elapsed timing is fixed unless explicitly in scope.
- `timeout_ms` is passed through but upstream currently ignores it; stats collection may make long-running behavior more visible but will not provide cancellation.
- Because stats should be root-solve-only, branch reconstruction must continue not contributing to the emitted counters unless upstream changes that behavior explicitly.

## Constraints

- Keep this PR to one logical change: expose and surface mate solver stats in this web app.
- Changing `mate_solver` is in scope, so the clean implementation path is to add root stats emission in `../shogi_mate_solver/mate_solver` first, then consume that API here.
- The upstream `mate_solver` change should be prepared as its own upstream PR.
- Once `mate_solver` exposes root stats, this project only needs DTO/type propagation and dependency revision handling.
- Emit stats in the returned answer JSON payload only.
- Count only the top-level root solve in emitted stats.
- Serialize `positions_inspected` as a string to avoid precision loss in JSON consumers that parse numbers as doubles.
- Network access is restricted; if dependency updates require fetching from GitHub, escalation may be required.

## Unknowns
