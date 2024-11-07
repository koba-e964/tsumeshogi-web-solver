import { createRoot } from "react-dom/client";
import React from "react";
import WholePlayer from "./whole_player";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WholePlayer />
  </React.StrictMode>
);
