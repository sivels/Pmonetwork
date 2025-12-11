"use client";
import { useEffect, useState } from "react";

type ToastType = "info" | "success" | "error";
interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
}

let listeners: Array<(msg: ToastMessage) => void> = [];
let counter = 0;

export const toast = {
  info: (text: string) => notify(text, "info"),
  success: (text: string) => notify(text, "success"),
  error: (text: string) => notify(text, "error"),
};

function notify(text: string, type: ToastType) {
  const msg: ToastMessage = { id: String(++counter), text, type };
  listeners.forEach((fn) => fn(msg));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 4000);
    };
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((l) => l !== handler);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto min-w-[200px] rounded-lg border px-4 py-3 text-sm shadow-lg ${
            t.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : t.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
