import { Branches } from "./branches";
import { err, ok, Result } from "neverthrow";

const exampleSfen: string = "9/4k4/9/4P4/9/9/9/9/9 b 2G2r2b2g4s4n4l17p 1";

function exampleBranches(): Branches {
  const move0 = { usi: "G*5c", official_kifu: "▲５三金" };
  const move00 = { usi: "5b6a", official_kifu: "△６一玉" };
  const move01 = { usi: "5b5a", official_kifu: "△５一玉" };
  const move02 = { usi: "5b4a", official_kifu: "△４一玉" };
  const move000 = { usi: "G*6b", official_kifu: "▲６二金打" };
  const move010 = { usi: "G*5b", official_kifu: "▲５二金打" };
  const move020 = { usi: "G*4b", official_kifu: "▲４二金打" };
  const mateEval = { num_moves: 0, pieces: 0, futile: 0 };
  const oneEval = { num_moves: 1, pieces: 1, futile: 0 };
  const twoEval = { num_moves: 2, pieces: 1, futile: 0 };
  const branches = [
    {
      moves: [],
      possible_next_moves: [move0],
      eval: { num_moves: 3, pieces: 2, futile: 0 },
    },
    {
      moves: [move0],
      possible_next_moves: [move00, move01, move02],
      eval: twoEval,
    },
    {
      moves: [move0, move00],
      possible_next_moves: [move000],
      eval: oneEval,
    },
    {
      moves: [move0, move01],
      possible_next_moves: [move010],
      eval: oneEval,
    },
    {
      moves: [move0, move02],
      possible_next_moves: [move020],
      eval: oneEval,
    },
    {
      moves: [move0, move00, move000],
      possible_next_moves: [],
      eval: mateEval,
    },
    {
      moves: [move0, move01, move010],
      possible_next_moves: [],
      eval: mateEval,
    },
    {
      moves: [move0, move02, move020],
      possible_next_moves: [],
      eval: mateEval,
    },
  ];
  return branches;
}

export default async function solve(
  sfen: string
): Promise<Result<Branches, Error>> {
  if (sfen === exampleSfen) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // simulate computation time
    return ok(exampleBranches());
  }
  return err(new Error("Not implemented"));
}
