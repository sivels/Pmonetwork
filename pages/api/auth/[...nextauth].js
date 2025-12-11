import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
// LinkedIn & Microsoft (Azure AD) custom/provider placeholders
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

// Minimal custom LinkedIn provider placeholder (real implementation requires OAuth app)
const LinkedInProvider = {
  id: 'linkedin',
  name: 'LinkedIn',
  type: 'oauth',
  version: '2.0',
  scope: 'r_liteprofile r_emailaddress',
  params: { grant_type: 'authorization_code' },
  accessTokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
  authorization: 'https://www.linkedin.com/oauth/v2/authorization',
  profileUrl: 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
  async profile(profile/* raw */, tokens) {
    // Placeholder mapping – LinkedIn requires additional calls to get name/profile
    return {
      id: tokens.access_token.substring(0, 16),
      name: 'LinkedIn User',
      email: profile?.elements?.[0]?.['handle~']?.emailAddress || null
    };
  },
  clientId: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET
};

// Azure AD (Microsoft) placeholder provider – needs proper endpoints & tenant config
const AzureADProvider = {
  id: 'azure-ad',
  name: 'Microsoft',
  type: 'oauth',
  wellKnown: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
  authorization: { params: { scope: 'openid profile email' } },
  clientId: process.env.AZURE_AD_CLIENT_ID,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
  async profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email
    };
  }
};

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('No credentials provided');
          return null;
        }
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) {
          console.log('No user found for email:', credentials.email);
          return null;
        }
        console.log('User found:', user.email, 'Password hash:', user.password);
        const valid = await bcrypt.compare(credentials.password, user.password);
        console.log('Password comparison result:', valid, 'Input password:', credentials.password);
        if (!valid) {
          console.log('Invalid password for user:', credentials.email);
          return null;
        }
        return { id: user.id, email: user.email, role: user.role };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_CLIENT_SECRET'
    }),
    LinkedInProvider,
    AzureADProvider
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || token.role;
      } else if (token.email && !token.role) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) token.role = dbUser.role;
      }
      // Mark onboarding needed if user lacks candidate/employer profile
      if (token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email }, include: { candidateCandidateProfile: true, employerEmployerProfile: true } });
        token.onboardingNeeded = dbUser && !dbUser.candidateCandidateProfile && !dbUser.employerEmployerProfile;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.role) session.user.role = token.role;
      session.user.onboardingNeeded = token.onboardingNeeded || false;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If URL is relative, prepend baseUrl
      if (url.startsWith('/')) {
        return baseUrl + url;
      }
      // Only allow redirects to same origin
      return url.startsWith(baseUrl) ? url : baseUrl;
    }
  },
  pages: {
    signIn: '/auth/login'
  }
};

export default NextAuth(authOptions);
