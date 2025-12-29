export default function handler(req, res) {
  res.status(200).json({
    profile: null,
    profile_views: {
      last_30_days: 0,
      trending_companies: []
    },
    applications: [],
    documents: []
  });
}
