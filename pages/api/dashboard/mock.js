export default function handler(req, res) {
  res.status(200).json({
    profile: {
      id: 'user_abc',
      name: 'Alex Morgan',
      title: 'PMO / Programme Manager',
      location: 'London, UK',
      summary: 'Experienced PMO with a history of delivering transformation programmes across finance and technology.',
      readiness: 78,
      skills: [
        { name: 'Programme Management', level: 9 },
        { name: 'Portfolio Governance', level: 8 },
        { name: 'Stakeholder Management', level: 9 },
        { name: 'Benefits Realisation', level: 7 }
      ],
    },
    profile_views: {
      last_30_days: 124,
      trending_companies: ['Acme Corp', 'Globex', 'Initech']
    },
    applications: [
      { id: 'app_1', role: 'Senior PMO', company: 'Acme Corp', stage: 'Shortlisted', date: '2025-07-01' },
      { id: 'app_2', role: 'Programme Manager', company: 'Initech', stage: 'Applied', date: '2025-06-15' }
    ],
    documents: [
      { id: 'doc_1', name: 'CV - Alex Morgan.pdf', type: 'CV', uploadedAt: '2025-05-01' },
      { id: 'doc_2', name: 'PMP Certificate.pdf', type: 'Certificate', uploadedAt: '2024-11-12' }
    ]
  });
}
