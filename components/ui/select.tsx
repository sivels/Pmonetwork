import * as React from "react";
import { cn } from "@/components/utils/cn";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "h-9 rounded-md border border-gray-200 bg-white px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";
