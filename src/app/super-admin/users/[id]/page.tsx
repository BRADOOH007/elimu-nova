"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, ArrowLeft, User, Mail, Phone, MapPin, Shield, Calendar, Activity, Key } from "lucide-react"

interface UserDetail {
  id: string; firstName: string; lastName: string; email: string
  phone?: string; address?: string; role: string; isActive: boolean
  createdAt: string; avatar?: string
  school?: { id: string; name: string } | null
  securityLogs?: Array<{ id: string; eventType: string; severity: string; createdAt: string; description: string }>
}

export default function SuperAdminUserDetailPage() {
  const router = useRouter(); const params = useParams()
  const userId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    const load = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`)
        if (res.ok) {
          const data = await res.json()
          setUser(data.user || data)
        } else throw new Error('Not found')
      } catch { setError('User not found') }
      finally { setLoading(false) }
    }
    load()
  }, [userId])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>
  if (error || !user) return (
    <div className="max-w-4xl mx-auto p-6">
      <Button variant="outline" onClick={() => router.push('/super-admin/users')} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <Card><CardContent className="p-8 text-center text-red-600">{error}</CardContent></Card>
    </div>
  )

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-800',
    SCHOOL_ADMIN: 'bg-purple-100 text-purple-800',
    TEACHER: 'bg-blue-100 text-blue-800',
    STUDENT: 'bg-green-100 text-green-800',
    PARENT: 'bg-amber-100 text-amber-800'
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="outline" onClick={() => router.push('/super-admin/users')}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user.firstName} {user.lastName}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1 flex-wrap">
                  <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1" />{user.email}</span>
                  {user.phone && <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1" />{user.phone}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={roleColors[user.role] || 'bg-gray-100 text-gray-800'}>{user.role.replace('_', ' ')}</Badge>
              <Badge variant={user.isActive ? 'default' : 'secondary'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
          </div>
          {user.address && <p className="flex items-center text-sm text-gray-500 mt-2"><MapPin className="w-3.5 h-3.5 mr-1" />{user.address}</p>}
          {user.school && <p className="flex items-center text-sm text-gray-500 mt-1"><Shield className="w-3.5 h-3.5 mr-1" />School: {user.school.name}</p>}
          <p className="flex items-center text-sm text-gray-500 mt-1"><Calendar className="w-3.5 h-3.5 mr-1" />Joined {new Date(user.createdAt).toLocaleDateString()}</p>
        </CardContent>
      </Card>

      {user.securityLogs && user.securityLogs.length > 0 && (
        <Card className="border-0 shadow">
          <CardContent className="p-0">
            <div className="p-4 border-b font-semibold flex items-center gap-2"><Activity className="w-4 h-4" /> Recent Activity</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.securityLogs.slice(0, 20).map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium text-sm">{log.eventType.replace(/_/g, ' ')}</TableCell>
                    <TableCell><Badge variant={log.severity === 'CRITICAL' || log.severity === 'HIGH' ? 'destructive' : 'secondary'}>{log.severity}</Badge></TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">{log.description}</TableCell>
                    <TableCell className="text-sm">{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
