import solve, { setWasmSolve } from "./solve";
import init, { solve as solveWasm } from "../../pkg";
import { Result } from "neverthrow";
import { Answer } from "./branches";

// https://github.com/rustwasm/wasm-bindgen/issues/3306#issuecomment-1434755209
// https://rustwasm.github.io/docs/wasm-bindgen/examples/without-a-bundler.html
init().then((_: unknown) => setWasmSolve(solveWasm));
console.log("init in worker done");

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
onmessage = async (e: MessageEvent): Promise<void> => {
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
  const workerResult: Result<Answer, Error> = await solve(sfen);
  console.log("Posting message back to main script");
  console.log(workerResult);
  console.log(workerResult.isOk());
  self.postMessage(JSON.stringify(workerResult));
};
