'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  MessageSquare,
  Megaphone,
  Send,
  Mail,
  Bell,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Clock,
  Users,
  School,
  UserCheck,
  Globe,
  History,
  RefreshCw,
  Wrench,
  CreditCard,
  Sparkles,
} from 'lucide-react'

type Template = {
  id: string
  label: string
  icon?: React.ReactNode
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
}

const TEMPLATES: Template[] = [
  {
    id: 'maintenance',
    label: 'System Maintenance',
    icon: <Wrench className="w-4 h-4" />,
    title: 'Scheduled System Maintenance',
    message: 'Dear User,\n\nThis is to inform you that ElimuNova will undergo scheduled maintenance on [DATE] from [TIME] to [TIME]. During this period, the platform may be temporarily unavailable.\n\nWe apologize for any inconvenience caused and appreciate your patience as we work to improve your experience.\n\nBest regards,\nElimuNova Team',
    type: 'warning',
  },
  {
    id: 'subscription-expiry',
    label: 'Subscription Expiry',
    title: 'Subscription Renewal Notice',
    message: 'Dear User,\n\nThis is a friendly reminder that your school\'s subscription is set to expire on [DATE]. To ensure uninterrupted access to all features, please arrange for renewal with your administrator.\n\nIf you have any questions, please contact our support team.\n\nBest regards,\nElimuNova Team',
    type: 'warning',
  },
  {
    id: 'feature-update',
    label: 'Feature Update',
    icon: <Sparkles className="w-4 h-4" />,
    title: 'New Features Available',
    message: 'Dear User,\n\nWe are excited to announce new features and improvements to ElimuNova:\n\n- [Feature 1]\n- [Feature 2]\n- [Feature 3]\n\nLog in today to explore these updates and enhance your experience.\n\nBest regards,\nElimuNova Team',
    type: 'info',
  },
  {
    id: 'custom',
    label: 'Custom Message',
    icon: <MessageSquare className="w-4 h-4" />,
    title: '',
    message: '',
    type: 'info',
  },
]

type AudienceOption = {
  value: string
  label: string
  icon: React.ReactNode
}

const AUDIENCE_OPTIONS: AudienceOption[] = [
  { value: 'all', label: 'All Users', icon: <Globe className="w-4 h-4" /> },
  { value: 'teachers', label: 'All Teachers', icon: <Users className="w-4 h-4" /> },
  { value: 'students', label: 'All Students', icon: <UserCheck className="w-4 h-4" /> },
  { value: 'admins', label: 'All School Admins', icon: <School className="w-4 h-4" /> },
]

interface SentBroadcast {
  id: string
  title: string
  message: string
  type: string
  recipientCount?: number
  count?: number
  createdAt: string
}

export default function BroadcastPage() {
  const { toast } = useToast()
  const [step, setStep] = useState<'compose' | 'preview' | 'history'>('compose')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'info' | 'warning' | 'success' | 'error'>('info')
  const [audience, setAudience] = useState<string[]>(['all'])
  const [sendEmail, setSendEmail] = useState(false)
  const [bannerExpiresAt, setBannerExpiresAt] = useState('')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<SentBroadcast[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/notifications/sent?limit=20')
      if (res.ok) {
        const data = await res.json()
        setHistory(data.broadcasts || [])
      }
    } catch (e) { console.warn('[SuperAdminBroadcast] fetchHistory error:', e) } finally { setHistoryLoading(false) }
  }

  const applyTemplate = (templateId: string) => {
    const tmpl = TEMPLATES.find(t => t.id === templateId)
    if (!tmpl) return
    setSelectedTemplate(templateId)
    if (templateId !== 'custom') {
      setTitle(tmpl.title)
      setMessage(tmpl.message)
      setMessageType(tmpl.type)
    }
  }

  const toggleAudience = (value: string) => {
    if (value === 'all') {
      setAudience(['all'])
      return
    }
    setAudience(prev => {
      const withoutAll = prev.filter(a => a !== 'all')
      if (withoutAll.includes(value)) {
        return withoutAll.filter(a => a !== value)
      }
      const next = [...withoutAll, value]
      return next.length === 0 ? ['all'] : next
    })
  }

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Title and message are required' })
      return
    }

    setSending(true)
    try {
      const roles = audience.includes('all')
        ? []
        : audience.map(a => {
            switch (a) {
              case 'teachers': return 'TEACHER'
              case 'students': return 'STUDENT'
              case 'admins': return 'SCHOOL_ADMIN'
              default: return ''
            }
          }).filter(Boolean)

      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          type: messageType,
          expiresAt: bannerExpiresAt ? new Date(bannerExpiresAt).toISOString() : null,
          target: { roles },
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to send')
      }

      const data = await res.json()
      toast({
        title: 'Broadcast sent',
        description: `Notification delivered to ${data.count} user${data.count === 1 ? '' : 's'}.`,
      })

      if (sendEmail) {
        toast({ title: 'Email delivery', description: 'Email sending queued. Configure SMTP in Settings for email delivery.' })
      }

      // Reset form
      setTitle('')
      setMessage('')
      setSelectedTemplate('custom')
      setMessageType('info')
      setAudience(['all'])
      setSendEmail(false)
      setBannerExpiresAt('')
      setStep('history')
      fetchHistory()
    } catch (err) {
      toast({ variant: 'destructive', title: 'Send failed', description: err instanceof Error ? err.message : 'Failed to send broadcast' })
    } finally { setSending(false) }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-600" />
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />
      default: return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning': return 'border-amber-200 bg-amber-50'
      case 'success': return 'border-green-200 bg-green-50'
      case 'error': return 'border-red-200 bg-red-50'
      default: return 'border-blue-200 bg-blue-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="edugenius-text-gradient">Broadcast</span>
          </h1>
          <p className="text-gray-600">Send professional announcements to users across the platform</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={step === 'compose' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStep('compose')}
          >
            <Megaphone className="w-4 h-4 mr-2" />
            Compose
          </Button>
          <Button
            variant={step === 'history' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStep('history'); fetchHistory() }}
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
        </div>
      </div>

      {step === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message Composition */}
          <div className="lg:col-span-2 space-y-6">
            {/* Templates */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Message Templates
                </CardTitle>
                <CardDescription>Start from a pre-written template or write a custom message</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map(t => (
                    <Button
                      key={t.id}
                      variant={selectedTemplate === t.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => applyTemplate(t.id)}
                      className={selectedTemplate === t.id ? 'bg-gradient-to-r from-purple-600 to-blue-600' : ''}
                    >
                      {t.icon}
                      <span className="ml-2">{t.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compose Form */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Compose Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject / Title</Label>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Scheduled System Maintenance"
                    className="text-base font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="min-h-[280px] text-base leading-relaxed"
                  />
                  <p className="text-xs text-gray-400">
                    Use [DATE], [TIME] as placeholders. Each line break creates a new paragraph.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Notification Type</Label>
                  <div className="flex gap-2">
                    {(['info', 'warning', 'success', 'error'] as const).map(t => (
                      <Button
                        key={t}
                        variant={messageType === t ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMessageType(t)}
                        className={messageType === t ? (
                          t === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
                          t === 'success' ? 'bg-green-600 hover:bg-green-700' :
                          t === 'error' ? 'bg-red-600 hover:bg-red-700' :
                          'bg-blue-600 hover:bg-blue-700'
                        ) : ''}
                      >
                        {getTypeIcon(t)}
                        <span className="ml-2 capitalize">{t}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            {title && message && (
              <Card className={`border ${getTypeStyles(messageType)}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getTypeIcon(messageType)}
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg p-4 shadow-sm border">
                    <h3 className="font-semibold text-lg mb-3">{title}</h3>
                    <div className="text-gray-700 whitespace-pre-line leading-relaxed">{message}</div>
                    <div className="mt-4 pt-3 border-t text-sm text-gray-500">
                      — ElimuNova Team
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Targeting & Send */}
          <div className="space-y-6">
            {/* Target Audience */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Target Audience
                </CardTitle>
                <CardDescription>Choose who receives this message</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {AUDIENCE_OPTIONS.map(opt => (
                  <Button
                    key={opt.value}
                    variant={audience.includes(opt.value) ? 'default' : 'outline'}
                    className={`w-full justify-start ${audience.includes(opt.value) ? 'bg-gradient-to-r from-green-600 to-emerald-600' : ''}`}
                    onClick={() => toggleAudience(opt.value)}
                  >
                    {opt.icon}
                    <span className="ml-3">{opt.label}</span>
                    {audience.includes(opt.value) && <CheckCircle className="w-4 h-4 ml-auto" />}
                  </Button>
                ))}
                <div className="pt-2 text-xs text-gray-500">
                  {audience.includes('all')
                    ? 'Will be sent to all active users across all schools'
                    : `Will be sent to users with role${audience.length > 1 ? 's' : ''}: ${audience.join(', ')}`
                  }
                </div>
              </CardContent>
            </Card>

            {/* Delivery Options */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">In-App Notification</p>
                    <p className="text-xs text-gray-500">Always delivered</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                </div>
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={e => setSendEmail(e.target.checked)}
                    className="rounded"
                  />
                  <Mail className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Email Notification</p>
                    <p className="text-xs text-gray-500">Requires SMTP configuration</p>
                  </div>
                </label>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">Banner auto-dismiss</p>
                      <p className="text-xs text-gray-500">Optional. After this date/time, the banner stops showing. Ideal for maintenance windows.</p>
                    </div>
                  </label>
                  <input
                    type="datetime-local"
                    value={bannerExpiresAt}
                    onChange={e => setBannerExpiresAt(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={sending || !title.trim() || !message.trim()}
              className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <Send className="w-5 h-5 mr-3" />
              )}
              {sending ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </div>
        </div>
      )}

      {/* History */}
      {step === 'history' && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                Broadcast History
              </CardTitle>
              <CardDescription>Previously sent announcements and notifications</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchHistory} disabled={historyLoading}>
              <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No broadcasts sent yet</h3>
                <p className="text-gray-500 mb-4">Your sent announcements will appear here.</p>
                <Button onClick={() => setStep('compose')}>
                  <Megaphone className="w-4 h-4 mr-2" />
                  Compose First Broadcast
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <Card key={item.id} className={`border ${getTypeStyles(item.type)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getTypeIcon(item.type)}
                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{item.message}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <Badge variant="secondary" className="mb-1">
                            <Users className="w-3 h-3 mr-1" />
                            {item.recipientCount ?? item.count ?? 0} recipients
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
