'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Globe, Loader2, Save, Clock, DollarSign, Languages,
  Monitor, BookOpen, Zap, Search, Video,
  ChevronLeft, ChevronRight, Eye, Lock, Settings,
  ShieldCheck, AlertCircle, CheckCircle, XCircle, ExternalLink,
  Wrench, Info, KeyRound
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'

const TIMEZONES = [
  'Africa/Nairobi', 'Africa/Lagos', 'Africa/Cairo', 'Africa/Johannesburg',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
]

const CURRENCIES = [
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
]

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2025)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2025)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-12-31)' },
]

const AI_MODELS = [
  'gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'claude-3-haiku',
  'gemini-3.6-flash', 'gemini-3.6-flash-lite', 'deepseek-chat',
]

export default function GlobalSettingsPage() {
  const { toast } = useToast()
  const [saving, setSaving] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Platform defaults
  const [platform, setPlatform] = useState({
    defaultTimezone: 'Africa/Nairobi',
    defaultCurrency: 'KES',
    dateFormat: 'DD/MM/YYYY',
    defaultLanguage: 'en',
    defaultAiModel: 'gpt-4o-mini',
    teacherAiModel: 'gpt-4o',
    maxSchools: '100',
    maxUsersPerSchool: '500',
  })

  // Feature flags
  const [features, setFeatures] = useState({
    enableAiTutoring: true,
    enableParentDashboard: true,
    enableStudentRegistration: true,
    enablePublicSignup: false,
    enableNotifications: true,
    enableAnalytics: true,
  })

  // All raw settings (key-value browser)
  const [allSettings, setAllSettings] = useState<any[]>([])
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsPage, setSettingsPage] = useState(1)
  const [settingsPagination, setSettingsPagination] = useState<any>(null)
  const [settingsSearch, setSettingsSearch] = useState('')
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedSetting, setSelectedSetting] = useState<any>(null)

  const SETTINGS_KEYS = {
    timezone: 'global_timezone',
    currency: 'global_currency',
    dateFormat: 'global_date_format',
    language: 'global_language',
    defaultAiModel: 'global_default_ai_model',
    teacherAiModel: 'global_teacher_ai_model',
    maxSchools: 'global_max_schools',
    maxUsersPerSchool: 'global_max_users_per_school',
    enableAiTutoring: 'feature_ai_tutoring',
    enableParentDashboard: 'feature_parent_dashboard',
    enableStudentRegistration: 'feature_student_registration',
    enablePublicSignup: 'feature_public_signup',
    enableNotifications: 'feature_notifications',
    enableAnalytics: 'feature_analytics',
  }

  const loadAllSettings = async () => {
    try {
      const keys = Object.values(SETTINGS_KEYS)
      const res = await fetch(`/api/system-settings?limit=50`)
      const data = await res.json()
      if (res.ok && data.settings) {
        const map = new Map<string, any>(data.settings.map((s: any) => [s.key, s]))
        setPlatform({
          defaultTimezone:   map.get('global_timezone')?.value || 'Africa/Nairobi',
          defaultCurrency:   map.get('global_currency')?.value || 'KES',
          dateFormat:        map.get('global_date_format')?.value || 'DD/MM/YYYY',
          defaultLanguage:   map.get('global_language')?.value || 'en',
          defaultAiModel:    map.get('global_default_ai_model')?.value || 'gpt-4o-mini',
          teacherAiModel:    map.get('global_teacher_ai_model')?.value || 'gpt-4o',
          maxSchools:        map.get('global_max_schools')?.value || '100',
          maxUsersPerSchool: map.get('global_max_users_per_school')?.value || '500',
        })
        setFeatures({
          enableAiTutoring:         map.get('feature_ai_tutoring')?.value === 'true',
          enableParentDashboard:    map.get('feature_parent_dashboard')?.value === 'true',
          enableStudentRegistration: map.get('feature_student_registration')?.value === 'true',
          enablePublicSignup:       map.get('feature_public_signup')?.value === 'true',
          enableNotifications:      map.get('feature_notifications')?.value === 'true',
          enableAnalytics:          map.get('feature_analytics')?.value === 'true',
        })
      }
    } catch (e) { console.warn('[SuperAdminGlobal] loadAllSettings error:', e) }
  }

  useEffect(() => { loadAllSettings().finally(() => setLoading(false)) }, [])

  const saveSetting = async (key: string, value: string, description: string) => {
    setSaving(key)
    try {
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key, value, type: 'string', category: 'global',
          description, isPublic: false, isEditable: true,
        }),
      })
      if (res.ok) {
        toast({ title: 'Saved', description: `${key} updated successfully` })
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.error || 'Failed to save', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save setting', variant: 'destructive' })
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="edugenius-text-gradient">Platform Settings</span>
          </h1>
          <p className="text-gray-600">Platform-wide defaults, feature flags, regional configuration and maintenance.</p>
        </div>
      </div>

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="platform" className="flex items-center gap-2">
            <Monitor className="w-4 h-4" /> Platform Defaults
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Zap className="w-4 h-4" /> Feature Flags
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <Globe className="w-4 h-4" /> Regional
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Settings className="w-4 h-4" /> All Settings
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" /> Maintenance
          </TabsTrigger>
        </TabsList>

        {/* ── Platform Defaults ─────────────────────────────────────────── */}
        <TabsContent value="platform" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-600" /> Platform Defaults
              </CardTitle>
              <CardDescription>Set default values applied platform-wide and to newly created schools.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Default AI Model (Students)</Label>
                  <Select value={platform.defaultAiModel} onValueChange={v => setPlatform(p => ({ ...p, defaultAiModel: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">AI model used for student AI tutor by default</p>
                </div>
                <div className="space-y-2">
                  <Label>Default AI Model (Teachers)</Label>
                  <Select value={platform.teacherAiModel} onValueChange={v => setPlatform(p => ({ ...p, teacherAiModel: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">AI model used for teacher tools by default</p>
                </div>
                <div className="space-y-2">
                  <Label>Default Timezone</Label>
                  <Select value={platform.defaultTimezone} onValueChange={v => setPlatform(p => ({ ...p, defaultTimezone: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select value={platform.defaultCurrency} onValueChange={v => setPlatform(p => ({ ...p, defaultCurrency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select value={platform.dateFormat} onValueChange={v => setPlatform(p => ({ ...p, dateFormat: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DATE_FORMATS.map(df => <SelectItem key={df.value} value={df.value}>{df.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Schools (Platform Limit)</Label>
                  <Input type="number" value={platform.maxSchools} onChange={e => setPlatform(p => ({ ...p, maxSchools: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Max Users Per School</Label>
                  <Input type="number" value={platform.maxUsersPerSchool} onChange={e => setPlatform(p => ({ ...p, maxUsersPerSchool: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={async () => {
                  for (const [field, key] of Object.entries(SETTINGS_KEYS)) {
                    if (['timezone', 'currency', 'dateFormat', 'defaultAiModel', 'teacherAiModel', 'maxSchools', 'maxUsersPerSchool'].includes(field)) {
                      const val = (platform as any)[field as keyof typeof platform]
                      if (val !== undefined) await saveSetting(key, String(val), `Global setting: ${field}`)
                    }
                  }
                  toast({ title: 'All platform defaults saved' })
                }} disabled={!!saving} className="edugenius-button">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save All Platform Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Feature Flags ────────────────────────────────────────────── */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" /> Feature Flags
              </CardTitle>
              <CardDescription>Enable or disable platform-wide features. Disabling a feature hides it from all users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {([
                { key: 'enableAiTutoring', label: 'AI Tutoring', desc: 'Allow students to use AI tutor chat', settingKey: SETTINGS_KEYS.enableAiTutoring },
                { key: 'enableParentDashboard', label: 'Parent Dashboard', desc: 'Enable parent portal with student progress view', settingKey: SETTINGS_KEYS.enableParentDashboard },
                { key: 'enableStudentRegistration', label: 'Student Registration', desc: 'Allow school admins to enroll new students', settingKey: SETTINGS_KEYS.enableStudentRegistration },
                { key: 'enablePublicSignup', label: 'Public Signup', desc: 'Allow anyone to create a school account', settingKey: SETTINGS_KEYS.enablePublicSignup },
                { key: 'enableNotifications', label: 'Notifications', desc: 'Enable email and in-app notifications', settingKey: SETTINGS_KEYS.enableNotifications },
                { key: 'enableAnalytics', label: 'Analytics', desc: 'Track and display platform usage analytics', settingKey: SETTINGS_KEYS.enableAnalytics },
              ] as const).map(f => (
                <div key={f.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{f.label}</p>
                    <p className="text-sm text-gray-500">{f.desc}</p>
                  </div>
                  <Switch
                    checked={(features as any)[f.key]}
                    onCheckedChange={async v => {
                      setFeatures(prev => ({ ...prev, [f.key]: v }))
                      await saveSetting(f.settingKey, String(v), `Feature flag: ${f.label}`)
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Regional ─────────────────────────────────────────────────── */}
        <TabsContent value="regional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-600" /> Regional Settings
              </CardTitle>
              <CardDescription>Regional defaults applied to new schools and the platform dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Clock className="w-4 h-4" /> Timezone</Label>
                  <Select value={platform.defaultTimezone} onValueChange={v => setPlatform(p => ({ ...p, defaultTimezone: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Currency</Label>
                  <Select value={platform.defaultCurrency} onValueChange={v => setPlatform(p => ({ ...p, defaultCurrency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Date Format</Label>
                  <Select value={platform.dateFormat} onValueChange={v => setPlatform(p => ({ ...p, dateFormat: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DATE_FORMATS.map(df => <SelectItem key={df.value} value={df.value}>{df.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Languages className="w-4 h-4" /> Default Language</Label>
                  <Select value={platform.defaultLanguage} onValueChange={v => setPlatform(p => ({ ...p, defaultLanguage: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="sw">Swahili (Kiswahili)</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">Default language for new user accounts and platform UI</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={async () => {
                  await saveSetting(SETTINGS_KEYS.timezone, platform.defaultTimezone, 'Platform default timezone')
                  await saveSetting(SETTINGS_KEYS.currency, platform.defaultCurrency, 'Platform default currency')
                  await saveSetting(SETTINGS_KEYS.dateFormat, platform.dateFormat, 'Platform default date format')
                  await saveSetting(SETTINGS_KEYS.language, platform.defaultLanguage, 'Platform default language')
                  toast({ title: 'Regional settings saved' })
                }} disabled={!!saving} className="edugenius-button">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Regional Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── All Settings (raw key-value browser) ─────────────────────── */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" /> All Global Settings
                  </CardTitle>
                  <CardDescription>Browse all key-value settings stored in the system. Use with caution.</CardDescription>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input className="pl-9" placeholder="Search settings..." value={settingsSearch}
                    onChange={e => { setSettingsSearch(e.target.value); setSettingsPage(1) }} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SettingsBrowser
                search={settingsSearch}
                page={settingsPage}
                onPageChange={setSettingsPage}
                onView={(s) => { setSelectedSetting(s); setDetailsModalOpen(true) }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Maintenance ──────────────────────────────────────────────── */}
        <TabsContent value="maintenance" className="space-y-4">
          <MaintenanceModeCard />
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={detailsModalOpen} onOpenChange={o => { if (!o) { setDetailsModalOpen(false); setSelectedSetting(null) }}}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" /> Setting Details
            </DialogTitle>
            <DialogDescription>View and manage this system setting.</DialogDescription>
          </DialogHeader>
          {selectedSetting && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-gray-500">Key</Label>
                <p className="font-mono text-sm mt-1">{selectedSetting.key}</p>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-500">Value</Label>
                <p className="font-mono text-sm bg-gray-50 p-2 rounded mt-1 break-all">{selectedSetting.value}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-500">Category</Label>
                  <p className="text-sm mt-1 capitalize">{selectedSetting.category}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500">Type</Label>
                  <p className="text-sm mt-1 capitalize">{selectedSetting.type}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500">Public</Label>
                  <p className="text-sm mt-1">{selectedSetting.isPublic ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500">Editable</Label>
                  <p className="text-sm mt-1">{selectedSetting.isEditable ? 'Yes' : 'No'}</p>
                </div>
              </div>
              {selectedSetting.description && (
                <div>
                  <Label className="text-xs font-semibold text-gray-500">Description</Label>
                  <p className="text-sm mt-1">{selectedSetting.description}</p>
                </div>
              )}
              <div className="text-xs text-gray-400">
                Updated by {selectedSetting.updatedByUser?.firstName} {selectedSetting.updatedByUser?.lastName} · {new Date(selectedSetting.updatedAt).toLocaleDateString()}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDetailsModalOpen(false); setSelectedSetting(null) }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Inline component for browsing all settings with pagination */
function SettingsBrowser({
  search, page, onPageChange, onView
}: {
  search: string; page: number; onPageChange: (p: number) => void
  onView: (s: any) => void
}) {
  const [data, setData] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '10', ...(search && { search }) })
    fetch(`/api/system-settings?${params}`)
      .then(r => r.json())
      .then(d => { setData(d.settings || []); setPagination(d.pagination) })
      .finally(() => setLoading(false))
  }, [search, page])

  if (loading) return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-2/5 bg-slate-200 rounded" />
            <div className="h-3 w-3/4 bg-slate-200 rounded" />
          </div>
          <div className="h-5 w-12 bg-slate-200 rounded ml-4" />
        </div>
      ))}
    </div>
  )

  if (!data.length) return <p className="text-center py-8 text-gray-500">No settings found.</p>

  return (
    <div className="space-y-3">
      {data.map(s => (
        <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => onView(s)}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium">{s.key}</span>
              <Badge className="bg-blue-100 text-blue-800 text-xs">{s.category}</Badge>
              <Badge className="bg-gray-100 text-gray-700 text-xs">{s.type}</Badge>
              {!s.isEditable && <Lock className="w-3 h-3 text-red-500" />}
            </div>
            <p className="text-sm text-gray-600 truncate mt-1">{s.value}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onView(s) }}>
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ))}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-gray-500">{pagination.total} total</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">{page} of {pagination.pages}</span>
            <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Maintenance Mode Card ── */
function MaintenanceModeCard() {
  const { toast } = useToast()
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/super-admin/maintenance-status')
      .then(r => r.json())
      .then(d => { setEnabled(d.enabled); setMessage(d.message || '') })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const value = JSON.stringify({ enabled, message: message.trim() })
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'maintenance_mode',
          value,
          type: 'json',
          category: 'system',
          description: 'Maintenance mode toggle',
          isPublic: true,
          isEditable: true,
        }),
      })
      if (res.ok) {
        toast({ title: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled' })
      } else {
        const err = await res.json()
        toast({ variant: 'destructive', title: 'Error', description: err.error || 'Failed to save' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save' })
    } finally { setSaving(false) }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className={`border-0 ${enabled ? 'bg-gradient-to-r from-red-50 to-rose-50' : 'bg-gradient-to-r from-green-50 to-emerald-50'}`}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {enabled ? <AlertCircle className="w-6 h-6 text-red-600" /> : <CheckCircle className="w-6 h-6 text-green-600" />}
            <div>
              <p className="font-medium">{enabled ? 'Maintenance mode is active' : 'Maintenance mode is off'}</p>
              <p className="text-sm text-gray-500">
                {enabled
                  ? 'Non-admin users will be redirected to the maintenance page'
                  : 'All users can access the platform normally'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{enabled ? 'On' : 'Off'}</span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" />
            Maintenance Message
          </CardTitle>
          <CardDescription>
            This message will be shown to users on the maintenance page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Custom Message</Label>
            <textarea
              className="w-full min-h-[100px] rounded-lg border border-gray-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="e.g. We are performing scheduled maintenance. Please check back shortly."
              value={message}
              onChange={e => setMessage(e.target.value)}
              disabled={!enabled}
            />
            <p className="text-xs text-gray-400">
              Leave empty to show the default maintenance message.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={save}
              disabled={saving}
              className={enabled
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                : 'edugenius-button'}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {enabled ? 'Disable & Save' : 'Enable & Save'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-blue-900">How maintenance mode works</p>
            <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>Super admins can always access the platform during maintenance</li>
              <li>All other users are redirected to the maintenance page</li>
              <li>The maintenance status is cached for 30 seconds in the middleware</li>
              <li>Changes take effect within 30 seconds of saving</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ── Zoom Integration Section ── */
function ZoomConfigSection() {
  const { toast } = useToast()
  const [config, setConfig] = useState({ zoom_sdk_key: '', zoom_sdk_secret: '', zoom_account_id: '', zoom_client_id: '', zoom_client_secret: '' })
  const [isConfigured, setIsConfigured] = useState(false)
  const [isOAuthConfigured, setIsOAuthConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)
  const [showSecrets, setShowSecrets] = useState(false)

  useEffect(() => {
    fetch('/api/zoom/config')
      .then(r => r.json())
      .then(d => {
        if (d.config) setConfig(prev => ({ ...prev, ...d.config }))
        setIsConfigured(d.isConfigured)
        setIsOAuthConfigured(d.isOAuthConfigured)
      }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/zoom/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: 'Zoom config saved', description: `Updated: ${data.updated?.join(', ') || 'all'}` })
      } else {
        toast({ variant: 'destructive', title: 'Error', description: data.error || 'Failed to save' })
      }
    } catch { toast({ variant: 'destructive', title: 'Error', description: 'Failed to save config' }) }
    finally { setSaving(false) }
  }

  const test = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/zoom/config', { method: 'PUT' })
      const data = await res.json()
      setTestResult(data)
    } catch {
      setTestResult({ success: false, error: 'Connection failed' })
    } finally { setTesting(false) }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className={`border-0 ${isConfigured ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gradient-to-r from-amber-50 to-yellow-50'}`}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConfigured ? <ShieldCheck className="w-6 h-6 text-green-600" /> : <AlertCircle className="w-6 h-6 text-amber-600" />}
            <div>
              <p className="font-medium">{isConfigured ? 'Zoom SDK configured' : 'Zoom SDK not configured'}</p>
              <p className="text-sm text-gray-500">
                {isConfigured ? 'Meeting SDK is ready for in-app video calls' : 'Add your Zoom Marketplace SDK credentials below'}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={test} disabled={testing}>
            {testing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Video className="w-4 h-4 mr-1" />}
            Test
          </Button>
        </CardContent>
      </Card>

      {testResult && (
        <Card className={`border-0 ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <CardContent className="p-4 flex items-center gap-3">
            {testResult.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
            <p className="text-sm">{testResult.message || testResult.error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-600" />
            Zoom Meeting SDK Credentials
          </CardTitle>
          <CardDescription>
            Get your SDK Key and Secret from{' '}
            <a href="https://marketplace.zoom.us/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Zoom Marketplace &rarr;
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SDK Key (Client ID)</Label>
              <Input
                value={config.zoom_sdk_key}
                onChange={e => setConfig(p => ({ ...p, zoom_sdk_key: e.target.value }))}
                placeholder="Enter SDK Key"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>SDK Secret</Label>
              <Input
                type={showSecrets ? 'text' : 'password'}
                value={config.zoom_sdk_secret}
                onChange={e => setConfig(p => ({ ...p, zoom_sdk_secret: e.target.value }))}
                placeholder="Enter SDK Secret"
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Configuration
            </Button>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={showSecrets} onChange={e => setShowSecrets(e.target.checked)} className="rounded" />
              Show secret
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4 flex items-start gap-3">
          <Video className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-blue-900">How to get Zoom SDK credentials</p>
            <ol className="text-xs text-blue-700 mt-2 list-decimal list-inside space-y-1">
              <li>Go to the <a href="https://marketplace.zoom.us/" target="_blank" rel="noopener noreferrer" className="underline">Zoom Marketplace</a></li>
              <li>Create a new app with the Meeting SDK capability</li>
              <li>Copy the SDK Key (Client ID) and SDK Secret</li>
              <li>Add your app domain to the allowlist: <code className="bg-white/80 px-1 rounded text-xs">{typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}</code></li>
              <li>Paste them here and click Save</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Server-to-Server OAuth — auto-create/manage meetings */}
      <Card className={`border-0 ${isOAuthConfigured ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gradient-to-r from-amber-50 to-yellow-50'}`}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOAuthConfigured ? <ShieldCheck className="w-6 h-6 text-green-600" /> : <AlertCircle className="w-6 h-6 text-amber-600" />}
            <div>
              <p className="font-medium">{isOAuthConfigured ? 'Server-to-Server OAuth configured' : 'Server-to-Server OAuth not configured'}</p>
              <p className="text-sm text-gray-500">
                {isOAuthConfigured ? 'Ready to auto-create and manage Zoom meetings' : 'Required for automatic meeting creation (Live Class, meetings scheduler)'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-purple-600" />
            Zoom Server-to-Server OAuth Credentials
          </CardTitle>
          <CardDescription>
            Required for automatic meeting creation. Get these from the Zoom Marketplace &rarr; Build App &rarr; Server-to-Server OAuth.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Account ID</Label>
              <Input
                value={config.zoom_account_id}
                onChange={e => setConfig(p => ({ ...p, zoom_account_id: e.target.value }))}
                placeholder="Account ID"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Client ID</Label>
              <Input
                value={config.zoom_client_id}
                onChange={e => setConfig(p => ({ ...p, zoom_client_id: e.target.value }))}
                placeholder="Client ID"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Client Secret</Label>
              <Input
                type={showSecrets ? 'text' : 'password'}
                value={config.zoom_client_secret}
                onChange={e => setConfig(p => ({ ...p, zoom_client_secret: e.target.value }))}
                placeholder="Client Secret"
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-purple-600 to-indigo-600">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save OAuth Credentials
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardContent className="p-4 flex items-start gap-3">
          <KeyRound className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-purple-900">How to get Server-to-Server OAuth credentials</p>
            <ol className="text-xs text-purple-700 mt-2 list-decimal list-inside space-y-1">
              <li>Go to the <a href="https://marketplace.zoom.us/" target="_blank" rel="noopener noreferrer" className="underline">Zoom Marketplace</a> and sign in</li>
              <li>Click <strong>Develop &rarr; Build App</strong></li>
              <li>Choose <strong>Server-to-Server OAuth</strong> (not OAuth, not SDK)</li>
              <li>Name your app (e.g. "ElimuNova") and click Create</li>
              <li>Copy the <strong>Account ID</strong>, <strong>Client ID</strong>, and <strong>Client Secret</strong> from the App Credentials page</li>
              <li>Under <strong>Scopes</strong>, add: <code className="bg-white/80 px-1 rounded text-xs">meeting:write:admin</code> and <code className="bg-white/80 px-1 rounded text-xs">meeting:read:admin</code></li>
              <li>Click <strong>Activate your app</strong> (must be activated or token requests fail)</li>
              <li>Paste the three values here and click Save</li>
            </ol>
            <p className="text-xs text-purple-600 mt-2">
              Note: The Account ID is found at the top of the App Credentials page, and the Client ID/Secret are just below it.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
