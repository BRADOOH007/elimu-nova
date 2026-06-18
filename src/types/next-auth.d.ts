import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      avatar?: string
      schoolAdminId?: string
      teacherId?: string
      studentId?: string
      superAdminId?: string
      parentId?: string
      // Keep these for backward compatibility but they won't be in JWT
      schoolAdmin?: any
      teacher?: any
      student?: any
      superAdmin?: any
      parent?: any
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    avatar?: string
    schoolAdmin?: any
    teacher?: any
    student?: any
    superAdmin?: any
    parent?: any
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    schoolAdminId?: string
    teacherId?: string
    studentId?: string
    superAdminId?: string
    parentId?: string
  }
}
