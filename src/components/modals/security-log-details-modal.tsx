'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, CheckCircle, XCircle, AlertTriangle, AlertCircle, Clock, Activity, User, MapPin, Monitor } from 'lucide-react'

interface SecurityLog {
  id: string
  eventType: string
  severity: string
  description: string
  ipAddress?: string
  userAgent?: string
  userId?: string
  schoolId?: string
  metadata?: string
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  school?: {
    id: string
    name: string
  }
  resolver?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface SecurityLogDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  log: SecurityLog | null
  onLogUpdated: (log: SecurityLog) => void
}

export default function SecurityLogDetailsModal({
  isOpen,
  onClose,
  log,
  onLogUpdated
}: SecurityLogDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleResolve = async () => {
    if (!log) return

    setLoading(true)
    try {
      const response = await fetch(`/api/security/logs/${log.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resolved: true }),
      })

      if (response.ok) {
        const updatedLog = await response.json()
        onLogUpdated(updatedLog)
        toast({
          title: "Success",
          description: "Security log marked as resolved",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to resolve security log",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error resolving security log:', error)
      toast({
        title: "Error",
        description: "Failed to resolve security log",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'LOW': return CheckCircle
      case 'MEDIUM': return AlertCircle
      case 'HIGH': return AlertTriangle
      case 'CRITICAL': return XCircle
      default: return Clock
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'LOGIN_SUCCESS': return 'bg-green-100 text-green-800'
      case 'LOGIN_FAILED': return 'bg-red-100 text-red-800'
      case 'SUSPICIOUS_ACTIVITY': return 'bg-orange-100 text-orange-800'
      case 'UNAUTHORIZED_ACCESS': return 'bg-red-100 text-red-800'
      case 'PASSWORD_CHANGE': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatEventType = (eventType: string) => {
    return eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatMetadata = (metadata?: string) => {
    if (!metadata) return null
    try {
      const parsed = JSON.parse(metadata)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return metadata
    }
  }

  if (!log) return null

  const SeverityIcon = getSeverityIcon(log.severity)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Security Log Details
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-6 mt-1">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{formatEventType(log.eventType)}</h3>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getSeverityColor(log.severity)}>
                  <SeverityIcon className="w-3 h-3 mr-1" />
                  {log.severity}
                </Badge>
                <Badge className={getEventTypeColor(log.eventType)}>
                  {formatEventType(log.eventType)}
                </Badge>
                {log.resolved ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Resolved
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    <Clock className="w-3 h-3 mr-1" />
                    Unresolved
                  </Badge>
                )}
              </div>
              <p className="text-gray-600">{log.description}</p>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Event Time:</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>

              {log.ipAddress && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">IP Address:</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md font-mono">
                    {log.ipAddress}
                  </div>
                </div>
              )}
            </div>

            {log.user && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="font-medium">Related User:</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="font-medium">{log.user.firstName} {log.user.lastName}</div>
                  <div className="text-sm text-gray-500">{log.user.email}</div>
                </div>
              </div>
            )}

            {log.school && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Activity className="w-4 h-4" />
                  <span className="font-medium">Related School:</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  {log.school.name}
                </div>
              </div>
            )}

            {log.userAgent && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Monitor className="w-4 h-4" />
                  <span className="font-medium">User Agent:</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-md text-sm font-mono">
                  {log.userAgent}
                </div>
              </div>
            )}

            {log.metadata && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Activity className="w-4 h-4" />
                  <span className="font-medium">Additional Metadata:</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-md text-sm font-mono max-h-32 overflow-y-auto">
                  <pre>{formatMetadata(log.metadata)}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Resolution Info */}
          {log.resolved && (
            <div className="pt-4 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Resolution Details:</span>
                </div>
                <div className="p-3 bg-green-50 rounded-md">
                  <div className="text-sm">
                    <div className="font-medium text-green-800">Resolved by: {log.resolver?.firstName} {log.resolver?.lastName}</div>
                    <div className="text-green-600">Resolved at: {log.resolvedAt ? new Date(log.resolvedAt).toLocaleString() : 'Unknown'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Log ID:</span> {log.id}
              </div>
              <div>
                <span className="font-medium">Event Type:</span> {log.eventType}
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="border-t border-slate-100">
          {!log.resolved && (
            <Button
              onClick={handleResolve}
              disabled={loading}
              className="edugenius-button px-5 py-2.5 text-sm font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Resolved
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
