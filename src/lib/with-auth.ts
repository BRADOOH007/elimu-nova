import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AuthenticationError, AuthorizationError } from '@/lib/api-errors'

type Role = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'

export async function requireAuth(): Promise<{ id: string; email: string; role: string; name: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new AuthenticationError()
  return {
    id: session.user.id,
    email: session.user.email || '',
    role: session.user.role || '',
    name: session.user.name || '',
  }
}

export async function requireRole(allowedRoles: Role[]): Promise<{ id: string; email: string; role: string; name: string }> {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role as Role)) {
    throw new AuthorizationError(`Access denied. Required role: ${allowedRoles.join(' or ')}`)
  }
  return user
}

export async function requireTeacher(): Promise<{ id: string; email: string; role: string; name: string }> {
  return requireRole(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'])
}

export async function requireSuperAdmin(): Promise<{ id: string; email: string; role: string; name: string }> {
  return requireRole(['SUPER_ADMIN'])
}
