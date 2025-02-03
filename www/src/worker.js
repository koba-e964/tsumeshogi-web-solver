import solve, { setWasmSolve } from "./solve";
import init, { solve as solveWasm } from "../../pkg";

// https://github.com/rustwasm/wasm-bindgen/issues/3306#issuecomment-1434755209
// https://rustwasm.github.io/docs/wasm-bindgen/examples/without-a-bundler.html
init().then((_) => setWasmSolve(solveWasm));
console.log("init in worker done");

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
onmessage = async (e) => {
  console.log("Message received from main script");
  console.log(e);
  const sfen = e.data;
  if (typeof sfen === "object" && "type" in sfen) {
    self.postMessage(undefined);
    return;
  }
  if (sfen === undefined) {
    return;
  }
  console.log("sfen = ", sfen);
  const workerResult = await solve(sfen);
  console.log("Posting message back to main script");
  console.log(workerResult);
  console.log(workerResult.isOk());
  self.postMessage(JSON.stringify(workerResult));
};
/*

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
self.onconnect = (e) => {
  const port = e.ports[0];
  console.log("Worker received a connection on port");

  port.onmessage = async (e) => {
    console.log("Message received from main script");
    const workerResult = await solve(e.data);
    console.log("Posting message back to main script");
    postMessage(workerResult);
  };
};*/
