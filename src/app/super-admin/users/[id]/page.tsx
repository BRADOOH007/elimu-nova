"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2, ArrowLeft, User, Mail, Phone, MapPin, Shield, Calendar, Activity, Key,
  Eye, EyeOff, Copy, Check, RefreshCw, X
} from "lucide-react"

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
  const [showAvatar, setShowAvatar] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [revealedPwd, setRevealedPwd] = useState<string | null>(null)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdError, setPwdError] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

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

  const fetchPassword = async () => {
    setPwdLoading(true)
    setPwdError(null)
    try {
      const res = await fetch(`/api/users/${userId}/password`)
      const data = await res.json()
      if (res.ok && data.password) {
        setRevealedPwd(data.password)
        setShowPwd(true)
      } else if (res.ok && !data.password) {
        setPwdError('No stored password found. Use "Regenerate" to set a new one.')
      } else {
        setPwdError(data.error || 'Failed to fetch password')
      }
    } catch {
      setPwdError('Failed to fetch password')
    } finally { setPwdLoading(false) }
  }

  const handleRegenerate = async () => {
    if (!confirm('Regenerate password for this user? The current password will be replaced.')) return
    setRegenerating(true)
    try {
      const res = await fetch(`/api/users/${userId}/regenerate-password`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setRevealedPwd(data.password)
        setShowPwd(true)
        setPwdError(null)
        toast({ title: 'Password Regenerated', description: 'New password has been set.' })
      } else {
        toast({ title: 'Failed', description: data.error || 'Something went wrong', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Failed', variant: 'destructive' })
    } finally { setRegenerating(false) }
  }

  const copyCredentials = () => {
    if (!user || !revealedPwd) return
    navigator.clipboard.writeText(`Email: ${user.email}\nPassword: ${revealedPwd}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Copied!', description: 'Credentials copied to clipboard.' })
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-pulse">
      <div className="h-9 w-20 bg-slate-200 rounded-lg" />
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-200 rounded-full" />
          <div className="space-y-2"><div className="h-6 w-40 bg-slate-200 rounded" /><div className="h-4 w-56 bg-slate-200 rounded" /></div>
        </div>
      </div>
    </div>
  )
  if (error || !user) return (
    <div className="max-w-4xl mx-auto p-6">
      <Button variant="outline" onClick={() => router.push('/super-admin/users')} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <Card><CardContent className="p-8 text-center text-red-600">{error}</CardContent></Card>
    </div>
  )

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-800', SCHOOL_ADMIN: 'bg-purple-100 text-purple-800',
    TEACHER: 'bg-blue-100 text-blue-800', STUDENT: 'bg-green-100 text-green-800', PARENT: 'bg-amber-100 text-amber-800'
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="outline" onClick={() => router.push('/super-admin/users')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      {/* Profile Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xl font-semibold overflow-hidden cursor-pointer ring-1 ring-slate-300 hover:ring-2 hover:ring-slate-400 transition-all"
                onClick={() => user.avatar && setShowAvatar(true)}
                title={user.avatar ? 'Click to enlarge' : undefined}
              >
                {user.avatar ? <img src={user.avatar} alt="" className="w-full h-full object-cover" /> : `${user.firstName[0]}${user.lastName[0]}`}
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
          {user.school && <p className="flex items-center text-sm text-gray-500 mt-2"><Shield className="w-3.5 h-3.5 mr-1" />School: {user.school.name}</p>}
          <p className="flex items-center text-sm text-gray-500 mt-1"><Calendar className="w-3.5 h-3.5 mr-1" />Joined {new Date(user.createdAt).toLocaleDateString()}</p>
        </CardContent>
      </Card>

      {/* Password Management Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-yellow-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Key className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Password Management</h2>
                <p className="text-xs text-gray-500">View, copy, or regenerate the user's password</p>
              </div>
            </div>
          </div>

          {/* Password Reveal */}
          <div className="bg-white rounded-xl border border-amber-200 p-4 mb-4">
            {!showPwd ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Eye className="w-4 h-4 text-amber-500" />
                <span>Password is hidden. Click "Show Password" to reveal.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</span>
                  <span className="text-sm text-gray-900 font-medium">{user.email}</span>
                </div>
                <div className="border-t border-gray-100" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Password</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {revealedPwd}
                    </code>
                    <button onClick={() => setShowPwd(false)} className="text-gray-400 hover:text-gray-600">
                      <EyeOff className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {pwdError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <X className="w-4 h-4 shrink-0" /> {pwdError}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchPassword}
              disabled={pwdLoading}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              {pwdLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
              Show Password
            </Button>
            {revealedPwd && (
              <Button size="sm" variant="outline" onClick={copyCredentials} className="border-amber-300 text-amber-700 hover:bg-amber-50">
                {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                {copied ? 'Copied!' : 'Copy Credentials'}
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            >
              {regenerating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
              Regenerate Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Logs */}
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

      {/* Avatar lightbox */}
      {showAvatar && user?.avatar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowAvatar(false)}>
          <div className="relative max-w-lg max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAvatar(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10">
              <X className="w-4 h-4" />
            </button>
            <img src={user.avatar} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-contain max-h-[75vh]" />
          </div>
        </div>
      )}
    </div>
  )
}
