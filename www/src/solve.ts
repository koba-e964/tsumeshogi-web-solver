import { Branches } from "./branches";
import { err, ok, Result } from "neverthrow";

var wasmSolve: ((sfen: string) => Branches) | undefined = undefined;

export function setWasmSolve(solve: (sfen: string) => Branches): void {
  wasmSolve = solve;
}

export default async function solve(
  sfen: string
): Promise<Result<Branches, Error>> {
  if (wasmSolve === undefined) {
    return err(new Error("Wasm is not loaded yet"));
  }
  // TODO: make asynchronous (appears to stop main thread)
  const result = wasmSolve(sfen);
  console.log(result);
  if (result instanceof Error) {
    return err(result);
  }
  if (!(result instanceof Array)) {
    return err(new Error("Unexpected result"));
  }
  return ok(result);
}
