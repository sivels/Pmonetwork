import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const DataTable = dynamic(() => import("../../../../components/applications/DataTable").then(m => m.DataTable), { ssr: false });
const DetailPanel = dynamic(() => import("../../../../components/applications/DetailPanel").then(m => m.DetailPanel), { ssr: false });

const queryClient = new QueryClient();

export default function ApplicationsPage() {
  const router = useRouter();
  const { jobId } = router.query;
  const [openId, setOpenId] = useState(null);

  function handleOpenDetails(id) {
    setOpenId(id);
  }

  async function handleAction(id, action) {
    if (action === "MESSAGE") {
      setOpenId(id);
      return;
    }
    
    try {
      await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus: action, actorUserId: "system" }),
      });
      queryClient.invalidateQueries({ queryKey: ["applications", jobId] });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  if (!jobId) return <div className="p-6">Loading...</div>;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold">Applications</h1>
          <p className="text-sm text-gray-600">Review, shortlist, and message candidates in real time.</p>
        </div>

        <DataTable jobId={jobId} onOpenDetails={handleOpenDetails} onAction={handleAction} />
        <DetailPanel applicationId={openId} onClose={() => setOpenId(null)} />
      </div>
    </QueryClientProvider>
  );
}
