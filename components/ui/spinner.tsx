// Spinner Component
// Loading spinner for async operations

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <Loader2
        className={cn("animate-spin text-muted-foreground", sizeClasses[size])}
      />
    </div>
  );
}

export interface SpinnerOverlayProps {
  message?: string;
}

export function SpinnerOverlay({ message }: SpinnerOverlayProps) {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
