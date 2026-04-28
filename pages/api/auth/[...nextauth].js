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
  providers: [
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const ipAddress = req?.headers?.['x-forwarded-for']?.toString().split(',')[0]?.trim() || req?.socket?.remoteAddress || null;
        const userAgent = req?.headers?.['user-agent'] || null;

        if (!credentials?.email || !credentials?.password) {
          if (email) {
            await prisma.loginAttempt.create({
              data: {
                email,
                ipAddress,
                userAgent,
                success: false,
                reason: 'MISSING_CREDENTIALS',
              },
            }).catch(() => {});
          }
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          await prisma.loginAttempt.create({
            data: {
              email,
              ipAddress,
              userAgent,
              success: false,
              reason: 'USER_NOT_FOUND',
            },
          }).catch(() => {});
          return null;
        }

        if (user.isSuspended || user.accountStatus === 'SUSPENDED') {
          await prisma.loginAttempt.create({
            data: {
              userId: user.id,
              email: user.email,
              ipAddress,
              userAgent,
              success: false,
              reason: 'ACCOUNT_SUSPENDED',
            },
          }).catch(() => {});
          return null;
        }

        if (user.isLocked || user.accountStatus === 'LOCKED' || user.accountStatus === 'DEACTIVATED') {
          await prisma.loginAttempt.create({
            data: {
              userId: user.id,
              email: user.email,
              ipAddress,
              userAgent,
              success: false,
              reason: user.accountStatus === 'DEACTIVATED' ? 'ACCOUNT_DEACTIVATED' : 'ACCOUNT_LOCKED',
            },
          }).catch(() => {});
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) {
          const nextFailedAttempts = (user.failedLoginAttempts || 0) + 1;
          const shouldLock = nextFailedAttempts >= 5;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: nextFailedAttempts,
              isLocked: shouldLock,
              accountStatus: shouldLock ? 'LOCKED' : user.accountStatus,
            },
          }).catch(() => {});

          await prisma.loginAttempt.create({
            data: {
              userId: user.id,
              email: user.email,
              ipAddress,
              userAgent,
              success: false,
              reason: shouldLock ? 'INVALID_PASSWORD_LOCKED' : 'INVALID_PASSWORD',
            },
          }).catch(() => {});
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lastLoginAt: new Date(),
          },
        }).catch(() => {});

        await prisma.loginAttempt.create({
          data: {
            userId: user.id,
            email: user.email,
            ipAddress,
            userAgent,
            success: true,
            reason: 'LOGIN_SUCCESS',
          },
        }).catch(() => {});

        return { id: user.id, email: user.email, role: user.role };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret',
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    // Commented out until properly configured
    // LinkedInProvider,
    // AzureADProvider
  ],
  session: { 
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://'),
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow credentials login
      if (account?.provider === 'credentials') {
        return true;
      }

      // For OAuth providers (Google, etc.)
      if (account?.provider === 'google') {
        try {
          // Check if user exists with this email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (existingUser) {
            // Check if account link already exists
            const existingAccount = await prisma.account.findFirst({
              where: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            });

            // Create account link if it doesn't exist
            if (!existingAccount) {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                },
              });
            } else {
              // Update existing account tokens
              await prisma.account.update({
                where: { id: existingAccount.id },
                data: {
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                },
              });
            }
            
            // Update user object with existing user's data
            user.id = existingUser.id;
            user.role = existingUser.role;
          }
        } catch (error) {
          console.error('Error linking Google account:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role || token.role;
        token.id = user.id;
      }
      // Always refresh role + profile data from DB on every token refresh
      if (token.email) {
        try {
          const dbUser = await prisma.user.findUnique({ 
            where: { email: token.email }, 
            include: { 
              candidateCandidateProfile: true, 
              employerEmployerProfile: true,
              employerTeamMemberships: {
                where: { status: 'ACTIVE' },
                include: { employer: true },
                take: 1,
              },
            } 
          });
          if (dbUser) {
            // Always keep role and id fresh from DB
            token.role = dbUser.role;
            token.id = dbUser.id;
            const hasActiveEmployerTeam = Boolean(dbUser.employerTeamMemberships?.[0]?.employer);
            token.onboardingNeeded = !dbUser.candidateCandidateProfile && !dbUser.employerEmployerProfile && !hasActiveEmployerTeam;
            if (dbUser.employerEmployerProfile) {
              token.companyName = dbUser.employerEmployerProfile.companyName;
              token.companyLogoUrl = dbUser.employerEmployerProfile.logoUrl;
              token.employerTeamRole = 'OWNER';
            } else if (dbUser.employerTeamMemberships?.[0]?.employer) {
              token.companyName = dbUser.employerTeamMemberships[0].employer.companyName;
              token.companyLogoUrl = dbUser.employerTeamMemberships[0].employer.logoUrl;
              token.employerTeamRole = dbUser.employerTeamMemberships[0].role || 'RECRUITER';
            } else {
              token.companyName = null;
              token.companyLogoUrl = null;
              token.employerTeamRole = null;
            }
          }
        } catch (error) {
          console.error('Error fetching user in jwt callback:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role || null;
      if (token?.id) session.user.id = token.id;
      session.user.onboardingNeeded = token.onboardingNeeded || false;
      
      // Add employer profile data to session
      if (token?.companyName) session.user.companyName = token.companyName;
      if (token?.companyLogoUrl) session.user.companyLogoUrl = token.companyLogoUrl;
      if (token?.employerTeamRole) session.user.employerTeamRole = token.employerTeamRole;
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If coming from Google OAuth, redirect back to settings integrations tab
      if (url.includes('google')) {
        return `${baseUrl}/employer/settings?tab=integrations`;
      }
      
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
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('[NextAuth Error]', code, metadata);
    },
    warn(code) {
      console.warn('[NextAuth Warn]', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[NextAuth Debug]', code, metadata);
      }
    }
  }
};

export default NextAuth(authOptions);
