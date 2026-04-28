import { requireSupportRole } from '../../../../../lib/adminSupportAuth';

const templates = [
  {
    key: 'PASSWORD_RESET',
    name: 'Password reset guidance',
    subject: 'PMO Network account access support',
    body: 'Hi {{name}},\n\nWe have initiated a secure password reset for your account. Please use this link: {{resetUrl}}\n\nIf you did not request this, reply to this email immediately.\n\nRegards,\nPMO Network Support',
  },
  {
    key: 'ACCOUNT_UNLOCKED',
    name: 'Account unlocked confirmation',
    subject: 'Your PMO Network account has been unlocked',
    body: 'Hi {{name}},\n\nYour account is now unlocked and available. If you continue seeing issues, please reply with a screenshot and timestamp.\n\nRegards,\nPMO Network Support',
  },
  {
    key: 'VERIFICATION_UPDATE',
    name: 'Verification status update',
    subject: 'Update on your PMO Network verification',
    body: 'Hi {{name}},\n\nYour verification status is now: {{verificationStatus}}.\n\nIf you need help, reply directly to this email and include your account ID: {{userId}}.\n\nRegards,\nPMO Network Support',
  },
];

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await requireSupportRole(req, res, 'SUPPORT_AGENT');
  if (!auth) return;

  return res.status(200).json({ templates });
}
