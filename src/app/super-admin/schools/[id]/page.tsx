"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, ArrowLeft, Building2, Mail, Phone, Globe, Users, UserCheck, Calendar, CreditCard, Activity, BarChart3 } from "lucide-react"

interface SchoolDetail {
  id: string; name: string; address?: string; phone?: string; email?: string; website?: string; logo?: string
  isActive: boolean; createdAt: string
  _count?: { teachers: number; students: number; classes: number }
  subscription?: { status: string; package?: { name: string }; endDate?: string }
  admin?: { name: string; email: string }
}

export default function SuperAdminSchoolDetailPage() {
  const router = useRouter(); const params = useParams()
  const schoolId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)
  const [school, setSchool] = useState<SchoolDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teachers, setTeachers] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])

  useEffect(() => {
    if (!schoolId) return
    const load = async () => {
      try {
        const res = await fetch(`/api/super-admin/schools/${schoolId}`)
        if (res.ok) {
          const data = await res.json()
          setSchool(data.school || data)
          setTeachers(data.teachers || [])
          setSubscriptions(data.subscriptions || [])
        } else setError('Failed to load school')
      } catch { setError('Failed to load school') }
      finally { setLoading(false) }
    }
    load()
  }, [schoolId])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>
  if (error || !school) return (
    <div className="max-w-6xl mx-auto p-6">
      <Button variant="outline" onClick={() => router.push('/super-admin/schools')} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <Card><CardContent className="p-8 text-center text-red-600">{error}</CardContent></Card>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Button variant="outline" onClick={() => router.push('/super-admin/schools')}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{school.name}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1 flex-wrap">
                  {school.email && <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1" />{school.email}</span>}
                  {school.phone && <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1" />{school.phone}</span>}
                  {school.address && <span>{school.address}</span>}
                </div>
              </div>
            </div>
            <Badge className={school.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{school.isActive ? 'Active' : 'Inactive'}</Badge>
          </div>
        </CardContent>
      </Card>

      {school._count && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow bg-gradient-to-br from-blue-50 to-indigo-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{school._count.teachers}</p><p className="text-xs text-gray-600">Teachers</p></CardContent></Card>
          <Card className="border-0 shadow bg-gradient-to-br from-green-50 to-emerald-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{school._count.students}</p><p className="text-xs text-gray-600">Students</p></CardContent></Card>
          <Card className="border-0 shadow bg-gradient-to-br from-purple-50 to-pink-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-purple-600">{school._count.classes}</p><p className="text-xs text-gray-600">Classes</p></CardContent></Card>
          <Card className="border-0 shadow bg-gradient-to-br from-amber-50 to-orange-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{subscriptions.length}</p><p className="text-xs text-gray-600">Subscriptions</p></CardContent></Card>
          <Card className="border-0 shadow bg-gradient-to-br from-cyan-50 to-teal-50"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-cyan-600">{new Date(school.createdAt).toLocaleDateString()}</p><p className="text-xs text-gray-600">Created</p></CardContent></Card>
        </div>
      )}

      <Tabs defaultValue="teachers">
        <TabsList>
          <TabsTrigger value="teachers"><Users className="w-4 h-4 mr-2" />Teachers ({teachers.length})</TabsTrigger>
          <TabsTrigger value="subscriptions"><CreditCard className="w-4 h-4 mr-2" />Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="teachers">
          <Card className="border-0 shadow">
            <CardContent className="p-0">
              {teachers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No teachers</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>{t.email}</TableCell>
                        <TableCell>{t._count?.students || 0}</TableCell>
                        <TableCell><Badge variant={t.isActive ? 'default' : 'secondary'}>{t.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card className="border-0 shadow">
            <CardContent className="p-0">
              {subscriptions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No active subscriptions</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.package?.name || 'N/A'}</TableCell>
                        <TableCell><Badge>{s.status}</Badge></TableCell>
                        <TableCell className="text-sm">{new Date(s.startDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm">{s.endDate ? new Date(s.endDate).toLocaleDateString() : 'Ongoing'}</TableCell>
                        <TableCell>KES {s.amount?.toLocaleString() || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
