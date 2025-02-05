export type Answer = {
  branches: Branches;
  elapsed_ms: number;
};

export type Branches = BranchEntry[];

export type BranchEntry = {
  moves: Move[];
  possible_next_moves: Move[];
  eval: Eval | null;
};

export type Move = {
  usi: string;
  official_kifu: string;
};

export type Eval = {
  num_moves: number;
  pieces: number;
  futile: number;
};

export class BranchDict<T> {
  dict: { [underscoreConcatenatedMoves: string]: T };
  constructor(dict: { [underscoreConcatenatedMoves: string]: T }) {
    this.dict = dict;
  }
  get(moves: Move[]): T {
    return this.dict[moves.map((move) => move.usi).join("_")]!;
  }
  update(moves: Move[], value: T): BranchDict<T> {
    const key = moves.map((move) => move.usi).join("_");
    if (this.dict[key] === undefined) {
      throw new Error(`key not found: ${key}`);
    }
    const copied = { ...this.dict };
    copied[key] = value;
    return new BranchDict(copied);
  }
}

export function branchDictFromBranches(
  branches: Branches,
): BranchDict<BranchEntry> {
  const branchDict: { [underscoreConcatenatedMoves: string]: BranchEntry } = {};
  for (const branch of branches) {
    const underscoreConcatenatedMoves = branch.moves
      .map((move) => move.usi)
      .join("_");
    branchDict[underscoreConcatenatedMoves] = branch;
  }
  return new BranchDict(branchDict);
}

export function createSelectionData(branches: Branches): BranchDict<number> {
  const dict: { [underscoreConcatenatedMoves: string]: number } = {};
  for (const branch of branches) {
    const underscoreConcatenatedMoves = branch.moves
      .map((move) => move.usi)
      .join("_");
    dict[underscoreConcatenatedMoves] = 0;
  }
  return new BranchDict(dict);
}
