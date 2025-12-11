"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Mail, MessageSquare, FileText, Users, CheckCircle, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

export function DetailPanel({ applicationId, onClose }: { applicationId: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["application", applicationId],
    queryFn: async () => {
      const res = await fetch(`/api/applications/${applicationId}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!applicationId,
  });

  // Mark viewed when opened
  useEffect(() => {
    if (!applicationId) return;
    fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markViewed: true, actorUserId: "system" }),
    }).then(() => {
      qc.invalidateQueries({ queryKey: ["applications"] });
    });
  }, [applicationId]);

  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && applicationId) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [applicationId, onClose]);

  const changeStatus = useMutation({
    mutationFn: async (toStatus: string) => {
      await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus, actorUserId: "system" }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["application", applicationId] });
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!data) return;
      // Create or find conversation
      const convRes = await fetch(`/api/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employerId: data.job.employerId, candidateId: data.candidate.id, jobId: data.job.id }),
      });
      const conv = await convRes.json();
      setConversationId(conv.id);
      await fetch(`/api/conversations/${conv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderUserId: "system", receiverUserId: data.candidate.userId ?? "", text: messageText }),
      });
      setMessageText("");
    },
  });

  return (
    <>
      {/* Backdrop overlay */}
      {applicationId && (
        <div 
          className="fixed inset-0 z-40 bg-black/30 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Detail Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-xl transform bg-white shadow-xl transition-transform ${applicationId ? "translate-x-0" : "translate-x-full"}`}>
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={onClose} 
            className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Back to applicants list"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Back to Applicants</span>
            <span className="sm:hidden">Back</span>
          </button>
          <button 
            onClick={onClose} 
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      {isLoading || !data ? (
        <div className="p-6 text-sm text-gray-500">Loading…</div>
      ) : (
        <div className="space-y-6 overflow-y-auto p-6">
          <div className="flex items-center gap-3">
            <img src={data.candidate?.profilePhotoUrl || "/avatar-placeholder.png"} className="h-14 w-14 rounded-full object-cover" />
            <div>
              <div className="text-lg font-medium">{data.candidate?.fullName}</div>
              <div className="text-sm text-gray-600">{data.candidate?.jobTitle}</div>
              <div className="text-xs text-gray-500">{data.candidate?.location}</div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">Skills</div>
            <div className="flex flex-wrap gap-2">
              {(data.candidate?.skills || []).map((s: any) => (
                <span key={s.id} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{s.name}</span>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">Experience</div>
            <ul className="space-y-2 text-sm">
              {(data.candidate?.experiences || []).slice(0, 3).map((e: any) => (
                <li key={e.id} className="rounded border p-3">
                  <div className="font-medium">{e.jobTitle} · {e.company}</div>
                  <div className="text-xs text-gray-500">{new Date(e.startDate).toLocaleDateString()} – {e.endDate ? new Date(e.endDate).toLocaleDateString() : "Present"}</div>
                  {e.description ? <div className="mt-2 text-xs text-gray-700">{e.description}</div> : null}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold">Documents</div>
            <ul className="space-y-2 text-sm">
              {(data.candidate?.documents || []).map((d: any) => (
                <li key={d.id} className="flex items-center justify-between rounded border p-2">
                  <div className="flex items-center gap-2"><FileText className="h-4 w-4" />{d.title || d.filename}</div>
                  <a href={d.url} target="_blank" className="text-blue-600 hover:underline">Download</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="-mx-6 border-t bg-white p-4">
            <div className="mb-3">
              <div className="mb-1 text-sm font-semibold">Message Candidate</div>
              <div className="flex items-center gap-2">
                <input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Write a message…" className="w-full rounded-md border px-3 py-2 text-sm" />
                <button onClick={() => sendMessage.mutate()} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm"><MessageSquare className="h-4 w-4"/> Send</button>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-10 -mx-6 border-t bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => changeStatus.mutate("SHORTLISTED")} className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"><CheckCircle className="h-4 w-4"/> Shortlist</button>
              <button onClick={() => changeStatus.mutate("INTERVIEW")} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"><Users className="h-4 w-4"/> Move to Interview</button>
              <button onClick={() => changeStatus.mutate("REJECTED")} className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700">Reject</button>
              <button className="ml-auto inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm"><MessageSquare className="h-4 w-4"/> Message</button>
              <button className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm"><Mail className="h-4 w-4"/> Email</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
