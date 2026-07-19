"use client"

import { Loader2, Server, Database, Cloud, Shield, Clock, Activity, Wifi, Cpu } from "lucide-react"
import { AnimatedCounter } from "./animated-counter"
import type { SystemStatus } from "@/types/super-admin"

interface SystemStatusPanelProps {
  status: SystemStatus | null
  loading: boolean
}

function AnimatedStatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    healthy: "bg-emerald-500",
    online: "bg-emerald-500",
    warning: "bg-amber-500",
    critical: "bg-red-500",
    error: "bg-red-500",
    completed: "bg-emerald-500",
  }
  const isHealthy = ["healthy", "online", "completed"].includes(status)
  return (
    <span className="relative inline-flex">
      <span className={`inline-block w-2 h-2 rounded-full ${colorMap[status] || "bg-gray-400"} ring-2 ring-white`} />
      {isHealthy && (
        <span className={`absolute inset-0 inline-block w-2 h-2 rounded-full ${colorMap[status] || "bg-gray-400"} animate-ping opacity-40`} />
      )}
    </span>
  )
}

function AnimatedProgressBar({ value, label, status }: { value: number; label?: string; status?: string }) {
  const color =
    status === "critical" || value >= 90
      ? "bg-red-500"
      : status === "warning" || value >= 70
      ? "bg-amber-500"
      : "bg-emerald-500"
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">{label}</span>
          <span className="text-xs font-medium text-gray-700">
            <AnimatedCounter value={value} suffix="%" />
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )
}

function SystemStatusSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse">
      <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-48 bg-gray-200 rounded mb-6" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2.5">
          <div className="h-3 w-24 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}

export function SystemStatusPanel({ status, loading }: SystemStatusPanelProps) {
  if (loading) return <SystemStatusSkeleton />

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Server className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900">System Status</h3>
        {status && (
          <span className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status.overall.status === "healthy"
              ? "bg-emerald-50 text-emerald-700"
              : status.overall.status === "warning"
              ? "bg-amber-50 text-amber-700"
              : "bg-red-50 text-red-700"
          }`}>
            <AnimatedStatusDot status={status.overall.status} />
            {status.overall.status.charAt(0).toUpperCase() + status.overall.status.slice(1)}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-5">Current system health and performance</p>

      {status ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <Database className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider">Database</p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${
                    status.database.status === "healthy" ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {status.database.status === "healthy" ? "Healthy" : "Error"}
                  </span>
                  <span className="text-[10px] text-gray-400">{status.database.responseTime}ms</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Cloud className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider">AI Services</p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold ${
                    status.aiServices.status === "online" ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {status.aiServices.status === "online" ? "Online" : "Offline"}
                  </span>
                  <span className="text-[10px] text-gray-400">{status.aiServices.responseTime}ms</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-1 space-y-3">
            <AnimatedProgressBar value={status.server.load} label="Server Load" status={status.server.status} />
            <AnimatedProgressBar value={status.server.memoryUsage} label="Memory Usage" status={status.server.status} />
            <AnimatedProgressBar value={status.server.diskUsage} label="Disk Usage" status={status.server.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50">
              <Shield className="w-3.5 h-3.5 text-gray-400" />
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500">Last Backup</p>
                <p className="text-xs font-medium text-gray-800 truncate">
                  {new Date(status.backup.lastBackup).toLocaleDateString()}
                  <span className="ml-1 text-gray-400 font-normal">({status.backup.size})</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500">Uptime</p>
                <p className="text-xs font-medium text-gray-800">
                  {Math.floor(status.overall.uptime / 3600)}h {Math.floor((status.overall.uptime % 3600) / 60)}m
                </p>
              </div>
            </div>
          </div>

          <details className="group mt-1 pt-3 border-t border-gray-100">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors list-none flex items-center gap-1.5 select-none py-1">
              <Activity className="w-3.5 h-3.5" />
              System Statistics
              <span className="ml-auto group-open:rotate-180 transition-transform text-[10px]">▼</span>
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: "Total Users", value: status.statistics.totalUsers, icon: Wifi },
                { label: "Active Users", value: status.statistics.activeUsers, icon: Wifi },
                { label: "Total Schools", value: status.statistics.totalSchools, icon: Cpu },
                { label: "Active Schools", value: status.statistics.activeSchools, icon: Cpu },
                { label: "Total Packages", value: status.statistics.totalPackages, icon: PackageIcon },
                { label: "Active Subs", value: status.statistics.activeSubscriptions, icon: Activity },
                { label: "User Activity", value: `${status.statistics.userActivityRate}%`, icon: Activity },
                { label: "School Activity", value: `${status.statistics.schoolActivityRate}%`, icon: Activity },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-sm font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </details>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading system status...</span>
        </div>
      )}
    </div>
  )
}

function PackageIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
}
