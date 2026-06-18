'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  BookOpen, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  User,
  ChevronDown,
  GraduationCap,
  Video,
  Brain,
  Calendar,
  LayoutDashboard,
  ClipboardList,
  Send
} from 'lucide-react'
import Link from 'next/link'
import { NotificationsModal } from '@/components/modals/notifications-modal'
import SendNotificationModal from '@/components/modals/SendNotificationModal'

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: string
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false)
  const [sendNotificationModalOpen, setSendNotificationModalOpen] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const getNavigationItems = () => {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return [
          { name: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
          { name: 'Schools', href: '/super-admin/schools', icon: Users },
          { name: 'Billing', href: '/super-admin/billing', icon: BarChart3 },
          { name: 'Settings', href: '/super-admin/settings', icon: Settings },
        ]
      case 'SCHOOL_ADMIN':
        return [
          { name: 'Dashboard', href: '/school-admin/dashboard', icon: LayoutDashboard },
          { name: 'People', href: '/school-admin/teachers', icon: Users },
          { name: 'Academics', href: '/school-admin/activities', icon: BookOpen },
          { name: 'Billing', href: '/school-admin/billing', icon: BarChart3 },
          { name: 'Settings', href: '/school-admin/settings', icon: Settings },
        ]
      case 'TEACHER':
        return [
          { name: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
          { name: 'My Students', href: '/teacher/students', icon: Users },
          { name: 'Planning', href: '/teacher/lesson-plans', icon: BookOpen },
          { name: 'Assessments', href: '/teacher/assignments', icon: ClipboardList },
          { name: 'Live Classes', href: '/teacher/meetings', icon: Video },
          { name: 'Hope AI', href: '/teacher/alexa', icon: Brain },
        ]
      case 'STUDENT':
        return [
          { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
          { name: 'My Learning', href: '/student/lessons', icon: BookOpen },
          { name: 'Assignments', href: '/student/assignments', icon: ClipboardList },
          { name: 'Live Classes', href: '/student/schedules', icon: Video },
          { name: 'Progress', href: '/student/progress', icon: BarChart3 },
          { name: 'AI Tutor', href: '/student/ai-tutor', icon: Brain },
        ]
      case 'PARENT':
        return [
          { name: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
          { name: 'Kids\' Progress', href: '/parent/progress', icon: BarChart3 },
          { name: 'Resources', href: '/parent/resources', icon: BookOpen },
          { name: 'Settings', href: '/parent/settings', icon: Settings },
        ]
      default:
        return []
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <Logo size="sm" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 justify-center">
            <Logo size="md" />
          </div>
          <nav className="flex-1 px-3 py-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group relative flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
              >
                <item.icon className="h-6 w-6 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="ml-3">{item.name}</span>
                )}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700"
            onClick={() => {
              if (window.innerWidth < 1024) {
                setSidebarOpen(true)
              } else {
                setSidebarCollapsed(!sidebarCollapsed)
              }
            }}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(userRole) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSendNotificationModalOpen(true)}
                  className="hidden sm:flex items-center gap-x-2"
                >
                  <Send className="h-4 w-4" />
                  Send Notification
                </Button>
              )}
              
              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                onClick={() => setNotificationsModalOpen(true)}
              >
                <Bell className="h-6 w-6" />
              </button>

              <div className="relative">
                <div className="flex items-center gap-x-2">
                  <div className="flex items-center gap-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {session?.user?.name}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-x-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      
      {/* Modals */}
      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        userId={session?.user?.id || ''}
      />
      
      <SendNotificationModal
        isOpen={sendNotificationModalOpen}
        onClose={() => setSendNotificationModalOpen(false)}
        userRole={userRole}
      />
    </div>
  )
}
