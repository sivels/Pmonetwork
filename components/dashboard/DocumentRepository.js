export default function DocumentRepository({ docs }) {
  if (!docs) return <div className="bg-white rounded-lg shadow p-4">Loading documents...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-700">Document Repository</h3>
      <ul className="mt-3 space-y-2 text-sm text-gray-700">
        {docs.map(d => (
          <li key={d.id} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{d.name}</div>
              <div className="text-xs text-gray-500">{d.type} • Uploaded {d.uploadedAt}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-2 py-1 border rounded text-xs">Download</button>
              <button className="px-2 py-1 border rounded text-xs">Share</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
