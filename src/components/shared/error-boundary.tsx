import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-danger/15 text-danger">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="font-display text-sm font-semibold text-foreground">
              {this.props.fallbackTitle ?? "Something went wrong"}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {this.state.error?.message ?? "An unexpected error occurred while rendering this section."}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={this.handleReset}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
