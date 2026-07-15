import { useState, useEffect } from 'react'
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

export function useSchoolInfo() {
  const { data: session, status } = useSession()
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isIndependent, setIsIndependent] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      setLoading(false)
      return
    }

    const fetchSchoolInfo = async () => {
      try {
        setLoading(true)
        setError(null)

        let endpoint = ''
        switch (session.user.role) {
          case 'SCHOOL_ADMIN':
            endpoint = '/api/school-admin/school-info'
            break
          case 'TEACHER':
            endpoint = '/api/teacher/school-info'
            break
          case 'STUDENT':
            endpoint = '/api/student/school-info'
            break
          default:
            // PARENT, SUPER_ADMIN etc. — no school info needed
            setIsIndependent(false)
            return
        }

        // 8-second timeout so the app never hangs indefinitely
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        const response = await fetch(endpoint, { signal: controller.signal })
        clearTimeout(timeoutId)
        if (!response.ok) {
          // If no school info found, user is independent
          if (response.status === 404) {
            setIsIndependent(true)
            setSchoolInfo(null)
            return
          }
          throw new Error('Failed to fetch school information')
        }

        const data = await response.json()
        setSchoolInfo(data)
        setIsIndependent(false)
      } catch (err) {
        // Abort/timeout or network error — assume independent mode for students/teachers
        const isAbort = err instanceof Error && err.name === 'AbortError'
        if (isAbort) console.warn('School info fetch timed out — defaulting to independent mode')
        else console.error('Error fetching school info:', err)

        if (session.user.role === 'TEACHER' || session.user.role === 'STUDENT') {
          setIsIndependent(true)
          setSchoolInfo(null)
          setError(null)
        } else {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSchoolInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, session?.user?.role, status])

  return { schoolInfo, loading, error, isIndependent }
}
