import React from "react";
import { Branches } from "./branches";

export default function BranchSelector({
  branches,
}: BranchSelectorProps): JSX.Element {
  return (
    <div className="boards-control-panel">
      <select size={10}>
        <option value="select">--指し手を選択--</option>
        <option value="move_0">▲７二飛</option>
      </select>
      <select size={10}>
        <option value="select">--分岐を選択--</option>
        <option value="branch_0">▲１二歩成</option>
        <option value="branch_0">▲１二歩不成</option>
        <option value="branch_1">▲１二竜</option>
      </select>
    </div>
  );
}

type BranchSelectorProps = {
  branches: Branches;
};
