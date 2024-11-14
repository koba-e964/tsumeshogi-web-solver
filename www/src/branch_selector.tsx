import React, { ChangeEvent } from "react";
import { branchDictFromBranches, Branches, Move } from "./branches";

export default function BranchSelector({
  branches,
  mainstream,
  plyIndex,
  selectedIndex,
  plyHandler,
  selectHandler,
}: BranchSelectorProps): JSX.Element {
  const dict = branchDictFromBranches(branches);
  const plyList = [];
  for (let i = 0; i < mainstream.length + 1; i++) {
    const text = i == 0 ? "初期局面" : mainstream[i - 1].official_kifu;
    plyList.push(
      <option value={`${i}`} key={`move_${i}`}>
        {text}
      </option>
    );
  }
  const branchList = [];
  if (plyIndex > 0) {
    const moves = mainstream.slice(0, plyIndex - 1);
    const entry = dict.get(moves);
    for (let i = 0; i < entry.possible_next_moves.length; i++) {
      branchList.push(
        <option value={`${i}`} key={`branch_${i}`}>
          {entry.possible_next_moves[i].official_kifu}
        </option>
      );
    }
  }
  return (
    <div className="boards-control-panel">
      <select
        size={10}
        defaultValue={plyIndex}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          plyHandler(parseInt(event.target.value))
        }
      >
        <option value="select" disabled>
          --指し手を選択--
        </option>
        {plyList}
      </select>
      <select
        size={10}
        defaultValue={selectedIndex}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          selectHandler(parseInt(event.target.value))
        }
      >
        <option value="select" disabled>
          --分岐を選択--
        </option>
        {branchList}
      </select>
    </div>
  );
}

type BranchSelectorProps = {
  branches: Branches;
  mainstream: Move[];
  plyIndex: number;
  selectedIndex: number;
  plyHandler: (plyIndex: number) => void;
  selectHandler: (selectedIndex: number) => void;
};
