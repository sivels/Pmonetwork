"use client";
import * as React from "react";
import { cn } from "../utils/cn";

export function Sheet({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
  return (
    <div className={cn("fixed inset-0 z-50", open ? "block" : "hidden")}
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-white shadow-xl">
        {children}
      </div>
    </div>
  );
}
