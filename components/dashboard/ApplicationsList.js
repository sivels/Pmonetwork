export default function ApplicationsList({ items }) {
  if (!items) return <div className="bg-white rounded-lg shadow p-4">Loading applications...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-700">Recent Applications</h3>
      <ul className="mt-3 space-y-2">
        {items.map(it => (
          <li key={it.id} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{it.role} — <span className="text-gray-600">{it.company}</span></div>
              <div className="text-xs text-gray-500">{it.date} • {it.stage}</div>
            </div>
            <div className="text-sm text-gray-500">{it.stage}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
