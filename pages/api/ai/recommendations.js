export default async function handler(req, res) {
  // Stub recommendations based on simple heuristics; no external AI call
  const suggestions = [
    'Add your PRINCE2 certification to reach 85% completion',
    'Record a 60s video intro to stand out',
    'Include measurable outcomes in your last role'
  ];
  const gaps = ['Benefits realisation', 'Portfolio governance', 'MSP'];
  const matches = ['Senior PMO Analyst at FinServCo', 'PMO Lead (Contract) at HealthTech'];
  res.json({ suggestions, gaps, matches });
}
