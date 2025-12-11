export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { text = '' } = req.body || {};
  const firstSentence = (text.trim().match(/[^.!?]+[.!?]/) || [text.trim().slice(0, 160) + (text.length > 160 ? '…' : '')])[0];
  const output = firstSentence.replace(/\s+/g, ' ').trim();
  res.json({ output });
}
