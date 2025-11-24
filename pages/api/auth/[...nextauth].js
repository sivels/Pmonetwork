import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        token: { label: 'One-time token', type: 'text' },
      },
      async authorize(credentials) {
        // If a one-time token is provided, validate it and sign the user in
        if (credentials?.token) {
          const tokenRecord = await prisma.passwordResetToken.findUnique({ where: { token: credentials.token } });
          if (!tokenRecord) throw new Error('Invalid or expired token');
          if (tokenRecord.expiresAt < new Date()) {
            await prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
            throw new Error('Token expired');
          }
          const user = await prisma.user.findUnique({ where: { id: tokenRecord.userId } });
          if (!user) throw new Error('User not found');
          // consume token
          await prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } });
          // Audit token consumption
          try {
            const { appendAudit } = await import('../../../lib/tokenAudit');
            await appendAudit({ action: 'one_time_token_consumed', userId: user.id, token: credentials.token });
          } catch (err) {
            console.error('Failed to audit token consumption', err);
          }
          return { id: user.id, email: user.email, role: user.role };
        }

        const { email, password } = credentials;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          throw new Error('Invalid email or password');
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          throw new Error('Invalid email or password');
        }
        if (!user.emailVerified) {
          throw new Error('Please verify your email before signing in');
        }
        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
