"use client";
import { useEffect } from "react";
import { supabaseBrowser } from "../../lib/supabaseBrowser";
import { toast } from "./toast";
import { useQueryClient } from "@tanstack/react-query";

export default function CandidateRealtime({ candidateId, onStatus, onMessage }: { candidateId: string; onStatus?: (p: any) => void; onMessage?: (p: any) => void }) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!supabaseBrowser || !candidateId) return;
    const channel = supabaseBrowser.channel(`candidate:${candidateId}`);
    channel.on('broadcast', { event: 'application_status' }, ({ payload }) => {
      toast.info(`Application status updated: ${payload.status}`);
      qc.invalidateQueries({ queryKey: ["candidate-applications", candidateId] });
      onStatus?.(payload);
    });
    channel.on('broadcast', { event: 'message' }, ({ payload }) => {
      toast.info(`New message from employer`);
      onMessage?.(payload);
    });
    channel.subscribe();
    return () => { channel.unsubscribe(); };
  }, [candidateId, qc]);
  return null;
}
