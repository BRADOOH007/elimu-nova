import { Wrench } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getMessage() {
  try {
    const { prisma } = await import('@/lib/prisma')
    const setting = await prisma.systemSettings.findUnique({ where: { key: 'maintenance_mode' } })
    if (setting) {
      const parsed = JSON.parse(setting.value)
      return parsed.message || 'We are performing scheduled maintenance. Please check back shortly.'
    }
  } catch (e) { console.warn('[Maintenance] Failed to fetch message:', e) }
  return 'We are performing scheduled maintenance. Please check back shortly.'
}

export default async function MaintenancePage() {
  const message = await getMessage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wrench className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Under Maintenance</h1>
        <p className="text-slate-400 leading-relaxed mb-8">{message}</p>
        <div className="flex items-center justify-center gap-3 text-sm text-slate-500">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Working on it
        </div>
      </div>
    </div>
  )
}
