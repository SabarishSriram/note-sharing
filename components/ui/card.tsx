// Simple card container used for note display and panels

import * as React from "react";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: CardProps) {
  return <div className={`mb-2 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: CardProps) {
  return (
    <h3
      className={`text-base font-semibold tracking-tight text-slate-900 ${className}`}
      {...props}
    />
  );
}

export function CardDescription({ className = "", ...props }: CardProps) {
  return (
    <p
      className={`text-sm text-slate-500 leading-snug ${className}`}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }: CardProps) {
  return <div className={className} {...props} />;
}
