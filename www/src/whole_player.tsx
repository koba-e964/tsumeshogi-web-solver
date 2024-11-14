import React, { useEffect } from "react";
import Head from "next/head";
import { ShogiPlayer } from "shogi-player-webcomponents";
import { createComponent } from "@lit/react";
import "./App.css";
import { ReadKif } from "./kif_parse";
import * as sfenUtils from "./sfen";
import BranchSelector from "./branch_selector";
import { branchDictFromBranches, createSelectionData, Move } from "./branches";

const defaultSfen: string = "9/4k4/9/4P4/9/9/9/9/9 b 2G3r2b2g4s4n4l 1";

type PlayerUpdateEvent = {
  sfen: string;
};

async function sfenInputHandlerForUrl(pageUrl: string): Promise<void> {
  // TODO: display loading info when loading
  const sfen = await ReadKif(pageUrl);
  const dom = document.getElementById("shogi-player");
  dom?.setAttribute("sfen", sfen);
}

function sfenInputHandler(): void {
  const sfen = (document.getElementById("sfen-input") as HTMLTextAreaElement)
    .value;
  if (sfen.startsWith("https://")) {
    sfenInputHandlerForUrl(sfen);
    return;
  }
  const result = sfenUtils.isValidSfen(sfen);
  if (result.isErr()) {
    alert(result.error.message);
    return;
  }
  const dom = document.getElementById("shogi-player");
  dom?.setAttribute("sfen", sfen);
}

export default function WholePlayer({}): JSX.Element {
  // https://www.ai-shift.co.jp/techblog/3927
  const SP = createComponent({
    tagName: "shogi-player",
    elementClass: ShogiPlayer,
    react: React,
    events: {
      update: "update",
    },
  });
  const params = new URLSearchParams(location.search);
  let sfenParam = params.get("sfen") || defaultSfen;
  if (sfenUtils.isValidSfen(sfenParam).isErr()) {
    sfenParam = defaultSfen;
  }
  const [sfen, setSfen] = React.useState(sfenParam);
  useEffect(() => {
    const dom = document.getElementById("shogi-player");
    // You need to set sfen after the component is mounted.
    // For example, if you give an sfen string to the component directly, it will not be reflected.
    dom?.setAttribute("sfen", sfen);
  });

  const move0 = { usi: "G*5c", official_kifu: "▲５三金" };
  const move00 = { usi: "5b6a", official_kifu: "△６一玉" };
  const move01 = { usi: "5b5a", official_kifu: "△５一玉" };
  const move02 = { usi: "5b4a", official_kifu: "△４一玉" };
  const move000 = { usi: "G*6b", official_kifu: "▲６二金打" };
  const move010 = { usi: "G*5b", official_kifu: "▲５二金打" };
  const move020 = { usi: "G*4b", official_kifu: "▲４二金打" };
  const mateEval = { num_moves: 0, pieces: 0, futile: 0 };
  const branches = [
    {
      moves: [],
      possible_next_moves: [move0],
      eval: null,
    },
    {
      moves: [move0],
      possible_next_moves: [move00, move01, move02],
      eval: null,
    },
    {
      moves: [move0, move00],
      possible_next_moves: [move000],
      eval: mateEval,
    },
    {
      moves: [move0, move01],
      possible_next_moves: [move010],
      eval: mateEval,
    },
    {
      moves: [move0, move02],
      possible_next_moves: [move020],
      eval: mateEval,
    },
  ];
  const [plyIndex, setPlyIndex] = React.useState(0);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [selectionData, setSelectionData] = React.useState(
    createSelectionData(branches)
  );
  console.log(selectionData.dict);
  const branchDict = branchDictFromBranches(branches);
  const mainstream: Move[] = [];
  {
    console.log(mainstream);
    for (let i = 0; i < 100; i++) {
      const index = selectionData.get(mainstream);
      if (
        !branchDict.get(mainstream) ||
        index >= branchDict.get(mainstream).possible_next_moves.length
      ) {
        break;
      }
      const move = branchDict.get(mainstream).possible_next_moves[index];
      mainstream.push(move);
    }
  }

  return (
    <div className="whole-page">
      <Head>
        <title>詰将棋 Web ソルバー</title>
      </Head>
      <h1>詰将棋 Web ソルバー</h1>
      <div className="whole-player">
        <SP
          id="shogi-player"
          className="shogi-player left"
          mode="edit"
          update={(e: CustomEvent<PlayerUpdateEvent>) => {
            setSfen(e.detail.sfen);
            window.history.replaceState(
              null,
              "",
              `?${new URLSearchParams({ sfen: e.detail.sfen }).toString()}`
            );
          }}
        />
        <BranchSelector
          branches={branches}
          mainstream={mainstream}
          plyIndex={plyIndex}
          selectedIndex={selectedIndex}
          plyHandler={(plyIndex: number) => {
            console.log(plyIndex);
            setPlyIndex(plyIndex);
          }}
          selectHandler={(selectedIndex: number) => {
            console.log(selectedIndex);
            const moves = mainstream.slice(0, plyIndex - 1);
            setSelectionData(selectionData.update(moves, selectedIndex));
            setSelectedIndex(selectedIndex);
            console.log(selectionData.dict);
          }}
        />
        <div>
          手番: {sfen.split(" ")[1] === "b" ? "▲先手" : "△後手"}
          <br />
          <button
            onClick={() => {
              setSfen(sfenUtils.sfenChangePlayer(sfen));
            }}
          >
            手番変更
          </button>
        </div>
        <div>
          双玉詰将棋:{" "}
          {sfenUtils.sfenAreBothKingsPresent(sfen) ? "有効" : "無効"}
          <br />
          <button
            onClick={() => {
              if (sfenUtils.sfenAreBothKingsPresent(sfen)) {
                setSfen(sfenUtils.sfenRemoveBlackKing(sfen));
                return;
              } else {
                setSfen(sfenUtils.sfenAddBlackKing(sfen));
              }
              return;
            }}
          >
            双玉詰将棋にする/やめる
          </button>
        </div>
      </div>
      <div className="sfen-area">
        SFEN: <textarea id="sfen" readOnly value={sfen} rows={1} cols={80} />{" "}
        <br />
        SFEN/URL input: <textarea id="sfen-input" rows={1} cols={80} />{" "}
        <button onClick={sfenInputHandler}>Set SFEN/URL</button>
        <br />
      </div>
      <div>
        JSON output: <br />
        <textarea id="json-output" readOnly rows={10} cols={80} />
      </div>
    </div>
  );
}

export async function getStaticProps(): Promise<{ props: {} }> {
  return {
    props: {},
  };
}
