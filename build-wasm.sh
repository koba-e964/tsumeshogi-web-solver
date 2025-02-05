#!/bin/bash
set -eux

# Prerequisites:
# - wasm-pack
# - wasm-opt

export RUSTFLAGS="-C target-feature=+simd128"
wasm-pack -v build \
    --out-dir www/dist \
    --target no-modules \
    --mode no-install
