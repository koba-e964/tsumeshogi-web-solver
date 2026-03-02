# Research: wasm size shrink

## Task scope
Shrink the generated Rust WebAssembly artifact (`tsumeshogi_web_solver_bg.wasm`), currently around 140 KB.

## Baseline measurement
- Build command used for baseline:
  - `wasm-pack build --target web --out-dir /tmp/wasm-baseline --release --quiet`
- Measured artifact sizes:
  - `/tmp/wasm-baseline/tsumeshogi_web_solver_bg.wasm`: **133 KB**
  - `/tmp/wasm-baseline/tsumeshogi_web_solver.js`: 14 KB
- This aligns with the reported approximately 140 KB size.

## Relevant files and modules
- Rust crate and build config:
  - `Cargo.toml`
  - `src/lib.rs`
  - `build-wasm.sh`
- Frontend integration and wasm call path:
  - `www/webpack.config.js`
  - `www/src/worker.ts`
  - `www/src/solve.ts`
  - `www/src/index.tsx`
- CI workflows touching wasm build:
  - `.github/workflows/rust.yml`
  - `.github/workflows/gh-pages.yml`

## Execution flow and call graph
1. Frontend creates a Web Worker (`www/src/index.tsx`).
2. Worker initializes wasm package (`www/src/worker.ts`):
   - `import init, { solve as solveWasm } from "../../pkg"`
   - `init().then(setWasmSolve)`
3. Worker message handler invokes `solve(sfen)` from `www/src/solve.ts`.
4. `www/src/solve.ts` calls wasm-exported `solve(sfen, timeout_ms)`.
5. Rust `src/lib.rs`:
   - Parses SFEN (`PartialPosition::from_usi`)
   - Calls `mate_solver::search`
   - Converts results into serializable structures
   - Returns via `serde_wasm_bindgen::to_value`

## Data structures and invariants
- Rust result model:
  - `Answer { branches, elapsed_ms }`
  - `BranchEntry { moves, possible_next_moves, eval }`
  - `JsMove { usi, official_kifu }`
  - `Eval { num_moves, pieces, futile }`
- Invariants in current implementation:
  - Branch move list is non-empty where `split_last()` is used.
  - Moves are validated during replay (`make_move(...).is_none()` considered invalid).
  - Invalid SFEN returns JS Error.

## Existing architectural patterns
- Rust exports a wasm-bindgen function (`#[wasm_bindgen] pub async fn solve(...) -> JsValue`).
- JS/TS communicates through a Worker and serializes result back to main thread.
- Webpack builds TS app and triggers Rust build via `@wasm-tool/wasm-pack-plugin`.

## Naming and typing conventions
- Rust uses strongly typed internal structs, conversion through `From` where applicable.
- TS uses explicit `Promise<Result<...>>` for worker-facing API.
- wasm function type is currently promise-like due async export usage.

## Error handling patterns
- Rust:
  - Input parse failure returns `JsError`.
  - Internal conversion uses `unwrap`/`expect` in several places.
- TS:
  - Wraps wasm response in `neverthrow` (`ok/err`).
  - Worker transfers JSON stringified result.

## Dependency graph findings relevant to size
From `cargo tree --target wasm32-unknown-unknown -e normal -i ...`:
- `wasm-timer` is included only because this crate depends on it directly.
- `wasm-bindgen-futures` is included directly and also via `wasm-timer`.
- `parking_lot` is included directly and also via `wasm-timer`.
- `js-sys` is included directly and transitively through other wasm crates.

Observed in source:
- `src/lib.rs` no longer uses `wasm_timer` (timing lines are commented out).
- `src/lib.rs` imports no items from `js-sys`, `wasm-bindgen-futures`, or `parking_lot` directly.

## Build and optimization configuration state
- `Cargo.toml` has:
  - `[profile.release] opt-level = "z"`
- `Cargo.toml` has only profiling metadata for wasm-pack:
  - `[package.metadata.wasm-pack.profile.profiling] wasm-opt = ['-O', '--debuginfo']`
- No explicit release profile settings for:
  - `panic = "abort"`
  - `lto`
  - `codegen-units = 1`
  - `strip = ...`
- `build-wasm.sh` sets SIMD target feature in `RUSTFLAGS` and runs `wasm-pack`.
- Webpack wasm-pack plugin uses `extraArgs: "--target web"` and otherwise defaults.

## Constraints
- Output API contract must remain compatible with worker integration.
- Build must continue working under current toolchain and CI workflows.
- Any size optimization should avoid semantic regressions in solving logic.

## Potential pitfalls
- Changing exported function sync/async shape may alter generated JS bindings and TS expectations.
- Aggressive flags may interact with wasm-pack defaults and wasm-opt compatibility.
- Removing direct dependencies that are indirectly relied upon by macro-generated glue must be validated by full build/test.

## Unknowns
- No per-symbol wasm size attribution currently available because `twiggy top` panics on the generated artifact in this environment.
- Exact impact of each optimization lever must be validated by measured rebuilds.
