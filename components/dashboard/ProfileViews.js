export default function ProfileViews({ views }) {
  if (!views) return <div className="bg-white rounded-lg shadow p-4">Loading views...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-700">Profile Views</h3>
      <div className="mt-3">
        <div className="text-2xl font-bold">{views.last_30_days}</div>
        <div className="text-xs text-gray-500 mt-1">Views in the last 30 days</div>

        <div className="mt-3">
          <h4 className="text-sm font-medium text-gray-600">Trending companies</h4>
          <ul className="text-xs text-gray-500 mt-1">
            {views.trending_companies.map(c => <li key={c}>{c}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
