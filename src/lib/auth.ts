import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

/** Resolve a login identifier (email or username) to a full email for DB lookup.
 *  Students may log in with just their username (the part before @student.local).
 */
async function resolveLoginEmail(identifier: string): Promise<string> {
  const trimmed = identifier.trim().toLowerCase()

  // If it looks like a full email, use it directly
  if (trimmed.includes('@')) return trimmed

  // Otherwise treat it as a student username — append the domain
  return `${trimmed}@student.local`
}

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma) as any, // Commented out for JWT strategy
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔍 Auth attempt:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        const loginEmail = await resolveLoginEmail(credentials.email)
        console.log('🔍 Resolved login email:', loginEmail)

        const user = await prisma.user.findUnique({
          where: {
            email: loginEmail
          },
          include: {
            schoolAdmin: {
              include: {
                school: true
              }
            },
            teacher: {
              include: {
                school: true
              }
            },
            student: {
              include: {
                school: true,
                teacher: {
                  include: {
                    user: true
                  }
                }
              }
            },
            superAdmin: true,
            parent: true
          }
        })

        if (!user) {
          console.log('❌ User not found for:', loginEmail)
          return null
        }
        
        if (!user.isActive) {
          console.log('❌ User inactive')
          return null
        }

        console.log('✅ User found, checking password...')
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          console.log('❌ Invalid password')
          return null
        }
        
        console.log('✅ Authentication successful!')

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          avatar: user.avatar ?? undefined,
          schoolAdmin: user.schoolAdmin,
          teacher: user.teacher,
          student: user.student,
          superAdmin: user.superAdmin,
          parent: user.parent
        } as any
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Only store essential data in JWT to avoid header size issues
        token.role = user.role
        // Store only IDs, not full objects
        if (user.schoolAdmin) {
          token.schoolAdminId = user.schoolAdmin.id
        }
        if (user.teacher) {
          token.teacherId = user.teacher.id
        }
        if (user.student) {
          token.studentId = user.student.id
        }
        if (user.superAdmin) {
          token.superAdminId = user.superAdmin.id
        }
        if (user.parent) {
          token.parentId = user.parent.id
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        // Store IDs instead of full objects to reduce session size
        session.user.schoolAdminId = token.schoolAdminId as string
        session.user.teacherId = token.teacherId as string
        session.user.studentId = token.studentId as string
        session.user.superAdminId = token.superAdminId as string
        session.user.parentId = token.parentId as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error:  '/auth/error'
  }
}
