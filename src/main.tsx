import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logger } from "@/infrastructure/logging/logger";
import { verifySupabaseConnection } from "@/infrastructure/supabase/verify-connection";

// Initialize logger - captures all console logs and errors
logger.clearLogs(); // Clear old logs on app start
console.log("🚀 App starting...");

// Verify Supabase connection on startup
verifySupabaseConnection();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
