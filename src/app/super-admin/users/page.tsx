"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CreateUserModal } from "@/components/modals/create-user-modal"
import { UserDetailsModal } from "@/components/modals/user-details-modal"
import { useToast } from "@/hooks/use-toast"
import { useDeleteConfirmation } from "@/components/ui/delete-confirmation-dialog"
import {
  Search, Plus, Users, User, School, GraduationCap, Shield, Mail, Phone,
  Eye, Trash2, Loader2, ChevronLeft, ChevronRight, RefreshCw, X,
  Calendar, Sparkles, Building2, Home
} from "lucide-react"

interface User {
  id: string; username: string; firstName: string; lastName: string; email: string
  phone?: string; role: string; isActive: boolean; createdAt: string
  lastLogin?: string; avatar?: string
  schoolAdmin?: { school: { id: string; name: string } }
  teacher?: { school: { id: string; name: string } }
  student?: { school: { id: string; name: string } }
  parent?: { schoolId: string | null }
}

interface UserStats {
  total: number; active: number; superAdmins: number; schoolAdmins: number
  teachers: number; students: number; parents: number
}

const ROLE_CONFIG = {
  SUPER_ADMIN:  { label: 'Super Admin',  icon: Shield,    gradient: 'from-red-500 to-rose-600',  bg: 'bg-red-50',  text: 'text-red-700',  border: 'border-red-200',  dot: 'bg-red-500',  ring: 'ring-red-200',  initialsText: 'text-red-600' },
  SCHOOL_ADMIN: { label: 'School Admin', icon: School,    gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-700',  border: 'border-blue-200',  dot: 'bg-blue-500',  ring: 'ring-blue-200',  initialsText: 'text-blue-600' },
  TEACHER:      { label: 'Teacher',      icon: GraduationCap, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', ring: 'ring-emerald-200', initialsText: 'text-emerald-600' },
  STUDENT:      { label: 'Student',      icon: User,       gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500',  ring: 'ring-violet-200', initialsText: 'text-violet-600' },
  PARENT:       { label: 'Parent',       icon: Users,      gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500',  ring: 'ring-amber-200',  initialsText: 'text-amber-600' },
} as const

const ROLES = ['all', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] as const

const STAT_CARDS = [
  { key: 'total',    label: 'Total Users',   icon: Users,         gradient: 'from-blue-600 to-indigo-600', light: 'bg-blue-50' },
  { key: 'active',   label: 'Active',        icon: Sparkles,      gradient: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50' },
  { key: 'superAdmins',  label: 'Super Admins',  icon: Shield,    gradient: 'from-red-500 to-rose-600',    light: 'bg-red-50' },
  { key: 'schoolAdmins', label: 'School Admins', icon: School,    gradient: 'from-blue-500 to-indigo-600',  light: 'bg-blue-50' },
  { key: 'teachers', label: 'Teachers',     icon: GraduationCap,  gradient: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50' },
  { key: 'students', label: 'Students',     icon: User,          gradient: 'from-violet-500 to-purple-600', light: 'bg-violet-50' },
] as const

export default function UsersPage() {
  const { toast } = useToast()
  const { showDeleteConfirmation, DeleteConfirmationDialog } = useDeleteConfirmation()

  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 0 })
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetch('/api/users/stats').then(r => r.ok && r.json()).then(setStats).catch(() => {})
  }, [])

  const fetchUsers = useCallback(async (page = 1, refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(pagination.limit),
        ...(search && { search }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sortBy: 'createdAt', sortOrder: 'desc',
      })
      const res = await fetch(`/api/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setPagination(data.pagination)
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch users' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch users' })
    } finally { setLoading(false); setRefreshing(false) }
  }, [search, roleFilter, statusFilter, pagination.limit, toast])

  useEffect(() => { fetchUsers(1) }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(1), 400)
    return () => clearTimeout(t)
  }, [search, roleFilter, statusFilter])

  const handleStatusToggle = async (id: string, current: boolean) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    })
    if (res.ok) {
      const updated = await res.json()
      setUsers(prev => prev.map(u => u.id === id ? updated : u))
      toast({ title: `User ${!current ? 'activated' : 'deactivated'}` })
    } else {
      const err = await res.json()
      toast({ variant: 'destructive', title: 'Error', description: err.error })
    }
  }

  const handleDelete = async (userId: string, userName: string) => {
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== userId))
      toast({ title: 'Deleted', description: `${userName} removed permanently.` })
    } else {
      const err = await res.json()
      toast({ variant: 'destructive', title: 'Error', description: err.error })
    }
  }

  const schoolName = (user: User) =>
    user.schoolAdmin?.school?.name || user.teacher?.school?.name || user.student?.school?.name || null

  const isIndependent = (user: User) => {
    if (user.role === 'PARENT') return !user.parent?.schoolId && !schoolName(user)
    if (user.role === 'TEACHER') return !user.teacher?.school?.id && !schoolName(user)
    if (user.role === 'STUDENT') return !user.student?.school?.id && !schoolName(user)
    return false
  }

  const roleCfg = (role: string) => (ROLE_CONFIG as any)[role] || ROLE_CONFIG.PARENT

  return (
    <div className={`space-y-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Users</h1>
              </div>
              <p className="text-sm text-slate-400 ml-0.5">
                {stats
                  ? <><span className="text-white font-semibold">{stats.total}</span> total · <span className="text-emerald-400 font-semibold">{stats.active}</span> active across all schools</>
                  : 'Loading platform statistics...'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => fetchUsers(pagination.page, true)}
                disabled={refreshing}
                className="bg-white/10 hover:bg-white/20 text-white border-white/10">
                <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}
                className="bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-lg shadow-black/20">
                <Plus className="w-4 h-4 mr-1.5" />
                Add User
              </Button>
            </div>
          </div>

          {/* ── Search ── */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone…"
              className="pl-10 h-10 bg-white/10 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 focus-visible:border-blue-500 text-sm rounded-xl" />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAT_CARDS.map((s, i) => (
            <div key={s.key}
              className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-4 overflow-hidden"
              style={{ animation: `fadeSlideUp 0.4s ease-out ${i * 0.06}s both` }}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br opacity-[0.03] pointer-events-none" />
              <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 rounded-lg ${s.light} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                  <s.icon className={`w-4 h-4 ${s.gradient.split(' ')[0].replace('from-', 'text-')}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-none mb-0.5 tracking-tight">{stats[s.key as keyof UserStats]}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Role + Status filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        {ROLES.map(r => {
          const active = roleFilter === r
          const cfg = r === 'all' ? null : roleCfg(r)
          return (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                active
                  ? r === 'all'
                    ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                    : `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm scale-105`
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}>
              {r !== 'all' && <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />}
              {r === 'all' ? 'All Roles' : cfg.label}
            </button>
          )
        })}
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
            statusFilter === 'active'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}>
          <div className={`w-2 h-2 rounded-full ${statusFilter === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
          Active
        </button>
        <button onClick={() => setStatusFilter(statusFilter === 'inactive' ? 'all' : 'inactive')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
            statusFilter === 'inactive'
              ? 'bg-red-50 text-red-700 border-red-200 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}>
          <div className={`w-2 h-2 rounded-full ${statusFilter === 'inactive' ? 'bg-red-500' : 'bg-gray-300'}`} />
          Inactive
        </button>
        {(roleFilter !== 'all' || statusFilter !== 'all') && (
          <button onClick={() => { setRoleFilter('all'); setStatusFilter('all') }}
            className="text-xs text-gray-400 hover:text-gray-600 ml-1 underline underline-offset-2">
            Clear
          </button>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-gray-500 font-medium">Loading users…</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold text-lg mb-1">No users found</p>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
            {search || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria above'
              : 'Your platform is empty. Add your first user to get started.'}
          </p>
          {!search && roleFilter === 'all' && statusFilter === 'all' && (
            <Button size="sm" onClick={() => setCreateOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20">
              <Plus className="w-4 h-4 mr-1.5" /> Add Your First User
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* ── User Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {users.map((user, i) => {
              const cfg = roleCfg(user.role)
              const school = schoolName(user)
              const initials = `${user.firstName[0]}${user.lastName[0]}`
              const joined = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              return (
                <div key={user.id}
                  className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-5 cursor-pointer"
                  style={{ animation: `fadeSlideUp 0.4s ease-out ${i * 0.04}s both` }}
                  onClick={() => { setSelectedId(user.id); setDetailOpen(true) }}>
                  <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setSelectedId(user.id); setDetailOpen(true) }}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="View details">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() =>
                      showDeleteConfirmation('Delete User',
                        `${user.firstName} ${user.lastName} will be permanently removed.`,
                        `${user.firstName} ${user.lastName}`,
                        () => handleDelete(user.id, `${user.firstName} ${user.lastName}`)
                      )}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-start gap-4 mb-3">
                    <div className="relative w-12 h-12 shrink-0">
                      <div className={`w-12 h-12 rounded-full bg-white shadow-sm ring-2 ring-offset-2 ring-offset-white ${cfg.ring} flex items-center justify-center overflow-hidden`}>
                        {user.avatar
                          ? <img src={user.avatar} alt="" className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.textContent = initials }} />
                          : <span className={`text-xs font-semibold ${cfg.initialsText}`}>{initials}</span>}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
                        <span className="text-gray-300">@</span>{user.username}
                      </p>
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 shrink-0" /> {user.email}
                      </p>
                      {user.phone && (
                        <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 shrink-0" /> {user.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      <cfg.icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    {school && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-100">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{school}</span>
                      </span>
                    )}
                    {isIndependent(user) && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <Home className="w-3 h-3" />
                        Independent
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-gray-50">
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <div className={`relative w-7 h-4 rounded-full transition-colors duration-200 cursor-pointer ${user.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        onClick={() => handleStatusToggle(user.id, user.isActive)}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-200 ${user.isActive ? 'left-3.5' : 'left-0.5'}`} />
                      </div>
                      <span className={`text-xs font-medium ${user.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {joined}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Pagination ── */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3">
              <p className="text-sm text-gray-500">
                Page <span className="font-medium text-gray-700">{pagination.page}</span> of{' '}
                <span className="font-medium text-gray-700">{pagination.pages}</span>
                {' · '}
                <span className="text-gray-400">{pagination.total} total</span>
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page === 1}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1)
                  .map((p, i, arr) => (
                    <span key={p} className="flex items-center">
                      {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-gray-300 text-xs">…</span>}
                      <button onClick={() => fetchUsers(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                          p === pagination.page
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}>
                        {p}
                      </button>
                    </span>
                  ))}
                <button onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page === pagination.pages}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modals ── */}
      <CreateUserModal isOpen={createOpen} onClose={() => setCreateOpen(false)}
        onUserCreated={(u) => { setUsers(prev => [u, ...prev]) }} />
      <UserDetailsModal isOpen={detailOpen} onClose={() => { setDetailOpen(false); setSelectedId(null) }}
        userId={selectedId} onUserUpdated={(u) => setUsers(prev => prev.map(x => x.id === u.id ? u : x))}
        onUserDeleted={(id) => setUsers(prev => prev.filter(x => x.id !== id))} />
      <DeleteConfirmationDialog />

      {/* ── Animations ── */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
