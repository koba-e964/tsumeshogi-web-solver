import { parseSfen } from "shogi-player-webcomponents/dist/sfen.js";
import { err, ok, Result } from "neverthrow";

export function isValidSfen(sfen: string): Result<null, Error> {
  try {
    parseSfen(sfen);
    return ok(null);
  } catch (e) {
    if (e instanceof Error) {
      return err(e);
    }
    return err(new Error(`Unknown error: ${e}`));
  }
}

export function sfenChangePlayer(sfen: string): string {
  const [board, turn, hand] = sfen.split(" ");
  return `${board} ${turn === "b" ? "w" : "b"} ${hand}`;
}

export function sfenAreBothKingsPresent(sfen: string): boolean {
  return sfen.includes("K") && sfen.includes("k");
}

export function sfenAddBlackKing(sfen: string): string {
  if (sfen.includes("K")) {
    alert("先手の玉がすでに配置されています");
    return sfen;
  }
  const [board, turn, hand, numMoves] = sfen.split(" ");
  return `${board} ${turn} K${hand}  ${numMoves}`;
}

export function sfenRemoveBlackKing(sfen: string): string {
  if (!sfen.includes("K")) {
    alert("先手の玉が配置されていません");
    return sfen;
  }
  const newSfen = sfen.replace("K", "");
  if (isValidSfen(newSfen).isErr()) {
    // the row containing K changes like 6K2 -> 612, which is fortunately fine for shogi-player
    return sfen.replace("K", "1");
  }
  return newSfen;
}
