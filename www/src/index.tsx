import React, { useEffect } from "react";
import Head from "next/head";
import { createRoot } from "react-dom/client";
import { ShogiPlayer } from "shogi-player-webcomponents";
import { createComponent } from "@lit/react";

type PlayerUpdateEvent = {
  sfen: string;
};

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
    <div>
      <Head>
        <title>詰将棋 Web ソルバー</title>
      </Head>
      <SP
        id="shogi-player"
        mode="edit"
        update={(e: CustomEvent<PlayerUpdateEvent>) => {
          setSfen(e.detail.sfen);
        }}
      />
      SFEN: <textarea id="sfen" readOnly value={sfen} rows={1} cols={80} />
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
