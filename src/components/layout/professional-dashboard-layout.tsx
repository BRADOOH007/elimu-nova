"use client"

import React, { useState, useEffect } from 'react'
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import {
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Leaf,
  Inbox,
  Search
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { NotificationsModal } from "@/components/modals/notifications-modal"
import { SettingsModal } from "@/components/modals/settings-modal"
import { UserProfileModal } from "@/components/modals/user-profile-modal"
import { SearchResultsModal } from "@/components/modals/search-results-modal"
import { DashboardSplash } from "@/components/ui/dashboard-splash"
import { IdleLogoutWarning } from "@/components/ui/idle-logout-warning"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { OfflineBanner } from "@/components/ui/offline-banner"
import { SkipToContent } from "@/components/ui/skip-to-content"
import ActiveMeetingBanner from "@/components/layout/active-meeting-banner"
import { useUnreadMessages } from '@/hooks/use-unread-messages'
import { useSubscription } from '@/hooks/use-subscription'
import { useDataSaver } from '@/components/providers/data-saver-provider'
import { TourProvider } from '@/components/tour/TourProvider'
import { TourOverlay } from '@/components/tour/TourOverlay'
import { TourTooltip } from '@/components/tour/TourTooltip'
import { TourLauncher } from '@/components/tour/TourLauncher'
import { useTour } from '@/components/tour/TourProvider'
import { useTourState } from '@/components/tour/useTourState'

function TourCompletionMonitor({ userRole }: { userRole: string }) {
  const { isActive } = useTour()
  const { markCompleted } = useTourState()
  const prevActiveRef = React.useRef(false)

  useEffect(() => {
    if (prevActiveRef.current && !isActive) {
      markCompleted(userRole)
      localStorage.setItem(`tour-${userRole.toLowerCase()}-completed`, new Date().toISOString())
    }
    prevActiveRef.current = isActive
  }, [isActive, userRole, markCompleted])

  return null
}

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'SENIOR_STUDENT' | 'SENIOR_TEACHER'
  userName: string
  userEmail: string
  schoolName?: string
  sidebarItems: Array<{
    icon: React.ComponentType<any>
    label: string
    href: string
    badge?: number
    tourId?: string
  }>
}

export function ProfessionalDashboardLayout({
  children,
  userRole,
  userName,
  userEmail,
  schoolName,
  sidebarItems,
}: DashboardLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { dataSaver, setDataSaver, online } = useDataSaver()

  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  // Close mobile sidebar on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen])
  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [settingsOpen,   setSettingsOpen]   = useState(false)
  const [profileOpen,    setProfileOpen]    = useState(false)
  const [searchOpen,     setSearchOpen]     = useState(false)
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false
    return !sessionStorage.getItem(`splash-shown-${userRole}`)
  })
   const { unreadCount, notificationUnread, totalUnread, refetch: refetchUnread } = useUnreadMessages()
  const { subscription, hasAccess } = useSubscription()
  const daysLeft = subscription?.daysRemaining ?? 0
  const [userProfile, setUserProfile] = useState<{
    firstName: string
    lastName: string
    avatar?: string
  }>({ firstName: userName, lastName: '', avatar: undefined })
  const [avatarError, setAvatarError] = useState(false)
  // Locale for the splash greeting ("Mwalimu" for CBC/Kenya, "Instructor" for US)
  const [userCountry, setUserCountry] = useState<string>('')
  const [userCurriculum, setUserCurriculum] = useState<string>('')

  /* ── Splash min-timer — splash shows, then auto-dismisses after ~7s ── */
  useEffect(() => {
    if (!showSplash) return
    const t = setTimeout(() => {
      setShowSplash(false)
      sessionStorage.setItem(`splash-shown-${userRole}`, '1')
    }, 7800) // 800ms paint delay + 7000ms visible
    return () => clearTimeout(t)
  }, [])

  /* ── Profile fetch (updates name only — splash dismissal is handled by the min-timer) ── */
  const fetchUserProfile = async () => {
    if (!session?.user?.id) return
    try {
      const [profileRes, prefsRes] = await Promise.all([
        fetch(`/api/user-profile?userId=${session.user.id}`),
        fetch(`/api/user-preferences`),
      ])
      if (profileRes.ok) {
        const p = await profileRes.json()
        setUserProfile({ firstName: p.firstName, lastName: p.lastName, avatar: p.avatar })
        setAvatarError(false)
      } else {
        console.warn('[Dashboard] Profile fetch failed:', profileRes.status)
      }
      if (prefsRes.ok) {
        const prefs = await prefsRes.json()
        setUserCountry(prefs.country || '')
        setUserCurriculum(prefs.curriculum || '')
      }
    } catch (e) { console.warn('[Dashboard] Profile fetch failed:', e) }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProfile()
    }
  }, [session?.user?.id])

  /* ── Broadcast banner ── */
  const [broadcasts, setBroadcasts] = useState<Array<{ id: string; title: string; message: string; type: string; createdAt: string; expiresAt?: string | null }>>([])
  const [dismissedBroadcasts, setDismissedBroadcasts] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try { return new Set(JSON.parse(localStorage.getItem('dismissed-broadcasts') || '[]')) }
    catch { return new Set() }
  })

  useEffect(() => {
    if (!session?.user?.id) return

    const fetchBroadcasts = () => {
      fetch('/api/notifications?unreadOnly=true&limit=5')
        .then(r => r.ok ? r.json() as Promise<any> : [])
        .then((data: any) => {
          const arr = Array.isArray(data) ? data : (data.notifications || [])
          const now = Date.now()
          // Show as a banner any broadcast that isn't the user's own message.
          // A broadcast may be: sent by someone else (senderId present), OR a
          // role/school-wide announcement with no personal sender (system).
          // Only hide notifications the user sent to themselves, plus any that
          // have already expired (defensive; the server also filters these).
          setBroadcasts(arr.filter((n: any) => {
            if (n.senderId && n.senderId === session.user.id) return false
            if (n.expiresAt && new Date(n.expiresAt).getTime() <= now) return false
            return true
          }))
        })
        .catch(() => {})
    }

    // Fetch immediately on mount
    fetchBroadcasts()

    // Poll every 60s normally; every 5min in data-saver mode to reduce data.
    const iv = setInterval(fetchBroadcasts, dataSaver ? 300000 : 60000)
    return () => clearInterval(iv)
  }, [session?.user?.id, dataSaver])

  const dismissBroadcast = (id: string) => {
    const next = new Set([...dismissedBroadcasts, id])
    setDismissedBroadcasts(next)
    localStorage.setItem('dismissed-broadcasts', JSON.stringify([...next]))
    // Mark as read
    fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {})
  }

  const visibleBroadcasts = broadcasts.filter(b => !dismissedBroadcasts.has(b.id))

  /* ── Helpers ── */
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':  return 'Super Administrator'
      case 'SCHOOL_ADMIN': return 'School Administrator'
      case 'TEACHER':      return 'Teacher'
      case 'STUDENT':      return 'Student'
      case 'PARENT':       return 'Parent'
      case 'SENIOR_STUDENT': return 'Senior Student'
      case 'SENIOR_TEACHER': return 'Senior Teacher'
      default:             return role
    }
  }

  return (
    <TourProvider>
    <div className="min-h-screen bg-slate-50">

      {/* ── TOUR INFRASTRUCTURE ── */}
      <TourCompletionMonitor userRole={userRole} />

      {/* ── BROADCAST BANNERS — shown to all roles when super admin sends a message ── */}
      {visibleBroadcasts.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] w-full max-w-xl px-4 space-y-2 pointer-events-none">
          {visibleBroadcasts.slice(0, 2).map(b => {
            const colors: Record<string, string> = {
              info:    'bg-blue-600 border-blue-500',
              warning: 'bg-amber-600 border-amber-500',
              success: 'bg-green-600 border-green-500',
              error:   'bg-red-600 border-red-500',
            }
            const color = colors[b.type] || colors.info
            return (
              <div key={b.id}
                className={`pointer-events-auto w-full ${color} text-white rounded-2xl shadow-2xl border px-5 py-4 flex items-start gap-4 animate-in slide-in-from-top-2 duration-300`}>
                <Bell className="w-5 h-5 shrink-0 mt-0.5 opacity-90" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-tight">{b.title}</p>
                  <p className="text-xs text-white/80 mt-1 line-clamp-2 leading-relaxed">{b.message}</p>
                  <p className="text-[10px] text-white/60 mt-1.5">
                    {new Date(b.createdAt).toLocaleString()} · From ElimuNova Admin
                  </p>
                </div>
                <button
                  onClick={() => dismissBroadcast(b.id)}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center shrink-0 transition-colors mt-0.5"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            )
          })}
        </div>
      )}
      <TourOverlay />
      <TourTooltip role={userRole} />
      <TourLauncher />

      {/* ── SPLASH SCREEN ── */}
      <DashboardSplash
        role={userRole as any}
        userName={userProfile.firstName || userName}
        visible={showSplash}
        country={userCountry}
        curriculum={userCurriculum}
      />

      {/* ── ACCESSIBILITY / INFRA ── */}
      <SkipToContent />
      <OfflineBanner />

      {/* ── IDLE LOGOUT WARNING ── */}
      <IdleLogoutWarning />

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4">

          {/* Left */}
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
            </button>
            <button
              className="hidden lg:flex p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarCollapsed(v => !v)}
              aria-label="Toggle sidebar collapse"
            >
              {sidebarCollapsed
                ? <PanelLeftOpen className="w-5 h-5 text-slate-600" />
                : <PanelLeftClose className="w-5 h-5 text-slate-600" />}
            </button>
            <Link href="/" className="shrink-0"><Logo size="md" variant="white" /></Link>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
              {totalUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </button>

            <Link
              href="/notifications"
              className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="View all notifications"
            >
              <Inbox className="w-4 h-4" /> Inbox
            </Link>

            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Global search"
            >
              <Search className="w-4 h-4" /> Search
            </button>

            {hasAccess && daysLeft > 0 && daysLeft <= 10 && (
              <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                daysLeft <= 3
                  ? 'bg-red-100 text-red-700'
                  : daysLeft <= 7
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  daysLeft <= 3 ? 'bg-red-500' : daysLeft <= 7 ? 'bg-amber-500' : 'bg-green-500'
                }`} />
                {daysLeft}d left
              </span>
            )}

            <button
              onClick={() => setDataSaver(!dataSaver)}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${dataSaver ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-slate-100 text-slate-400'}`}
              aria-label="Toggle data saver mode"
              title={dataSaver ? 'Data saver on — tap to turn off' : 'Data saver — reduce data usage'}
            >
              <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors hidden sm:block"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
            </button>

            <div className="flex items-center gap-1 sm:gap-2 ml-1">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-slate-900 leading-tight">{userProfile.firstName} {userProfile.lastName}</p>
                <p className="text-xs text-slate-500">{getRoleDisplayName(userRole)}</p>
              </div>
              <button
                onClick={() => setProfileOpen(true)}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-slate-400 transition-all shrink-0 ring-1 ring-slate-300"
                aria-label="Profile"
              >
                {userProfile.avatar && !avatarError
                  ? <img key={userProfile.avatar} src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                  : <span className="text-xs font-semibold text-slate-600">{(userProfile.firstName || userName).slice(0, 1).toUpperCase()}</span>
                }
              </button>
              <button
                onClick={() => signOut()}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed top-14 sm:top-16 left-0 bottom-0 z-40 flex flex-col bg-[#0f172a] border-r border-white/5 transition-all duration-200 ease-in-out overflow-y-auto ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 sm:py-4 px-2">
          {!sidebarCollapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Navigation</p>
          )}
          <div className="space-y-0.5">
            {sidebarItems.map((item, index) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={index}
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  data-tour={item.tourId}
                  onClick={() => { setSidebarOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className={`relative flex items-center gap-3 px-3 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/25 to-purple-600/25 text-white border border-blue-500/30'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gradient-to-b from-blue-400 to-purple-400" />
                  )}
                  <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="truncate flex-1">{item.label}</span>
                      {item.badge != null && item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {sidebarCollapsed && item.badge != null && item.badge > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer sign out */}
        <div className="border-t border-white/5 p-3">
          <button
            onClick={() => signOut()}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 sm:py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-white/5 hover:text-slate-200 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── MAIN CONTENT ── */}
      <main
        id="main-content"
        className={`transition-all duration-200 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'} pt-14 sm:pt-16`}
      >
        {/* Active Meeting Banner — shows for all roles */}
        <ErrorBoundary>
          <ActiveMeetingBanner />
        </ErrorBoundary>
        <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-auto animate-fadeIn">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>

      {/* ── MODALS ── */}
      {session?.user?.id && (
        <>
          <SearchResultsModal
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
          />
          <NotificationsModal
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            userId={session.user.id}
            role={userRole}
            onUnreadChanged={refetchUnread}
          />
          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            userId={session.user.id}
            userName={`${userProfile.firstName} ${userProfile.lastName}`}
            userEmail={userEmail}
          />
          <UserProfileModal
            isOpen={profileOpen}
            onClose={() => {
              setProfileOpen(false)
              fetchUserProfile()
            }}
            userId={session.user.id}
            onProfileUpdate={(profile) => {
              setUserProfile({ firstName: profile.firstName, lastName: profile.lastName, avatar: profile.avatar })
            }}
          />
        </>
      )}

    </div>
      </TourProvider>
  )
}
