import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { runSeedIfNeeded } from "@/infrastructure/mock-data/seed-runner";

runSeedIfNeeded();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
