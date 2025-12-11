"use client";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "../applications/StatusBadge";

export function CandidateApplicationsList({ candidateId }: { candidateId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["candidate-applications", candidateId],
    queryFn: async () => {
      const res = await fetch(`/api/candidates/${candidateId}/applications`);
      const json = await res.json();
      return json.items || [];
    },
    refetchInterval: 10000,
  });

  if (isLoading) return <div className="p-4 text-sm text-gray-500">Loading applications…</div>;

  return (
    <div className="space-y-3">
      {(data || []).map((app: any) => (
        <div key={app.id} className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{app.job.title}</h3>
              <p className="text-sm text-gray-600">{app.job.employer?.companyName || "Company"}</p>
              <p className="text-xs text-gray-500 mt-1">
                {app.job.location} {app.job.isRemote ? "• Remote" : ""} • {app.job.employmentType}
              </p>
            </div>
            <StatusBadge status={app.status} />
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Applied {new Date(app.createdAt).toLocaleDateString()}
            {app.viewedByEmployerAt && (
              <span className="ml-3 text-blue-600">✓ Viewed by employer</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
