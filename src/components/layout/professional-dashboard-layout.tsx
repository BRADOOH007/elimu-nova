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
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [showSplash, setShowSplash] = useState(true)
  const [userProfile, setUserProfile] = useState<{
    firstName: string
    lastName: string
    avatar?: string
  }>({ firstName: userName, lastName: '', avatar: undefined })

  /* ── Splash min-timer ── */
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2500)
    return () => clearTimeout(t)
  }, [])

  /* ── Profile fetch ── */
  const fetchUserProfile = async () => {
    if (!session?.user?.id) return
    try {
      const res = await fetch(`/api/user-profile?userId=${session.user.id}`)
      if (res.ok) {
        const p = await res.json()
        setUserProfile({ firstName: p.firstName, lastName: p.lastName, avatar: p.avatar })
      }
    } catch { /* silent */ }
    // Dismiss splash once profile attempt is done
    setShowSplash(false)
  }

  /* ── Notifications fetch ── */
  const fetchUnreadNotifications = async () => {
    if (!session?.user?.id) return
    try {
      const res = await fetch(`/api/notifications?userId=${session.user.id}&limit=100`)
      if (res.ok) {
        const notifs = await res.json()
        setUnreadNotifications(notifs.filter((n: any) => !n.isRead).length)
      }
    } catch { /* silent */ }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProfile()
      fetchUnreadNotifications()
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
        <div className="flex items-center justify-between h-16 px-4">

          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarOpen(v => !v)}
            >
              {sidebarOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
            </button>
            <button
              className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setSidebarCollapsed(v => !v)}
            >
              {sidebarCollapsed
                ? <PanelLeftOpen className="w-5 h-5 text-slate-600" />
                : <PanelLeftClose className="w-5 h-5 text-slate-600" />}
            </button>
            <Link href="/"><Logo size="md" /></Link>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Settings className="w-5 h-5 text-slate-600" />
            </button>

            <div className="flex items-center gap-2 ml-1">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-slate-900 leading-tight">
                  {userProfile.firstName} {userProfile.lastName}
                </p>
                <p className="text-xs text-slate-500">{getRoleDisplayName(userRole)}</p>
              </div>
              <button
                onClick={() => setProfileOpen(true)}
                className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity"
              >
                {userProfile.avatar
                  ? <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                  : <User className="w-4 h-4 text-white" />
                }
              </button>
              <button
                onClick={() => signOut()}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
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
        className={`fixed top-16 left-0 bottom-0 z-40 flex flex-col bg-[#0f172a] border-r border-white/5 transition-all duration-200 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* User strip */}
        <div className={`flex items-center gap-3 px-3 py-4 border-b border-white/5 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0 overflow-hidden">
            {userProfile.avatar
              ? <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-sm">{(userProfile.firstName || userName).slice(0, 2).toUpperCase()}</span>
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
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {!sidebarCollapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">Navigation</p>
          )}
          <div className="space-y-0.5">
            {sidebarItems.map((item, index) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={index}
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  onClick={() => setSidebarOpen(false)}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-white/5 hover:text-slate-200 transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── MAIN CONTENT ── */}
      <main className={`transition-all duration-200 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'} pt-16`}>
        <div className="p-6">
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
