import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApplicationRow } from "./types";
import { StatusBadge } from "./StatusBadge";
import { User, Mail, FileText, Star, ThumbsDown, MessageSquare, Search } from "lucide-react";
import { supabaseBrowser } from "../../lib/supabaseBrowser";

function CandidateCell({ row }: { row: ApplicationRow }) {
  const c = row.candidate;
  return (
    <div className="flex items-center gap-3">
      <img src={c.profilePhotoUrl || "/avatar-placeholder.png"} alt="" className="h-10 w-10 rounded-full object-cover" />
      <div>
        <div className="font-medium">{c.fullName}</div>
        <div className="text-xs text-gray-500">{c.jobTitle || ""}</div>
      </div>
    </div>
  );
}

function ActionsCell({ row, onOpenDetails, onAction }: { row: ApplicationRow; onOpenDetails: (id: string) => void; onAction: (id: string, action: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50" onClick={() => onAction(row.id, "SHORTLISTED")}>
        <Star className="h-4 w-4" /> Shortlist
      </button>
      <button className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50" onClick={() => onAction(row.id, "REJECTED")}>
        <ThumbsDown className="h-4 w-4" /> Reject
      </button>
      <button className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50" onClick={() => onOpenDetails(row.id)}>
        <User className="h-4 w-4" /> View
      </button>
      <button className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50" onClick={() => onAction(row.id, "MESSAGE") }>
        <MessageSquare className="h-4 w-4" /> Message
      </button>
    </div>
  );
}

export function DataTable({ jobId, onOpenDetails, onAction }: { jobId: string; onOpenDetails: (id: string) => void; onAction: (id: string, action: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["applications", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/applications`);
      const json = await res.json();
      return (json.items || []) as any[];
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!supabaseBrowser) return;
    const channel = supabaseBrowser.channel(`applications:job:${jobId}`);
    const sub = channel.on('broadcast', { event: 'status_changed' }, () => {
      // No-op: periodic refetch picks it up; could call queryClient.invalidateQueries here
    });
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [jobId]);

  const rows: ApplicationRow[] = useMemo(
    () =>
      (data || []).map((a: any) => ({
        id: a.id,
        job: a.job,
        candidate: a.candidate,
        createdAt: a.createdAt,
        status: a.status,
        yearsExp: a.yearsExp ?? a.candidate?.yearsExperience ?? null,
        location: a.location ?? a.candidate?.location ?? null,
        matchScore: a.matchScore ?? null,
      })),
    [data]
  );

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading applications…</div>;
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b p-4">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input className="w-full rounded-md border pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search candidates, roles, locations…" />
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-md border px-2 py-2 text-sm">
            <option>Status</option>
            <option>Applied</option>
            <option>Reviewed</option>
            <option>Shortlisted</option>
            <option>Rejected</option>
            <option>Interview</option>
            <option>Offer</option>
            <option>Hired</option>
          </select>
          <select className="rounded-md border px-2 py-2 text-sm">
            <option>Sort: Newest</option>
            <option>Experience</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-gray-500">
        <div className="col-span-4">Candidate</div>
        <div className="col-span-2">Job</div>
        <div className="col-span-2">Applied</div>
        <div className="col-span-1">Exp</div>
        <div className="col-span-1">Location</div>
        <div className="col-span-2">Status</div>
      </div>

      <div>
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-12 items-center gap-4 border-t p-4 hover:bg-gray-50">
            <div className="col-span-4">
              <CandidateCell row={row} />
              <div className="mt-2 flex flex-wrap gap-1">
                {(row.candidate.skills || []).map((s, i) => (
                  <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700">{s.name}</span>
                ))}
              </div>
            </div>
            <div className="col-span-2 text-sm">{row.job.title}</div>
            <div className="col-span-2 text-xs text-gray-500">{new Date(row.createdAt).toLocaleDateString()}</div>
            <div className="col-span-1 text-xs">{row.yearsExp ?? "-"}</div>
            <div className="col-span-1 text-xs">{row.location ?? "-"}</div>
            <div className="col-span-2 flex items-center justify-between gap-2">
              <StatusBadge status={row.status} />
              <ActionsCell row={row} onOpenDetails={onOpenDetails} onAction={onAction} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
