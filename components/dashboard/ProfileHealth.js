export default function ProfileHealth({ profile }) {
  if (!profile) return null;
  const score = Math.max(0, Math.min(100, profile.readiness || 0));

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-700">Profile health</h3>
      <div className="mt-3 flex items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-300 to-green-500 flex items-center justify-center text-2xl font-bold text-white">{score}%</div>
        <div>
          <p className="text-sm text-gray-700">Your readiness score estimates how likely employers are to engage with you. Keep skills and documents up to date.</p>
        </div>
      </div>
    </div>
  );
}
