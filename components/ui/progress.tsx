"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

// @ts-expect-error
interface ProgressProps
  extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  isSlider?: boolean;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
  showLabel?: boolean;
}

function Progress({
  className,
  value,
  isSlider = false,
  min = 0,
  max = 100,
  onChange,
  showLabel = false,
  ...props
}: ProgressProps) {
  if (isSlider) {
    const numValue = typeof value === "number" ? value : 0;
    const percentage = ((numValue - min) / (max - min)) * 100;

    return (
      <div className="w-full space-y-2">
        <div className="relative h-2 w-full">
          {/* Background track */}
          <div className="absolute inset-0 bg-primary/20 rounded-full" />
          {/* Filled track */}
          <div
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
          {/* Slider input */}
          {/* @ts-expect-error */}
          <input
            type="range"
            min={min}
            max={max}
            value={numValue}
            onChange={(e) => onChange?.(parseInt(e.target.value))}
            className={cn(
              "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
              className
            )}
            {...props}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-primary rounded-full shadow-lg border-2 border-background pointer-events-none transition-all"
            style={{ left: `${percentage}%` }}
          />
        </div>

        {/* Labels */}
        {showLabel && (
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>{min}</span>
            <span className="font-medium text-foreground">{numValue}</span>
            <span>{max}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
