'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Loader2, Bell, Mail, Smartphone, CalendarClock, MessageSquare, AlertTriangle, Globe, Lock, Eye, EyeOff } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NotificationPref {
  key: string
  label: string
  desc: string
  icon: any
  category: string
}

const NOTIFICATION_PREFS: NotificationPref[] = [
  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email', icon: Mail, category: 'general' },
  { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications on your device', icon: Smartphone, category: 'general' },
  { key: 'assignmentReminders', label: 'Assignment Reminders', desc: 'Get reminded about upcoming due dates', icon: CalendarClock, category: 'academic' },
  { key: 'progressUpdates', label: 'Progress Updates', desc: 'Weekly progress reports for your children', icon: Bell, category: 'academic' },
  { key: 'meetingReminders', label: 'Meeting Reminders', desc: 'Reminders before scheduled teacher meetings', icon: CalendarClock, category: 'communication' },
  { key: 'messageAlerts', label: 'Message Alerts', desc: 'Alert when a teacher sends you a message', icon: MessageSquare, category: 'communication' },
  { key: 'gradeAlerts', label: 'Grade Alerts', desc: 'Notify when new grades are posted', icon: AlertTriangle, category: 'academic' },
  { key: 'billingAlerts', label: 'Billing Alerts', desc: 'Payment confirmations and invoice reminders', icon: Mail, category: 'billing' },
]

export default function ParentSettings() {
  const { data: session, update: updateSession } = useSession()

  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [preferences, setPreferences] = useState<Record<string, boolean>>({})
  const [profileLoading, setProfileLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [language, setLanguage] = useState('en')

  useEffect(() => {
    if (!session?.user?.id) return
    const load = async () => {
      try {
        const [userRes, prefsRes] = await Promise.all([
          fetch(`/api/user-profile?userId=${session.user.id}`),
          fetch(`/api/user-preferences?userId=${session.user.id}`),
        ])
        if (userRes.ok) {
          const u = await userRes.json()
          setProfile({ firstName: u.firstName || '', lastName: u.lastName || '', email: u.email || '', phone: u.phone || '' })
        }
        if (prefsRes.ok) {
          const p = await prefsRes.json()
          setPreferences(p)
          if (p.language) setLanguage(p.language)
        }
      } catch {}
      finally { setProfileLoading(false) }
    }
    load()
  }, [session])

  const saveProfile = async () => {
    if (!session?.user?.id) return
    setSaving(true)
    try {
      const res = await fetch('/api/user-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        updateSession()
      }
    } finally { setSaving(false) }
  }

  const savePreferences = async () => {
    if (!session?.user?.id) return
    setSaving(true)
    try {
      const res = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, language, ...preferences }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally { setSaving(false) }
  }

  const togglePref = (key: string) => {
    setPreferences(p => ({ ...p, [key]: !p[key] }))
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const categories = [
    { key: 'general', label: 'General' },
    { key: 'academic', label: 'Academic' },
    { key: 'communication', label: 'Communication' },
    { key: 'billing', label: 'Billing' },
  ]

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profile.email} disabled className="bg-slate-50" />
            <p className="text-xs text-slate-400">Email cannot be changed here</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+1 234 567 890" />
          </div>
          <Button onClick={saveProfile} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" /> Notification Preferences
          </CardTitle>
          <CardDescription>Choose which notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.map(cat => {
            const prefs = NOTIFICATION_PREFS.filter(p => p.category === cat.key)
            return (
              <div key={cat.key} className="mb-6 last:mb-0">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">{cat.label}</h4>
                <div className="space-y-2">
                  {prefs.map(item => (
                    <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePref(item.key)}
                        className={`h-6 w-11 rounded-full relative transition-colors shrink-0 ${preferences[item.key] ? 'bg-primary' : 'bg-slate-300'}`}
                      >
                        <div className={`h-5 w-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${preferences[item.key] ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          <Button onClick={savePreferences} disabled={saving} className="mt-4">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saved ? 'Saved!' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" /> Security
          </CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input id="currentPassword" type={showCurrent ? 'text' : 'password'} value={passwordForm.currentPassword}
                onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} />
              <button type="button" onClick={() => setShowCurrent(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input id="newPassword" type={showNew ? 'text' : 'password'} value={passwordForm.newPassword}
                onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} />
              <button type="button" onClick={() => setShowNew(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} />
          </div>
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-green-600">Password changed successfully</p>}
          <Button variant="secondary" disabled={passwordSaving} onClick={async () => {
            setPasswordError('')
            setPasswordSuccess(false)
            if (!passwordForm.currentPassword || !passwordForm.newPassword) { setPasswordError('All fields are required'); return }
            if (passwordForm.newPassword.length < 6) { setPasswordError('New password must be at least 6 characters'); return }
            if (passwordForm.newPassword !== passwordForm.confirmPassword) { setPasswordError('Passwords do not match'); return }
            setPasswordSaving(true)
            try {
              const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
              })
              if (res.ok) {
                setPasswordSuccess(true)
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                setTimeout(() => setPasswordSuccess(false), 3000)
              } else {
                const err = await res.json()
                setPasswordError(err.error || 'Failed to change password')
              }
            } catch { setPasswordError('An error occurred') }
            finally { setPasswordSaving(false) }
          }}>
            {passwordSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
            Change Password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" /> Language & Region
          </CardTitle>
          <CardDescription>Choose your preferred language and region settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Preferred Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="sw">Swahili (Kiswahili)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400">Select your preferred language for the interface</p>
          </div>
          <Button onClick={savePreferences} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saved ? 'Saved!' : 'Save Language Preferences'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
