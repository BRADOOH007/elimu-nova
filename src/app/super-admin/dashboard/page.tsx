"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { RefreshCw, Plus, School, UserPlus, Upload, Loader2, Sparkles, AlertTriangle } from "lucide-react"
import { LiveMetricsBar } from "@/components/super-admin/live-metrics-bar"
import { TrendCharts } from "@/components/super-admin/trend-charts"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import CreatePackageModal from "@/components/modals/create-package-modal"
import { CreateSchoolModal } from "@/components/modals/create-school-modal"
import { CreateAdminUserModal } from "@/components/modals/create-admin-user-modal"
import { UploadCurriculumModal } from "@/components/modals/upload-curriculum-modal"
import { SchoolDetailsModal } from "@/components/modals/school-details-modal"
import { StatsCards } from "@/components/super-admin/stats-cards"
import { SystemStatusPanel } from "@/components/super-admin/system-status-panel"
import { PackageOverviewPanel } from "@/components/super-admin/package-overview-panel"
import { RecentSchoolsSection } from "@/components/super-admin/recent-schools-section"
import type { DashboardStats, RecentSchool, SystemStatus, PackageOverviewData } from "@/types/super-admin"

function GreetingBanner({ name }: { name: string }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" })
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-6 md:p-8 shadow-lg">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-violet-200" />
          <span className="text-xs font-medium text-violet-200 uppercase tracking-wider">
            {dayName} &middot; {dateStr}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          {greeting}, {name}
        </h1>
        <p className="text-sm text-violet-200 mt-1 max-w-xl">
          Welcome to your command center. Monitor schools, manage packages, and oversee system health.
        </p>
      </div>
    </div>
  )
}

export default function SuperAdminDashboard() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentSchools, setRecentSchools] = useState<RecentSchool[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [packageOverview, setPackageOverview] = useState<PackageOverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [fetchError, setFetchError] = useState(false)

  const [createPackageOpen, setCreatePackageOpen] = useState(false)
  const [createSchoolOpen, setCreateSchoolOpen] = useState(false)
  const [createAdminUserOpen, setCreateAdminUserOpen] = useState(false)
  const [uploadCurriculumOpen, setUploadCurriculumOpen] = useState(false)
  const [schoolDetailsOpen, setSchoolDetailsOpen] = useState(false)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)

  const displayName = useMemo(() => {
    if (session?.user?.name) return session.user.name
    return "Super Admin"
  }, [session])

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setFetchError(false)

    try {
      const [statsRes, schoolsRes, sysRes, pkgRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/dashboard/recent-schools?limit=5"),
        fetch("/api/system-status"),
        fetch("/api/packages/overview"),
      ])

      let hasError = false

      if (statsRes.ok) { setStats(await statsRes.json()) } else { hasError = true }
      if (schoolsRes.ok) { setRecentSchools(await schoolsRes.json()) } else { hasError = true }
      if (sysRes.ok) { setSystemStatus(await sysRes.json()) } else { hasError = true }
      if (pkgRes.ok) { setPackageOverview(await pkgRes.json()) } else { hasError = true }

      if (hasError) {
        setFetchError(true)
        toast({
          variant: "destructive",
          title: "Data fetch issue",
          description: "Some dashboard sections couldn't be loaded. Please try refreshing.",
        })
      }

      setLastUpdated(new Date())
    } catch (err) {
      console.error("Dashboard fetch error:", err)
      setFetchError(true)
      toast({
        variant: "destructive",
        title: "Connection error",
        description: "Failed to fetch dashboard data. Check your connection and try again.",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    const interval = setInterval(() => fetchAll(true), 60000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const handleSchoolClick = (id: string) => {
    setSelectedSchoolId(id)
    setSchoolDetailsOpen(true)
  }

  const handleModalAction = () => fetchAll(true)

  const quickActions = [
    { label: "Create New Package", icon: Plus, onClick: () => setCreatePackageOpen(true), primary: true },
    { label: "Add New School", icon: School, onClick: () => setCreateSchoolOpen(true) },
    { label: "Create Admin User", icon: UserPlus, onClick: () => setCreateAdminUserOpen(true) },
    { label: "Upload Curriculum", icon: Upload, onClick: () => setUploadCurriculumOpen(true) },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Greeting Banner */}
      <GreetingBanner name={displayName} />

      {/* Live Metrics Bar */}
      <div className="bg-[#0f172a] rounded-xl border border-white/10 p-3">
        <LiveMetricsBar />
      </div>

      {/* Error Banner */}
      {fetchError && !loading && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="flex-1">Some data couldn&apos;t be loaded. Try refreshing.</span>
          <Button variant="outline" size="sm" onClick={() => fetchAll(true)} disabled={refreshing} className="border-amber-200 hover:bg-amber-100 shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Retry
          </Button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Platform Overview</h2>
          <p className="text-sm text-gray-500">
            {lastUpdated ? (
              <>Last updated: {lastUpdated.toLocaleTimeString()}</>
            ) : (
              "Loading data..."
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="self-start"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="animate-fade-in-up">
        <StatsCards stats={stats} loading={loading} />
      </div>

      {/* Trend Charts */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <TrendCharts />
      </div>

      {/* Quick Actions + System Status + Package Overview */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        <div className="animate-fade-in-up" style={{ animationDelay: "0.05s", opacity: 0 }}>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-1">
              <Plus className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <p className="text-xs text-gray-400 mb-5">Common administrative tasks</p>
            <div className="space-y-2.5">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.primary ? "default" : "outline"}
                  className={`w-full justify-start text-sm h-10 ${action.primary ? "" : "border-gray-200 hover:bg-gray-50"}`}
                  onClick={action.onClick}
                >
                  <action.icon className="w-4 h-4 mr-2.5" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
          <SystemStatusPanel status={systemStatus} loading={loading} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "0.15s", opacity: 0 }}>
          <PackageOverviewPanel data={packageOverview} loading={loading} />
        </div>
      </div>

      {/* Recent Schools */}
      <div className="animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
        <RecentSchoolsSection
          schools={recentSchools}
          loading={loading}
          onSchoolClick={handleSchoolClick}
        />
      </div>

      {/* Modals */}
      <CreatePackageModal
        isOpen={createPackageOpen}
        onClose={() => setCreatePackageOpen(false)}
        onPackageCreated={handleModalAction}
      />
      <CreateSchoolModal
        isOpen={createSchoolOpen}
        onClose={() => setCreateSchoolOpen(false)}
        onSchoolCreated={handleModalAction}
      />
      <CreateAdminUserModal
        isOpen={createAdminUserOpen}
        onClose={() => setCreateAdminUserOpen(false)}
        onUserCreated={handleModalAction}
      />
      <UploadCurriculumModal
        isOpen={uploadCurriculumOpen}
        onClose={() => setUploadCurriculumOpen(false)}
        onCurriculumUploaded={handleModalAction}
      />
      <SchoolDetailsModal
        isOpen={schoolDetailsOpen}
        onClose={() => { setSchoolDetailsOpen(false); setSelectedSchoolId(null) }}
        schoolId={selectedSchoolId}
        onSchoolUpdated={handleModalAction}
        onSchoolDeleted={(id: string) => {
          setRecentSchools(prev => prev.filter(s => s.id !== id))
          fetchAll(true)
        }}
      />
    </div>
  )
}
