import { createRoot } from "react-dom/client";
import React from "react";
import WholePlayer from "./whole_player";
import { err, ok, Result } from "neverthrow";
import { Answer } from "./branches";

// https://github.com/sugyan/tsumeshogi-solver-wasm/blob/32d0a58614ea0884c361156ba3fb02642ef29775/www/index.js#L1-L9
const worker = new Worker(new URL("./worker.ts", import.meta.url));

export async function solveWithWorker(
  sfen: string,
): Promise<Result<Answer, Error>> {
  console.log("solveWithWorker");
  return new Promise((resolve) => {
    worker.onmessage = (ev: MessageEvent<string>) => {
      // https://stackoverflow.com/questions/31953296/how-to-pass-custom-class-instances-through-web-workers
      const unmarshaled = JSON.parse(ev.data);
      if ("value" in unmarshaled) {
        resolve(ok(unmarshaled.value));
      } else {
        resolve(err(unmarshaled.err));
      }
    };
    worker.postMessage(sfen);
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WholePlayer />
  </React.StrictMode>,
);
