'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { 
  Search, 
  Filter, 
  Plus, 
  Settings, 
  Eye, 
  Edit, 
  Trash2, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  Lock,
  Globe,
  Shield,
  Bell,
  Database,
  BarChart3,
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import CreateSystemSettingModal from '@/components/modals/create-system-setting-modal'
import SystemSettingDetailsModal from '@/components/modals/system-setting-details-modal'

interface SystemSetting {
  id: string
  key: string
  value: string
  type: string
  category: string
  description?: string
  isPublic: boolean
  isEditable: boolean
  updatedBy: string
  createdAt: string
  updatedAt: string
  updatedByUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all-categories')
  const [typeFilter, setTypeFilter] = useState('all-types')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(null)
  const { toast } = useToast()

  // Email/SMTP configuration
  const [emailConfigOpen, setEmailConfigOpen] = useState(false)
  const [emailForm, setEmailForm] = useState({ smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '', smtp_from: '' })
  const [savingEmail, setSavingEmail] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [emailTestResult, setEmailTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const fetchSettings = async (page = 1, search = '', category = '', type = '', sort = 'createdAt', order = 'desc') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(category && category !== 'all-categories' && { category }),
        ...(type && type !== 'all-types' && { type }),
        sortBy: sort,
        sortOrder: order
      })

      const response = await fetch(`/api/system-settings?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setPagination(data.pagination)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch system settings",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: "Error",
        description: "Failed to fetch system settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings(currentPage, searchTerm, categoryFilter, typeFilter, sortBy, sortOrder)
  }, [currentPage, searchTerm, categoryFilter, typeFilter, sortBy, sortOrder])

  // Load existing SMTP settings
  useEffect(() => {
    const loadSmtp = async () => {
      try {
        const res = await fetch('/api/system-settings?search=smtp_&limit=10')
        const data = await res.json()
        if (res.ok && data.settings) {
          const map = new Map<string, string>(data.settings.map((s: any) => [s.key, s.value]))
          setEmailForm({
            smtp_host: map.get('smtp_host') || '',
            smtp_port: map.get('smtp_port') || '587',
            smtp_user: map.get('smtp_user') || '',
            smtp_pass: map.get('smtp_pass') || '',
            smtp_from: map.get('smtp_from') || '',
          })
        }
      } catch {}
    }
    loadSmtp()
  }, [])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const handleSettingCreated = (newSetting: SystemSetting) => {
    setSettings(prev => [newSetting, ...prev])
    toast({
      title: "Success",
      description: "System setting created successfully",
    })
  }

  const handleSettingUpdated = (updatedSetting: SystemSetting) => {
    setSettings(prev => prev.map(setting => 
      setting.id === updatedSetting.id ? updatedSetting : setting
    ))
    toast({
      title: "Success",
      description: "System setting updated successfully",
    })
  }

  const handleSettingDeleted = (settingId: string) => {
    setSettings(prev => prev.filter(setting => setting.id !== settingId))
    toast({
      title: "Success",
      description: "System setting deleted successfully",
    })
  }

  const handleSaveEmailConfig = async () => {
    setSavingEmail(true)
    setEmailTestResult(null)
    try {
      const res = await fetch('/api/super-admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...emailForm, save: true }),
      })
      const data = await res.json()
      if (res.ok) {
        setEmailTestResult(data.test || { ok: true, message: 'Settings saved' })
        toast({ title: 'Email settings saved', description: data.test?.message || '' })
        fetchSettings(currentPage, searchTerm, categoryFilter, typeFilter, sortBy, sortOrder)
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to save', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
    } finally {
      setSavingEmail(false)
    }
  }

  const handleTestEmailConfig = async () => {
    setTestingEmail(true)
    setEmailTestResult(null)
    try {
      const res = await fetch('/api/super-admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...emailForm, save: false }),
      })
      const data = await res.json()
      setEmailTestResult(data)
    } catch {
      setEmailTestResult({ ok: false, message: 'Network error' })
    } finally {
      setTestingEmail(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return Settings
      case 'security': return Shield
      case 'notifications': return Bell
      case 'system': return Database
      case 'analytics': return BarChart3
      case 'email': return Mail
      default: return Settings
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'bg-blue-100 text-blue-800'
      case 'security': return 'bg-red-100 text-red-800'
      case 'notifications': return 'bg-yellow-100 text-yellow-800'
      case 'system': return 'bg-purple-100 text-purple-800'
      case 'analytics': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'bg-blue-100 text-blue-800'
      case 'number': return 'bg-green-100 text-green-800'
      case 'boolean': return 'bg-yellow-100 text-yellow-800'
      case 'json': return 'bg-purple-100 text-purple-800'
      case 'array': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatValue = (value: string, type: string) => {
    if (type === 'boolean') {
      return value === 'true' ? 'Yes' : 'No'
    }
    if (type === 'number') {
      return Number(value).toLocaleString()
    }
    if (type === 'array' || type === 'json') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed.join(', ') : JSON.stringify(parsed)
      } catch {
        return value
      }
    }
    return value.length > 50 ? `${value.substring(0, 50)}...` : value
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="edugenius-text-gradient">System Settings</span>
          </h1>
          <p className="text-gray-600">Manage system configuration and preferences</p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="edugenius-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Setting
        </Button>
      </div>

      {/* Email Configuration */}
      <Card className="border-0 edugenius-card-gradient">
        <CardContent className="p-6">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setEmailConfigOpen(v => !v)}>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Email / SMTP Configuration</h3>
                <p className="text-sm text-gray-500">Configure SMTP settings for sending credential emails</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              {emailConfigOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {emailConfigOpen && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600">SMTP Host</label>
                  <Input value={emailForm.smtp_host} onChange={e => setEmailForm(p => ({ ...p, smtp_host: e.target.value }))} placeholder="smtp.gmail.com" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">SMTP Port</label>
                  <Input value={emailForm.smtp_port} onChange={e => setEmailForm(p => ({ ...p, smtp_port: e.target.value }))} placeholder="587" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">SMTP User</label>
                  <Input value={emailForm.smtp_user} onChange={e => setEmailForm(p => ({ ...p, smtp_user: e.target.value }))} placeholder="your@email.com" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">SMTP Password</label>
                  <Input value={emailForm.smtp_pass} onChange={e => setEmailForm(p => ({ ...p, smtp_pass: e.target.value }))} type="password" placeholder="App password" className="mt-1" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600">From Address</label>
                  <Input value={emailForm.smtp_from} onChange={e => setEmailForm(p => ({ ...p, smtp_from: e.target.value }))} placeholder="noreply@yourdomain.com" className="mt-1" />
                </div>
              </div>

              {emailTestResult && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${emailTestResult.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {emailTestResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                  {emailTestResult.message}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleTestEmailConfig} disabled={testingEmail}>
                  {testingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Test Connection
                </Button>
                <Button onClick={handleSaveEmailConfig} disabled={savingEmail} className="edugenius-button">
                  {savingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Settings className="mr-2 h-4 w-4" />}
                  Save & Test
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="border-0 edugenius-card-gradient">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search settings..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 edugenius-glass"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 edugenius-glass">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-categories">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="notifications">Notifications</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 edugenius-glass">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-types">All Types</SelectItem>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="array">Array</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid gap-6">
          {settings.map((setting) => {
            const CategoryIcon = getCategoryIcon(setting.category)
            return (
              <Card key={setting.id} className="edugenius-card-gradient hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <CategoryIcon className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">{setting.key}</h3>
                        <Badge className={getCategoryColor(setting.category)}>
                          {setting.category}
                        </Badge>
                        <Badge className={getTypeColor(setting.type)}>
                          {setting.type}
                        </Badge>
                        {!setting.isEditable && (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            <Lock className="w-3 h-3 mr-1" />
                            Read Only
                          </Badge>
                        )}
                        {setting.isPublic && (
                          <Badge variant="outline" className="text-green-600 border-red-600">
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </Badge>
                        )}
                      </div>
                      
                      {setting.description && (
                        <p className="text-gray-600 mb-3">{setting.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="font-medium">Value:</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {formatValue(setting.value, setting.type)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                        <span>Updated by {setting.updatedByUser.firstName} {setting.updatedByUser.lastName}</span>
                        <span>•</span>
                        <span>{new Date(setting.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSetting(setting)
                          setDetailsModalOpen(true)
                        }}
                        className="edugenius-glass"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {setting.isEditable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSetting(setting)
                            setDetailsModalOpen(true)
                          }}
                          className="edugenius-glass"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Card className="border-0 edugenius-card-gradient">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} settings
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="edugenius-glass"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-3">
                  {currentPage} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={currentPage === pagination.pages}
                  className="edugenius-glass"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateSystemSettingModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSettingCreated={handleSettingCreated}
      />

      <SystemSettingDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedSetting(null)
        }}
        setting={selectedSetting}
        onSettingUpdated={handleSettingUpdated}
        onSettingDeleted={handleSettingDeleted}
      />
    </div>
  )
}
