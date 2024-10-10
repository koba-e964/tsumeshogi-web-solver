import React from "react";
import Head from "next/head";
import { createRoot } from "react-dom/client";
import { ShogiPlayer } from "shogi-player-webcomponents";
import { createComponent, ReactWebComponent } from "@lit/react";

function hello(name: string): string {
  return `Hello, ${name}!`;
}

function Home({}): JSX.Element {
  const SP: ReactWebComponent<ShogiPlayer, {}> = createComponent({
    tagName: "shogi-player",
    elementClass: ShogiPlayer,
    react: React,
  });
  return (
    <div>
      <Head>
        <title>Home</title>
      </Head>
      <h1>{hello("shogi-board")}</h1>
      <SP />
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
