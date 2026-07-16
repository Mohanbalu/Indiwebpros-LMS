import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const PageContainer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8", className)}
      {...props}
    />
  )
);
PageContainer.displayName = "PageContainer";
