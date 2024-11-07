import React, { useEffect } from "react";
import Head from "next/head";
import { ShogiPlayer } from "shogi-player-webcomponents";
import { parseSfen } from "shogi-player-webcomponents/dist/sfen.js";
import { createComponent } from "@lit/react";
import "./App.css";
import { ReadKif } from "./kif_parse";
import { err, ok, Result } from "neverthrow";

const defaultSfen: string = "8k/9/7+RP/9/9/9/9/9/9 b r2b4g4s4n4l17p 1";

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
  const result = isValidSfen(sfen);
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
  if (isValidSfen(sfenParam).isErr()) {
    sfenParam = defaultSfen;
  }
  const [sfen, setSfen] = React.useState(sfenParam);
  useEffect(() => {
    const dom = document.getElementById("shogi-player");
    // You need to set sfen after the component is mounted.
    // For example, if you give an sfen string to the component directly, it will not be reflected.
    dom?.setAttribute("sfen", sfen);
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
        <div className="boards-control-panel">
          <select size={10} className="right">
            <option value="select">--指し手を選択--</option>
            <option value="move_0">▲７二飛</option>
          </select>
          <select size={10} className="right">
            <option value="select">--分岐を選択--</option>
            <option value="move_0">▲１二歩成</option>
            <option value="move_0">▲１二竜</option>
          </select>
        </div>
        <div>
          手番: {sfen.split(" ")[1] === "b" ? "▲先手" : "△後手"}
          <br />
          <button
            onClick={() => {
              setSfen(sfenChangePlayer(sfen));
            }}
          >
            手番変更
          </button>
        </div>
        <div>
          双玉詰将棋: {sfenAreBothKingsPresent(sfen) ? "有効" : "無効"}
          <br />
          <button
            onClick={() => {
              if (sfenAreBothKingsPresent(sfen)) {
                setSfen(sfenRemoveBlackKing(sfen));
                return;
              } else {
                setSfen(sfenAddBlackKing(sfen));
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

function isValidSfen(sfen: string): Result<null, Error> {
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

function sfenChangePlayer(sfen: string): string {
  const [board, turn, hand] = sfen.split(" ");
  return `${board} ${turn === "b" ? "w" : "b"} ${hand}`;
}

function sfenAreBothKingsPresent(sfen: string): boolean {
  return sfen.includes("K") && sfen.includes("k");
}

function sfenAddBlackKing(sfen: string): string {
  if (sfen.includes("K")) {
    alert("先手の玉がすでに配置されています");
    return sfen;
  }
  const [board, turn, hand, numMoves] = sfen.split(" ");
  return `${board} ${turn} K${hand}  ${numMoves}`;
}

function sfenRemoveBlackKing(sfen: string): string {
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
