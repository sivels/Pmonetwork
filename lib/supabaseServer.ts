import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabaseServer = url && (service || anon)
  ? createClient(url, service || anon, { auth: { persistSession: false } })
  : null;

export async function broadcast(channel: string, event: string, payload: any) {
  try {
    if (!supabaseServer) return;
    await supabaseServer.channel(channel).send({ type: "broadcast", event, payload });
  } catch (e) {
    console.warn("Supabase broadcast failed", e);
  }
}
