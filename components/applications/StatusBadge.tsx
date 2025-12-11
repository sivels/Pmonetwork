import { cn } from "../utils/cn";

const map: Record<string, string> = {
  APPLIED: "bg-gray-100 text-gray-800 border-gray-200",
  REVIEWED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  SHORTLISTED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  INTERVIEW: "bg-blue-100 text-blue-800 border-blue-200",
  OFFER: "bg-indigo-100 text-indigo-800 border-indigo-200",
  HIRED: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = map[status?.toUpperCase?.()] ?? map.APPLIED;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", cls)}>
      {status}
    </span>
  );
}
