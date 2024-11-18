import { createRoot } from "react-dom/client";
import React from "react";
import WholePlayer from "./whole_player";
import { setWasmSolve } from "./solve";
import init, { solve } from "../../pkg";

// https://github.com/rustwasm/wasm-bindgen/issues/3306#issuecomment-1434755209
// https://rustwasm.github.io/docs/wasm-bindgen/examples/without-a-bundler.html
init().then((_) => setWasmSolve(solve));

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WholePlayer />
  </React.StrictMode>
);
