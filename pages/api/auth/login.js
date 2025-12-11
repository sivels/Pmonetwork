import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, role, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (role && role !== user.role) {
      return res.status(401).json({ error: 'Role mismatch – check you selected the correct account type' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Placeholder session handling – replace with NextAuth/JWT in production
    const cookieExpiryDays = rememberMe ? 30 : 1;
    const expires = new Date(Date.now() + cookieExpiryDays * 24 * 60 * 60 * 1000).toUTCString();
    res.setHeader('Set-Cookie', `pmo_session=user_${user.id}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`);

    const redirect = user.role === 'EMPLOYER' ? '/dashboard/employer' : '/dashboard/candidate';
    return res.status(200).json({ ok: true, redirect });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ error: 'Server error – please try again later' });
  }
}
