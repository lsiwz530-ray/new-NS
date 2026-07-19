import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { LangProvider } from "@/lib/i18n";
import { LoadingScreen } from "@/components/LoadingScreen";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LangProvider>
      <LoadingScreen />
      <RouterProvider router={router} />
    </LangProvider>
  </React.StrictMode>,
);
