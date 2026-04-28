import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InviteToInterviewModal from "../../../../components/InviteToInterviewModal";

const DataTable = dynamic(() => import("../../../../components/applications/DataTable").then(m => m.DataTable), { ssr: false });
const DetailPanel = dynamic(() => import("../../../../components/applications/DetailPanel").then(m => m.DetailPanel), { ssr: false });

const queryClient = new QueryClient();

export default function ApplicationsPage() {
  const router = useRouter();
  const { jobId, applicationId } = router.query;
  const [openId, setOpenId] = useState(applicationId || null);
  const [interviewApplicationId, setInterviewApplicationId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [jobTitle, setJobTitle] = useState('');

  // Auto-open detail panel when applicationId is in URL
  useEffect(() => {
    if (applicationId) {
      setOpenId(applicationId);
    }
  }, [applicationId]);

  useEffect(() => {
    if (!jobId) return;

    let mounted = true;

    async function loadJobTitle() {
      try {
        const res = await fetch(`/api/employer/jobs/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) {
          setJobTitle(data?.job?.title || '');
        }
      } catch (error) {
        console.error('Failed to load job title:', error);
      }
    }

    loadJobTitle();

    return () => {
      mounted = false;
    };
  }, [jobId]);

  function handleOpenDetails(id) {
    setOpenId(id);
  }

  async function handleAction(id, action) {
    if (action === "MESSAGE") {
      setOpenId(id);
      return;
    }

    if (action === "INTERVIEW") {
      // Fetch the full application details for the modal
      try {
        const res = await fetch(`/api/applications/${id}`);
        const application = await res.json();
        setSelectedApplication(application);
        setInterviewApplicationId(id);
      } catch (error) {
        console.error("Failed to fetch application:", error);
      }
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

  function handleInterviewScheduled(interview) {
    console.log("Interview scheduled:", interview);
    queryClient.invalidateQueries({ queryKey: ["applications", jobId] });
  }

  if (!jobId) return <div className="p-6">Loading...</div>;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold">Applications</h1>
          {jobTitle && (
            <p className="mt-1 text-sm font-medium text-indigo-700">
              Job: {jobTitle}
            </p>
          )}
          <p className="text-sm text-gray-600">Review, shortlist, and message candidates in real time.</p>
        </div>

        <DataTable jobId={jobId} onOpenDetails={handleOpenDetails} onAction={handleAction} />
        <DetailPanel applicationId={openId} onClose={() => setOpenId(null)} />
        
        {selectedApplication && (
          <InviteToInterviewModal
            application={selectedApplication}
            onClose={() => {
              setInterviewApplicationId(null);
              setSelectedApplication(null);
            }}
            onSuccess={handleInterviewScheduled}
          />
        )}
      </div>
    </QueryClientProvider>
  );
}
