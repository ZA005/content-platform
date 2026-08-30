import { useState } from "react";
import { ChevronDown, Download, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/infrastructure/logging/logger";

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "error" | "warn" | "info" | "log" | "debug">("all");

  const logs = logger.getLogs();
  const stats = logger.getStats();

  const filteredLogs = filter === "all" ? logs : logs.filter((log) => log.level === filter);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-slate-900 text-white p-2 shadow-lg hover:bg-slate-800 transition-colors"
        title="Toggle debug panel"
      >
        <ChevronDown
          size={20}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-40 w-96 max-h-96 bg-slate-900 text-slate-50 rounded-lg shadow-xl border border-slate-700 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800">
            <div className="text-sm font-semibold">Debug Logs</div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Stats */}
          <div className="px-3 py-2 bg-slate-800 border-b border-slate-700 text-xs space-y-1">
            <div className="grid grid-cols-3 gap-2 text-slate-300">
              <span>Total: {stats.total}</span>
              <span className="text-red-400">Errors: {stats.errors}</span>
              <span className="text-yellow-400">Warn: {stats.warnings}</span>
            </div>
          </div>

          {/* Filter */}
          <div className="px-3 py-2 border-b border-slate-700 flex gap-1 flex-wrap">
            {(["all", "error", "warn", "info", "log", "debug"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  filter === level
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Logs */}
          <div className="flex-1 overflow-y-auto text-xs font-mono space-y-1 p-2">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-500">No logs</div>
            ) : (
              filteredLogs.slice(-50).map((log, i) => (
                <div
                  key={i}
                  className={`text-xs ${
                    log.level === "error"
                      ? "text-red-400"
                      : log.level === "warn"
                        ? "text-yellow-400"
                        : log.level === "info"
                          ? "text-blue-400"
                          : "text-slate-400"
                  }`}
                >
                  <span className="text-slate-600">[{log.timestamp.split("T")[1].slice(0, 8)}]</span>{" "}
                  <span className="uppercase">[{log.level}]</span> {log.message}
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-slate-700 p-2 flex gap-2 bg-slate-800">
            <Button
              size="sm"
              variant="outline"
              onClick={() => logger.downloadLogs()}
              className="flex-1 text-xs h-8"
            >
              <Download size={14} className="mr-1" />
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                logger.clearLogs();
                // Force re-render by updating state
                setFilter("all");
              }}
              className="flex-1 text-xs h-8"
            >
              <Trash2 size={14} className="mr-1" />
              Clear
            </Button>
          </div>
        </div>
      )}
    </>
  );
}