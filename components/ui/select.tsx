import * as React from "react";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", children, ...props }, ref) => {
    const baseClasses =
      "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C4B9C] focus-visible:ring-offset-1";

    return (
      <select ref={ref} className={`${baseClasses} ${className}`} {...props}>
        {children}
      </select>
    );
  },
);

Select.displayName = "Select";
