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
  PanelLeftOpen
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { NotificationsModal } from "@/components/modals/notifications-modal"
import { SettingsModal } from "@/components/modals/settings-modal"
import { UserProfileModal } from "@/components/modals/user-profile-modal"
import { Toaster } from "@/components/ui/toaster"
import { DashboardSplash } from "@/components/ui/dashboard-splash"
import { IdleLogoutWarning } from "@/components/ui/idle-logout-warning"
import { useUnreadMessages } from '@/hooks/use-unread-messages'

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'
  userName: string
  userEmail: string
  schoolName?: string
  sidebarItems: Array<{
    icon: React.ComponentType<any>
    label: string
    href: string
    badge?: number
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

  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [settingsOpen,   setSettingsOpen]   = useState(false)
  const [profileOpen,    setProfileOpen]    = useState(false)
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false
    const key = `splash-shown-${userRole}`
    return !sessionStorage.getItem(key)
  })
  const { totalUnread } = useUnreadMessages()
  const [userProfile, setUserProfile] = useState<{
    firstName: string
    lastName: string
    avatar?: string
  }>({ firstName: userName, lastName: '', avatar: undefined })

  /* ── Splash min-timer — only runs if splash is showing ── */
  useEffect(() => {
    if (!showSplash) return
    // Hard cap: dismiss splash after 3s no matter what
    const t = setTimeout(() => {
      setShowSplash(false)
      sessionStorage.setItem(`splash-shown-${userRole}`, '1')
    }, 3000)
    return () => clearTimeout(t)
  }, [])

  /* ── Profile fetch ── */
  const fetchUserProfile = async () => {
    if (!session?.user?.id) {
      setShowSplash(false)
      return
    }
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      const res = await fetch(`/api/user-profile?userId=${session.user.id}`, { signal: controller.signal })
      clearTimeout(timeout)
      if (res.ok) {
        const p = await res.json()
        setUserProfile({ firstName: p.firstName, lastName: p.lastName, avatar: p.avatar })
      }
    } catch { /* silent — timeout or network error */ }
    // Always dismiss splash after profile attempt
    setShowSplash(false)
    sessionStorage.setItem(`splash-shown-${userRole}`, '1')
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProfile()
    }
  }, [session?.user?.id])

  /* ── Helpers ── */
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':  return 'Super Administrator'
      case 'SCHOOL_ADMIN': return 'School Administrator'
      case 'TEACHER':      return 'Teacher'
      case 'STUDENT':      return 'Student'
      case 'PARENT':       return 'Parent'
      default:             return role
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── SPLASH SCREEN ── */}
      <DashboardSplash
        role={userRole as any}
        userName={userProfile.firstName || userName}
        visible={showSplash}
      />

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
            <Link href="/" className="shrink-0"><Logo size="sm" variant="black" /></Link>
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
                className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity shrink-0"
                aria-label="Profile"
              >
                {userProfile.avatar
                  ? <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                  : <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
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
        className={`fixed top-14 sm:top-16 left-0 bottom-0 z-40 flex flex-col bg-[#0f172a] border-r border-white/5 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* User strip */}
        <div className={`flex items-center gap-3 px-3 py-3 sm:py-4 border-b border-white/5 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0 overflow-hidden">
            {userProfile.avatar
              ? <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-xs sm:text-sm">{(userProfile.firstName || userName).slice(0, 2).toUpperCase()}</span>
            }
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userProfile.firstName} {userProfile.lastName}</p>
              <p className="text-xs text-slate-400 truncate">{getRoleDisplayName(userRole)}</p>
            </div>
          )}
        </div>

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
      <main className={`transition-all duration-200 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'} pt-14 sm:pt-16`}>
        <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* ── MODALS ── */}
      {session?.user?.id && (
        <>
          <NotificationsModal
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            userId={session.user.id}
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
            onClose={() => setProfileOpen(false)}
            userId={session.user.id}
            onProfileUpdate={(profile) => {
              setUserProfile({ firstName: profile.firstName, lastName: profile.lastName, avatar: profile.avatar })
              setTimeout(fetchUserProfile, 500)
            }}
          />
          <Toaster />
        </>
      )}

    </div>
  )
}
