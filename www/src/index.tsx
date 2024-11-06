import React, { useEffect } from "react";
import Head from "next/head";
import { createRoot } from "react-dom/client";
import { ShogiPlayer } from "shogi-player-webcomponents";
import { parseSfen } from "shogi-player-webcomponents/dist/sfen.js";
import { createComponent } from "@lit/react";
import "./App.css";
import { ReadKif } from "./kif_parse";

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
  try {
    parseSfen(sfen);
  } catch (e) {
    alert(e);
    return;
  }
  const dom = document.getElementById("shogi-player");
  dom?.setAttribute("sfen", sfen);
}

function Home({}): JSX.Element {
  // https://www.ai-shift.co.jp/techblog/3927
  const SP = createComponent({
    tagName: "shogi-player",
    elementClass: ShogiPlayer,
    react: React,
    events: {
      update: "update",
    },
  });
  const [sfen, setSfen] = React.useState(
    "4k4/9/9/9/9/9/9/9/9 b 2r2b4g4s4n4l18p 1"
  );
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
          }}
        />
        <select size={10} className="right">
          <option value="select">--指し手を選択--</option>
          <option value="move_0">▲７二飛</option>
        </select>
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

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>
);
