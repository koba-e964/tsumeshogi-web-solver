import React, { useEffect } from "react";
import Head from "next/head";
import { ShogiPlayer } from "shogi-player-webcomponents";
import { createComponent } from "@lit/react";
import "./App.css";
import { ReadKif } from "./kif_parse";
import * as sfenUtils from "./sfen";
import BranchSelector from "./branch_selector";
import {
  branchDictFromBranches,
  Branches,
  createSelectionData,
  Move,
} from "./branches";
import solve from "./solve";

const defaultSfen: string = "9/4k4/9/4P4/9/9/9/9/9 b 2G2r2b2g4s4n4l17p 1";

const enum Mode {
  Editing,
  Solving,
  Viewing,
}

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
  const [initialSfen, setInitialSfen] = React.useState(sfenParam);
  const [mode, setMode] = React.useState(Mode.Editing);

  const [branches, setBranches] = React.useState<Branches>([]);
  const [plyIndex, setPlyIndex] = React.useState(0);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [selectionData, setSelectionData] = React.useState(
    createSelectionData(branches)
  );
  const branchDict = branchDictFromBranches(branches);
  const mainstream: Move[] = [];
  {
    while (true) {
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

  const [jsonOutput, setJsonOutput] = React.useState("");

  useEffect(() => {
    const dom = document.getElementById("shogi-player");
    // You need to set sfen after the component is mounted.
    // For example, if you give an sfen string to the component directly, it will not be reflected.
    if (mode === Mode.Viewing) {
      const alteredSfen = sfenUtils.makeMoves(
        initialSfen,
        mainstream.slice(0, plyIndex).map((move) => move.usi)
      );
      dom?.setAttribute("sfen", alteredSfen);
    } else if (mode === Mode.Editing) {
      dom?.setAttribute("sfen", initialSfen);
    } else {
      if (mode !== Mode.Solving) {
        throw new Error("Invalid mode");
      }
      dom?.setAttribute("sfen", initialSfen);
      (async () => {
        const result = await solve(initialSfen);
        const jsonString = JSON.stringify(result, null, 2);
        setJsonOutput(jsonString);
        if (result.isErr()) {
          alert(result.error.message);
          setMode(Mode.Editing);
          return;
        }
        const branches = result.value;
        setBranches(branches);
        setSelectionData(createSelectionData(branches));
        setMode(Mode.Viewing);
      })();
    }
  });

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
          mode={mode === Mode.Editing ? "edit" : "show"}
          update={(e: CustomEvent<PlayerUpdateEvent>) => {
            if (mode === Mode.Editing) {
              setInitialSfen(e.detail.sfen);
              window.history.replaceState(
                null,
                "",
                `?${new URLSearchParams({ sfen: e.detail.sfen }).toString()}`
              );
            }
          }}
        />
        <BranchSelector
          branches={branches}
          mainstream={mainstream}
          plyIndex={plyIndex}
          selectedIndex={selectedIndex}
          plyHandler={(plyIndex: number) => {
            setPlyIndex(plyIndex);
          }}
          selectHandler={(selectedIndex: number) => {
            const moves = mainstream.slice(0, plyIndex - 1);
            setSelectionData(selectionData.update(moves, selectedIndex));
            setSelectedIndex(selectedIndex);
          }}
        />
        <div>
          手番: {initialSfen.split(" ")[1] === "b" ? "▲先手" : "△後手"}
          <br />
          <button
            disabled={mode !== Mode.Editing}
            onClick={() => {
              setInitialSfen(sfenUtils.sfenChangePlayer(initialSfen));
            }}
          >
            手番変更
          </button>
        </div>
        <div>
          双玉詰将棋:{" "}
          {sfenUtils.sfenAreBothKingsPresent(initialSfen) ? "有効" : "無効"}
          <br />
          <button
            disabled={mode !== Mode.Editing}
            onClick={() => {
              if (sfenUtils.sfenAreBothKingsPresent(initialSfen)) {
                setInitialSfen(sfenUtils.sfenRemoveBlackKing(initialSfen));
                return;
              } else {
                setInitialSfen(sfenUtils.sfenAddBlackKing(initialSfen));
              }
              return;
            }}
          >
            双玉詰将棋にする/やめる
          </button>
          {mode === Mode.Editing
            ? "編集モード"
            : mode === Mode.Solving
            ? "求解中…"
            : "手順閲覧モード"}
          <br />
          <button
            disabled={mode === Mode.Solving}
            onClick={() => {
              switch (mode) {
                case Mode.Viewing:
                  const alteredSfen = sfenUtils.makeMoves(
                    initialSfen,
                    mainstream.slice(0, plyIndex).map((move) => move.usi)
                  );
                  setBranches([]);
                  setPlyIndex(0);
                  setSelectedIndex(0);
                  setSelectionData(createSelectionData([]));
                  setInitialSfen(alteredSfen);
                  setMode(Mode.Editing);
                  break;
                case Mode.Editing:
                  setMode(Mode.Solving);
                  break;
                case Mode.Solving:
                  break;
              }
            }}
          >
            {mode === Mode.Editing ? "解く" : "編集モードにする"}
          </button>
        </div>
      </div>
      <div className="sfen-area">
        SFEN:{" "}
        <textarea id="sfen" readOnly value={initialSfen} rows={1} cols={80} />{" "}
        <br />
        SFEN/URL input: <textarea id="sfen-input" rows={1} cols={80} />{" "}
        <button onClick={sfenInputHandler}>Set SFEN/URL</button>
        <br />
      </div>
      <div>
        JSON output: <br />
        <textarea
          id="json-output"
          readOnly
          value={jsonOutput}
          rows={20}
          cols={80}
        />
      </div>
    </div>
  );
}

export async function getStaticProps(): Promise<{ props: {} }> {
  return {
    props: {},
  };
}
