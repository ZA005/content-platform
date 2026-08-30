type LogLevel = "log" | "info" | "warn" | "error" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private storageKey = "app_logs";

  constructor() {
    this.loadFromStorage();
    this.interceptConsole();
  }

  private interceptConsole() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    console.log = (...args: unknown[]) => {
      this.addLog("log", args.join(" "), args);
      originalLog(...args);
    };

    console.error = (...args: unknown[]) => {
      this.addLog("error", args.join(" "), args);
      originalError(...args);
    };

    console.warn = (...args: unknown[]) => {
      this.addLog("warn", args.join(" "), args);
      originalWarn(...args);
    };

    console.info = (...args: unknown[]) => {
      this.addLog("info", args.join(" "), args);
      originalInfo(...args);
    };

    console.debug = (...args: unknown[]) => {
      this.addLog("debug", args.join(" "), args);
      originalDebug(...args);
    };

    // Capture uncaught errors
    window.addEventListener("error", (event) => {
      this.addLog("error", `Uncaught Error: ${event.message}`, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.addLog("error", `Unhandled Promise Rejection: ${event.reason}`, {
        reason: event.reason,
      });
    });
  }

  private addLog(level: LogLevel, message: string, data?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data !== undefined && { data }),
    };

    this.logs.push(entry);

    // Keep only the latest N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Save to localStorage every 10 logs
    if (this.logs.length % 10 === 0) {
      this.saveToStorage();
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (error) {
      console.error("Failed to save logs to localStorage:", error);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load logs from localStorage:", error);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsAsText(): string {
    return this.logs
      .map((log) => {
        const dataStr = log.data ? ` | ${JSON.stringify(log.data)}` : "";
        return `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${dataStr}`;
      })
      .join("\n");
  }

  downloadLogs(): void {
    const logText = this.getLogsAsText();
    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `app-${new Date().toISOString().split("T")[0]}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  clearLogs(): void {
    this.logs = [];
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error("Failed to clear logs:", error);
    }
  }

  getStats(): {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    logs: number;
    debug: number;
  } {
    return {
      total: this.logs.length,
      errors: this.logs.filter((l) => l.level === "error").length,
      warnings: this.logs.filter((l) => l.level === "warn").length,
      info: this.logs.filter((l) => l.level === "info").length,
      logs: this.logs.filter((l) => l.level === "log").length,
      debug: this.logs.filter((l) => l.level === "debug").length,
    };
  }
}

// Create singleton instance
export const logger = new Logger();

// Make logger available globally for debugging
(window as unknown as { __logger: Logger }).__logger = logger;