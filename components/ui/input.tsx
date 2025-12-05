import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex w-full min-w-0 text-background flex-1 resize-none overflow-hidden rounded-lg focus:outline-0 focus:ring-2 focus:ring-[#1337ec]/50 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-[#1337ec] h-14 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-[15px] text-base font-normal leading-normal disabled:opacity-50 disabled:cursor-not-allowed",
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "selection:bg-primary selection:text-primary-foreground",
        className
      )}
      {...props}
    />
  );
}

export { Input };
