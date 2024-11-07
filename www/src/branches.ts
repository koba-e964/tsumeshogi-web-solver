export type Branches = BranchEntry[];

export type BranchEntry = {
  moves: UsiMove[];
  possible_next_moves: UsiMove[];
  eval: Eval | null;
};

export type UsiMove = {
  usi: string;
  official_kifu: string;
};

export type Eval = {
  num_moves: number;
  pieces: number;
  futile: number;
};
