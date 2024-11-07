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
          手番: {sfen.split(" ")[1] === "b" ? "▲先手" : "△後手"}{" "}
          <button
            onClick={() => {
              setSfen(sfenChangePlayer(sfen));
            }}
          >
            手番変更
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
