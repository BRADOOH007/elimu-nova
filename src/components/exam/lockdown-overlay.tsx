'use client'

import { ShieldAlert, AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LockdownOverlayProps {
  reentryStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'DENIED'
  violationCount: number
  onCheckStatus: () => void
}

export function LockdownOverlay({ reentryStatus, violationCount, onCheckStatus }: LockdownOverlayProps) {
  if (reentryStatus === 'APPROVED') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center">
        <div className="text-center space-y-6 p-8 max-w-md animate-in fade-in zoom-in duration-300">
          <div className="w-24 h-24 rounded-full bg-green-600/50 flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Re-entry Approved</h1>
          <p className="text-green-200 text-lg">Your teacher has approved your re-entry. You may continue.</p>
          <Button onClick={() => window.location.reload()} className="bg-green-600 hover:bg-green-700 text-white">
            Continue Exam
          </Button>
        </div>
      </div>
    )
  }

  if (reentryStatus === 'DENIED') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-red-900 via-red-800 to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-6 p-8 max-w-md animate-in fade-in zoom-in duration-300">
          <div className="w-24 h-24 rounded-full bg-red-600/50 flex items-center justify-center mx-auto">
            <XCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Re-entry Denied</h1>
          <p className="text-red-200 text-lg">Your teacher has denied re-entry. Please contact them for further instructions.</p>
          <Button variant="outline" onClick={() => window.location.href = '/student/assignments'} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
            Back to Assignments
          </Button>
        </div>
      </div>
    )
  }

  if (reentryStatus === 'PENDING') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="text-center space-y-6 p-8 max-w-md animate-in fade-in zoom-in duration-300">
          <div className="w-24 h-24 rounded-full bg-red-600/50 flex items-center justify-center mx-auto animate-pulse">
            <ShieldAlert className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Exam Interrupted</h1>
          <p className="text-red-200 text-lg">You left the exam screen. This has been recorded.</p>
          <div className="bg-red-950/50 rounded-xl p-4 border border-red-700/50">
            <p className="text-red-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Your teacher has been notified and must approve your re-entry.
            </p>
          </div>
          {violationCount > 0 && (
            <p className="text-red-400 text-xs">{violationCount} violation{violationCount !== 1 ? 's' : ''} recorded</p>
          )}
          <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Waiting for teacher approval...
          </div>
          <Button
            variant="outline"
            onClick={onCheckStatus}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            <Loader2 className="w-4 h-4 mr-2" />
            Check Approval Status
          </Button>
        </div>
      </div>
    )
  }

  return null
}
