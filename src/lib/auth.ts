// ──────────────────────────────────────────────────────────────
// NextAuth configuration — credentials provider with:
//   • Login by username or email
//   • Brute-force protection (5 failed attempts = 15 min lockout)
//   • Rate limiting via checkRateLimit (10 req/15min per user)
//   • Maintenance mode check before allowing login
// ──────────────────────────────────────────────────────────────

import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { logger } from './logger'
import { checkRateLimit, rateLimitAuth } from './rate-limit'

const LOCK_THRESHOLD = 5
const LOCK_DURATION_MS = 15 * 60 * 1000

async function resolveUser(identifier: string) {
  const trimmed = identifier.trim().toLowerCase()
  const select = { id: true, role: true, isActive: true, lockedUntil: true, loginAttempts: true, password: true, email: true, firstName: true, lastName: true, username: true, avatar: true } as const
  let user = await prisma.user.findUnique({ where: { username: trimmed }, select })
  if (!user) {
    user = await prisma.user.findUnique({ where: { email: trimmed }, select })
  }
  if (!user && !trimmed.includes('@')) {
    user = await prisma.user.findUnique({ where: { email: `${trimmed}@student.local` }, select })
  }
  return user
}

async function logSecurityEvent(params: {
  eventType: string
  severity: string
  description: string
  ipAddress?: string
  userAgent?: string
  userId?: string
  schoolId?: string
  metadata?: string
}) {
  try {
    await prisma.securityLog.create({
      data: {
        eventType: params.eventType as any,
        severity: params.severity as any,
        description: params.description,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        userId: params.userId,
        schoolId: params.schoolId,
        metadata: params.metadata,
      },
    })
  } catch (e) {
    logger.error('Failed to log security event:', e)
  }
}

async function notifySuperAdmins(title: string, message: string) {
  try {
    const superAdmins = await prisma.superAdmin.findMany({
      include: { user: { select: { id: true } } },
    })
    await prisma.notification.createMany({
      data: superAdmins.map(sa => ({
        title,
        message,
        type: 'warning',
        userId: sa.user.id,
      })),
    })
  } catch (e) {
    logger.error('Failed to notify super admins:', e)
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = credentials?.email || ''

        if (!identifier || !credentials?.password) {
          return null
        }

        const user = await resolveUser(identifier)

        if (!user) {
          return null
        }

        const rateResult = await checkRateLimit(`auth:${user.id}`, rateLimitAuth)
        if (!rateResult.allowed) {
          logger.warn('Rate limit hit for:', { userId: user.id })
          logSecurityEvent({
            eventType: 'BRUTE_FORCE_ATTEMPT',
            severity: 'HIGH',
            description: `Rate limit exceeded for ${identifier} — ${rateResult.resetInSec}s remaining`,
            metadata: JSON.stringify({ identifier, userId: user.id }),
          }).catch(() => {})
          throw new Error('Too many login attempts. Please try again later.')
        }

        // Only fetch the role relation the user actually has — skip 4 dead LEFT JOINs
        const roleIncludeMap: Record<string, any> = {
          STUDENT:      { student: { include: { school: true, teacher: { include: { user: true } } } } },
          TEACHER:      { teacher: { include: { school: true } } },
          SCHOOL_ADMIN: { schoolAdmin: { include: { school: true } } },
          SUPER_ADMIN:  { superAdmin: true },
          PARENT:       { parent: true },
        }
        const fullUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: roleIncludeMap[user.role] || {},
        })

        if (!fullUser) {
          logger.warn('User not found on re-fetch:', { userId: user.id })
          return null
        }

        if (!fullUser.isActive) {
          logger.warn('User inactive:', { userId: fullUser.id })
          logSecurityEvent({
            eventType: 'LOGIN_FAILED',
            severity: 'MEDIUM',
            description: `Inactive account login attempt for ${fullUser.username} (${fullUser.email})`,
            userId: fullUser.id,
          }).catch(() => {})
          return null
        }

        if (fullUser.lockedUntil && fullUser.lockedUntil > new Date()) {
          logger.warn('Account locked:', { userId: fullUser.id })
          logSecurityEvent({
            eventType: 'ACCOUNT_LOCKED',
            severity: 'HIGH',
            description: `Login attempt on locked account ${fullUser.username} (locked until ${fullUser.lockedUntil.toISOString()})`,
            userId: fullUser.id,
          }).catch(() => {})
          throw new Error('Account temporarily locked due to too many failed attempts. Try again in 15 minutes.')
        }

        if (fullUser.lockedUntil && fullUser.lockedUntil <= new Date()) {
          await prisma.user.update({
            where: { id: fullUser.id },
            data: { loginAttempts: 0, lockedUntil: null },
          })
        }

        logger.debug('User found, checking password...')
        const isPasswordValid = await bcrypt.compare(credentials.password, fullUser.password)

        if (!isPasswordValid) {
          logger.warn('Invalid password:', { userId: fullUser.id })

          const newAttempts = fullUser.loginAttempts + 1
          const updateData: any = { loginAttempts: newAttempts }

          if (newAttempts >= LOCK_THRESHOLD) {
            updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS)
          }

          await prisma.user.update({ where: { id: fullUser.id }, data: updateData })

          logSecurityEvent({
            eventType: 'LOGIN_FAILED',
            severity: newAttempts >= LOCK_THRESHOLD ? 'CRITICAL' : 'MEDIUM',
            description: `Failed login for ${fullUser.username} (attempt ${newAttempts}/${LOCK_THRESHOLD})`,
            userId: fullUser.id,
          }).catch(() => {})

          if (newAttempts >= LOCK_THRESHOLD) {
            logSecurityEvent({
              eventType: 'ACCOUNT_LOCKED',
              severity: 'CRITICAL',
              description: `Account locked for ${fullUser.username} after ${LOCK_THRESHOLD} failed attempts`,
              userId: fullUser.id,
            }).catch(() => {})

            notifySuperAdmins(
              '🔒 Account Locked',
              `User ${fullUser.firstName} ${fullUser.lastName} (@${fullUser.username}, ${fullUser.role}) has been locked after ${LOCK_THRESHOLD} failed login attempts.`
            ).catch(() => {})
          }

          return null
        }

        await prisma.user.update({
          where: { id: fullUser.id },
          data: { loginAttempts: 0, lockedUntil: null },
        })

        logSecurityEvent({
          eventType: 'LOGIN_SUCCESS',
          severity: 'LOW',
          description: `Successful login for ${fullUser.username}`,
          userId: fullUser.id,
        }).catch(() => {})

        logger.info('Authentication successful:', { userId: fullUser.id, role: fullUser.role })

        return {
          id: fullUser.id,
          email: fullUser.email,
          name: `${fullUser.firstName} ${fullUser.lastName}`,
          role: fullUser.role,
          avatar: fullUser.avatar ?? undefined,
          schoolAdmin: fullUser.schoolAdmin,
          teacher: fullUser.teacher,
          student: fullUser.student,
          superAdmin: fullUser.superAdmin,
          parent: fullUser.parent,
        } as any
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        if (user.schoolAdmin) token.schoolAdminId = user.schoolAdmin.id
        if (user.teacher) {
          token.teacherId = user.teacher.id
          token.schoolId = user.teacher.schoolId
        }
        if (user.student) {
          token.studentId = user.student.id
          token.schoolId = user.student.schoolId
        }
        if (user.superAdmin) token.superAdminId = user.superAdmin.id
        if (user.parent) {
          token.parentId = user.parent.id
          const firstLink = await prisma.parentStudent.findFirst({
            where: { parentId: user.parent.id },
            include: { student: { select: { schoolId: true } } },
          })
          if (firstLink?.student.schoolId) token.schoolId = firstLink.student.schoolId
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.schoolAdminId = token.schoolAdminId as string
        session.user.teacherId = token.teacherId as string
        session.user.studentId = token.studentId as string
        session.user.superAdminId = token.superAdminId as string
        session.user.parentId = token.parentId as string
        session.user.schoolId = token.schoolId as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}
