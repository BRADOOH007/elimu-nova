import useSWR from 'swr'
import { useSession } from 'next-auth/react'

interface SchoolInfo {
  school: {
    id: string
    name: string
    address?: string
    phone?: string
    email?: string
    website?: string
    logo?: string
    createdAt: string
  }
  admin?: {
    firstName: string
    lastName: string
    email: string
  }
  teacher?: {
    firstName: string
    lastName: string
    email: string
  }
  student?: {
    firstName: string
    lastName: string
    email: string
  }
}

const fetcher = async (url: string) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error('Failed to fetch school information')
    }
    return await response.json()
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

export function useSchoolInfo() {
  const { data: session, status } = useSession()

  let endpoint: string | null = null
  switch (session?.user?.role) {
    case 'SCHOOL_ADMIN':
      endpoint = '/api/school-admin/school-info'
      break
    case 'TEACHER':
      endpoint = '/api/teacher/school-info'
      break
    case 'STUDENT':
      endpoint = '/api/student/school-info'
      break
    case 'PARENT':
      endpoint = '/api/parent/school-info'
      break
    default:
      endpoint = null
  }

  const ready = status !== 'loading' && !!endpoint
  const { data, error, isLoading } = useSWR<SchoolInfo | null>(
    ready ? endpoint : null,
    fetcher,
    { revalidateOnFocus: false },
  )

  const schoolInfo = data || null
  const isIndependent = ready && (data === null || (session?.user?.role === 'TEACHER' || session?.user?.role === 'STUDENT') && !!error)

  return { schoolInfo, loading: isLoading && ready, error: error ? (error instanceof Error ? error.message : 'Unknown error') : null, isIndependent }
}
