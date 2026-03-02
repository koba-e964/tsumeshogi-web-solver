# Plan: wasm size shrink

## Overview
Use low-risk, high-impact size reductions first:
1. Remove currently-unused wasm-specific direct dependencies that pull additional code into the graph.
2. Tighten release profile for wasm size (`panic=abort`, single codegen unit, strip symbols).
3. Keep wasm-bindgen API contract stable to avoid frontend breakage.
4. Measure before/after wasm size with the same command used in research.

This approach avoids changing solver logic and minimizes regression risk while targeting binary footprint.

## Files to change
- `Cargo.toml`
- `src/lib.rs`

## Detailed implementation steps
1. Trim direct dependencies in `Cargo.toml`:
   - Remove:
     - `wasm-timer`
     - `wasm-bindgen-futures`
     - `js-sys`
     - `parking_lot`
   - Keep dependencies required by current code path:
     - `wasm-bindgen`
     - `serde-wasm-bindgen`
     - `mate_solver` and shogi crates.

2. Add release profile size settings in `Cargo.toml`:
   - Under `[profile.release]`, ensure:
     - `opt-level = "z"` (already present)
     - `panic = "abort"`
     - `codegen-units = 1`
     - `strip = "symbols"`
   - Do not force LTO in this patch due earlier toolchain conflict interaction (`embed-bitcode` vs `lto`) observed during probing.

3. Keep wasm API shape stable but remove unnecessary async state if possible without JS contract change:
   - In `src/lib.rs`, evaluate changing `pub async fn solve(...)` to sync `pub fn solve(...)` only if generated binding compatibility is preserved with current TS usage.
   - If compatibility uncertainty remains, keep function async to avoid frontend changes in this change set.

4. Build and measure:
   - Run baseline-equivalent build command:
     - `wasm-pack build --target web --out-dir /tmp/wasm-after --release --quiet`
   - Compare `/tmp/wasm-after/tsumeshogi_web_solver_bg.wasm` against baseline `133 KB`.

5. Sanity checks:
   - Run `cargo check --target wasm32-unknown-unknown --release`.
   - Run frontend build (`npm run build` in `www`) if dependencies are present.

## Alternatives considered
- Switch serialization away from `serde_wasm_bindgen` to manual `JsValue` construction.
  - Rejected for now: larger code churn and higher regression risk for uncertain net size win.
- Remove official kifu string generation.
  - Rejected: would change user-visible output semantics.
- Aggressive wasm-opt custom passes.
  - Rejected for now: environment-specific validator incompatibility was observed during probing, reducing reliability.

## Risks
- Removing direct dependencies could fail build if implicitly relied on elsewhere.
- `panic = abort` alters panic runtime behavior (acceptable for size-focused wasm builds, but still a behavior change).
- `strip = symbols` may reduce debugability in release artifact.

## Test strategy
- Compile-check for wasm target in release mode.
- Build wasm package with wasm-pack in release mode.
- Compare artifact size before/after.
- If frontend build is available, run webpack production build to ensure integration still succeeds.

## Assumptions
- User goal prioritizes smaller production wasm over release debug symbol availability.
- No external consumer depends on removed unused direct dependencies.
- CI does not require those removed deps for non-wasm targets.

## Open questions
- None blocking; proceed with low-risk subset first and report measured gain.

## Implementation Checklist
- [ ] Edit `Cargo.toml` to remove unused direct wasm deps.
- [ ] Add release profile size settings (`panic`, `codegen-units`, `strip`).
- [ ] Update `src/lib.rs` only if needed to reflect dependency removal/cleanup.
- [ ] Build wasm package in release mode and record artifact size.
- [ ] Run compile/build sanity checks and capture any regressions.
- [ ] Update checklist statuses in this file as tasks complete.
