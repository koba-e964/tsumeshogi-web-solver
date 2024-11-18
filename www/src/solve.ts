import { Branches } from "./branches";
import { err, ok, Result } from "neverthrow";

type solveType = (sfen: string, timeout_ms: number) => Promise<Branches>;

var wasmSolve: solveType | undefined = undefined;

export function setWasmSolve(solve: solveType): void {
  wasmSolve = solve;
}

export default async function solve(
  sfen: string
): Promise<Result<Branches, Error>> {
  if (wasmSolve === undefined) {
    return err(new Error("Wasm is not loaded yet"));
  }
  // TODO: make asynchronous (appears to stop main thread)
  const result = await wasmSolve(sfen, 1000);
  console.log(result);
  if (result instanceof Error) {
    return err(result);
  }
  if (!(result instanceof Array)) {
    return err(new Error("Unexpected result"));
  }
  return ok(result);
}
