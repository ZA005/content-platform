import * as React from "react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    className={cn(
      "h-4 w-4 rounded border border-neutral-400 bg-neutral-950 checked:bg-neutral-100 checked:border-neutral-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 accent-neutral-100",
      className
    )}
    {...props}
  />
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
