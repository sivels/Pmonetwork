export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { text = '', mode = 'professional' } = req.body || {};
  let output = text;
  if (mode === 'professional') {
    // naive transform: trim, capitalise sentences
    output = text
      .trim()
      .split(/([.!?]\s+)/)
      .map((seg) => seg.replace(/^(\s*[a-z])/, (m) => m.toUpperCase()))
      .join('');
  }
  return res.json({ output });
}
