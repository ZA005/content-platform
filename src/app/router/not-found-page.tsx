import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-center">
      <p className="font-display text-5xl font-semibold text-primary">404</p>
      <p className="text-sm text-muted-foreground">This page doesn't exist.</p>
      <Button asChild size="sm">
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
