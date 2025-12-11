import * as React from "react";

export function Table({ children }: { children: React.ReactNode }) {
  return <div className="w-full overflow-x-auto">{children}</div>;
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-12 gap-4 border-b p-4 text-xs font-semibold text-gray-500">{children}</div>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-12 items-center gap-4 border-t p-4 hover:bg-gray-50">{children}</div>;
}

export function TableCell({ children, colSpan = 1 }: { children: React.ReactNode; colSpan?: number }) {
  return <div className={`col-span-${colSpan}`}>{children}</div>;
}
