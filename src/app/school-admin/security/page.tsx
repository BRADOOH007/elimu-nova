"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { confirmToast } from '@/lib/confirm-toast'
import { 
  Search,
  Plus,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Lock,
  Unlock,
  Settings,
  FileText,
  Users,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle2,
  X
} from "lucide-react"

interface SecurityLog {
  id: string
  eventType: string
  severity: string
  description: string
  ipAddress?: string
  userAgent?: string
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
  user?: {
    firstName: string
    lastName: string
    email: string
  }
  resolver?: {
    firstName: string
    lastName: string
    email: string
  }
}

interface SecurityPolicy {
  id: string
  name: string
  description?: string
  policyType: string
  rules: string
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
  createdByUser: {
    firstName: string
    lastName: string
    email: string
  }
  updatedByUser: {
    firstName: string
    lastName: string
    email: string
  }
}

interface LogsResponse {
  logs: SecurityLog[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface PoliciesResponse {
  policies: SecurityPolicy[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const eventTypes = [
  { value: 'all', label: 'All Events' },
  { value: 'LOGIN_SUCCESS', label: 'Login Success' },
  { value: 'LOGIN_FAILED', label: 'Login Failed' },
  { value: 'PASSWORD_CHANGE', label: 'Password Change' },
  { value: 'PERMISSION_DENIED', label: 'Permission Denied' },
  { value: 'SUSPICIOUS_ACTIVITY', label: 'Suspicious Activity' },
  { value: 'DATA_BREACH_ATTEMPT', label: 'Data Breach Attempt' },
  { value: 'UNAUTHORIZED_ACCESS', label: 'Unauthorized Access' },
  { value: 'SYSTEM_INTRUSION', label: 'System Intrusion' },
  { value: 'MALWARE_DETECTED', label: 'Malware Detected' },
  { value: 'POLICY_VIOLATION', label: 'Policy Violation' },
  { value: 'ACCOUNT_LOCKED', label: 'Account Locked' },
  { value: 'ACCOUNT_UNLOCKED', label: 'Account Unlocked' },
  { value: 'TWO_FACTOR_ENABLED', label: '2FA Enabled' },
  { value: 'TWO_FACTOR_DISABLED', label: '2FA Disabled' },
  { value: 'API_ABUSE', label: 'API Abuse' },
  { value: 'BRUTE_FORCE_ATTEMPT', label: 'Brute Force Attempt' },
  { value: 'PHISHING_ATTEMPT', label: 'Phishing Attempt' },
  { value: 'CUSTOM', label: 'Custom Event' }
]

const severities = [
  { value: 'all', label: 'All Severities' },
  { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-800' }
]

const policyTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'AUTHENTICATION', label: 'Authentication' },
  { value: 'AUTHORIZATION', label: 'Authorization' },
  { value: 'PASSWORD', label: 'Password' },
  { value: 'SESSION', label: 'Session' },
  { value: 'API_RATE_LIMITING', label: 'API Rate Limiting' },
  { value: 'IP_WHITELIST', label: 'IP Whitelist' },
  { value: 'IP_BLACKLIST', label: 'IP Blacklist' },
  { value: 'FILE_UPLOAD', label: 'File Upload' },
  { value: 'DATA_ACCESS', label: 'Data Access' },
  { value: 'AUDIT_LOGGING', label: 'Audit Logging' },
  { value: 'CUSTOM', label: 'Custom' }
]

export default function SchoolAdminSecurityPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('logs')
  
  // Security logs state
  const [logs, setLogs] = useState<SecurityLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsPagination, setLogsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  
  // Security policies state
  const [policies, setPolicies] = useState<SecurityPolicy[]>([])
  const [policiesLoading, setPoliciesLoading] = useState(true)
  const [policiesPagination, setPoliciesPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [resolvedFilter, setResolvedFilter] = useState('all')
  const [policyTypeFilter, setPolicyTypeFilter] = useState('all')
  const [isActiveFilter, setIsActiveFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Modal states
  const [createLogModalOpen, setCreateLogModalOpen] = useState(false)
  const [createPolicyModalOpen, setCreatePolicyModalOpen] = useState(false)
  const [editLogModalOpen, setEditLogModalOpen] = useState(false)
  const [editPolicyModalOpen, setEditPolicyModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null)
  const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null)
  
  // Form states
  const [logFormData, setLogFormData] = useState({
    eventType: '',
    severity: 'MEDIUM',
    description: '',
    ipAddress: '',
    userAgent: '',
    userId: '',
    metadata: ''
  })

  const [policyFormData, setPolicyFormData] = useState({
    name: '',
    description: '',
    policyType: '',
    rules: '',
    isActive: true,
    priority: 0
  })

  // Fetch security logs
  const fetchLogs = async (page = 1) => {
    try {
      setLogsLoading(true)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: logsPagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(eventTypeFilter !== 'all' && { eventType: eventTypeFilter }),
        ...(severityFilter !== 'all' && { severity: severityFilter }),
        ...(resolvedFilter !== 'all' && { resolved: resolvedFilter }),
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/school-admin/security/logs?${params}`)
      if (response.ok) {
        const data: LogsResponse = await response.json()
        setLogs(data.logs)
        setLogsPagination(data.pagination)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch security logs",
        })
      }
    } catch (error) {
      console.error('Error fetching security logs:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch security logs",
      })
    } finally {
      setLogsLoading(false)
    }
  }

  // Fetch security policies
  const fetchPolicies = async (page = 1) => {
    try {
      setPoliciesLoading(true)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: policiesPagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(policyTypeFilter !== 'all' && { policyType: policyTypeFilter }),
        ...(isActiveFilter !== 'all' && { isActive: isActiveFilter }),
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/school-admin/security/policies?${params}`)
      if (response.ok) {
        const data: PoliciesResponse = await response.json()
        setPolicies(data.policies)
        setPoliciesPagination(data.pagination)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch security policies",
        })
      }
    } catch (error) {
      console.error('Error fetching security policies:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch security policies",
      })
    } finally {
      setPoliciesLoading(false)
    }
  }

  // Load data
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs()
    } else {
      fetchPolicies()
    }
  }, [activeTab, searchQuery, eventTypeFilter, severityFilter, resolvedFilter, policyTypeFilter, isActiveFilter, sortBy, sortOrder])

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (activeTab === 'logs') {
      setLogsPagination(prev => ({ ...prev, page: 1 }))
    } else {
      setPoliciesPagination(prev => ({ ...prev, page: 1 }))
    }
  }

  // Handle filter changes
  const handleLogFilterChange = (filter: string, value: string) => {
    switch (filter) {
      case 'eventType':
        setEventTypeFilter(value)
        break
      case 'severity':
        setSeverityFilter(value)
        break
      case 'resolved':
        setResolvedFilter(value)
        break
    }
    setLogsPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePolicyFilterChange = (filter: string, value: string) => {
    switch (filter) {
      case 'policyType':
        setPolicyTypeFilter(value)
        break
      case 'isActive':
        setIsActiveFilter(value)
        break
    }
    setPoliciesPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle sort changes
  const handleSortChange = (field: string) => {
    setSortBy(field)
  }

  const handleSortOrderChange = (order: string) => {
    setSortOrder(order)
  }

  // Handle page changes
  const handleLogPageChange = (page: number) => {
    setLogsPagination(prev => ({ ...prev, page }))
    fetchLogs(page)
  }

  const handlePolicyPageChange = (page: number) => {
    setPoliciesPagination(prev => ({ ...prev, page }))
    fetchPolicies(page)
  }

  // Handle refresh
  const handleRefresh = () => {
    if (activeTab === 'logs') {
      fetchLogs(logsPagination.page)
    } else {
      fetchPolicies(policiesPagination.page)
    }
  }

  // Create security log
  const handleCreateLog = async () => {
    try {
      const response = await fetch('/api/school-admin/security/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logFormData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Security log created successfully",
        })
        setCreateLogModalOpen(false)
        setLogFormData({
          eventType: '',
          severity: 'MEDIUM',
          description: '',
          ipAddress: '',
          userAgent: '',
          userId: '',
          metadata: ''
        })
        fetchLogs(logsPagination.page)
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to create security log",
        })
      }
    } catch (error) {
      console.error('Error creating security log:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create security log",
      })
    }
  }

  // Update security log
  const handleUpdateLog = async () => {
    if (!selectedLog) return

    try {
      const response = await fetch(`/api/school-admin/security/logs/${selectedLog.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logFormData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Security log updated successfully",
        })
        setEditLogModalOpen(false)
        setSelectedLog(null)
        setLogFormData({
          eventType: '',
          severity: 'MEDIUM',
          description: '',
          ipAddress: '',
          userAgent: '',
          userId: '',
          metadata: ''
        })
        fetchLogs(logsPagination.page)
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to update security log",
        })
      }
    } catch (error) {
      console.error('Error updating security log:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update security log",
      })
    }
  }

  // Delete security log
  const handleDeleteLog = async (logId: string) => {
    if (!(await confirmToast({ title: 'Delete this security log? This cannot be undone.' }))) return
    try {
      const response = await fetch(`/api/school-admin/security/logs/${logId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Security log deleted successfully",
        })
        fetchLogs(logsPagination.page)
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to delete security log",
        })
      }
    } catch (error) {
      console.error('Error deleting security log:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete security log",
      })
    }
  }

  // Create security policy
  const handleCreatePolicy = async () => {
    try {
      const response = await fetch('/api/school-admin/security/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policyFormData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Security policy created successfully",
        })
        setCreatePolicyModalOpen(false)
        setPolicyFormData({
          name: '',
          description: '',
          policyType: '',
          rules: '',
          isActive: true,
          priority: 0
        })
        fetchPolicies(policiesPagination.page)
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to create security policy",
        })
      }
    } catch (error) {
      console.error('Error creating security policy:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create security policy",
      })
    }
  }

  // Update security policy
  const handleUpdatePolicy = async () => {
    if (!selectedPolicy) return

    try {
      const response = await fetch(`/api/school-admin/security/policies/${selectedPolicy.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policyFormData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Security policy updated successfully",
        })
        setEditPolicyModalOpen(false)
        setSelectedPolicy(null)
        setPolicyFormData({
          name: '',
          description: '',
          policyType: '',
          rules: '',
          isActive: true,
          priority: 0
        })
        fetchPolicies(policiesPagination.page)
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to update security policy",
        })
      }
    } catch (error) {
      console.error('Error updating security policy:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update security policy",
      })
    }
  }

  // Delete security policy
  const handleDeletePolicy = async (policyId: string) => {
    if (!(await confirmToast({ title: 'Delete this security policy? This cannot be undone.' }))) return
    try {
      const response = await fetch(`/api/school-admin/security/policies/${policyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Security policy deleted successfully",
        })
        fetchPolicies(policiesPagination.page)
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to delete security policy",
        })
      }
    } catch (error) {
      console.error('Error deleting security policy:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete security policy",
      })
    }
  }

  // Open edit modal with data
  const openEditLogModal = (log: SecurityLog) => {
    setSelectedLog(log)
    setLogFormData({
      eventType: log.eventType,
      severity: log.severity,
      description: log.description,
      ipAddress: log.ipAddress || '',
      userAgent: log.userAgent || '',
      userId: '',
      metadata: ''
    })
    setEditLogModalOpen(true)
  }

  const openEditPolicyModal = (policy: SecurityPolicy) => {
    setSelectedPolicy(policy)
    setPolicyFormData({
      name: policy.name,
      description: policy.description || '',
      policyType: policy.policyType,
      rules: policy.rules,
      isActive: policy.isActive,
      priority: policy.priority
    })
    setEditPolicyModalOpen(true)
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    const severityInfo = severities.find(s => s.value === severity)
    return severityInfo?.color || 'bg-gray-100 text-gray-800'
  }

  // Get event type label
  const getEventTypeLabel = (eventType: string) => {
    const eventInfo = eventTypes.find(e => e.value === eventType)
    return eventInfo?.label || eventType
  }

  // Get policy type label
  const getPolicyTypeLabel = (policyType: string) => {
    const policyInfo = policyTypes.find(p => p.value === policyType)
    return policyInfo?.label || policyType
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Management</h1>
          <p className="text-muted-foreground">
            Monitor security events and manage security policies
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={activeTab === 'logs' ? logsLoading : policiesLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(activeTab === 'logs' ? logsLoading : policiesLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => {
              if (activeTab === 'logs') {
                setCreateLogModalOpen(true)
              } else {
                setCreatePolicyModalOpen(true)
              }
            }}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {activeTab === 'logs' ? 'Log' : 'Policy'}
          </Button>
        </div>
      </div>

      {/* Security Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="logs" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Security Logs</span>
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Security Policies</span>
          </TabsTrigger>
        </TabsList>

        {/* Security Logs Tab Content */}
        <TabsContent value="logs" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search security logs..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={eventTypeFilter} onValueChange={(value) => handleLogFilterChange('eventType', value)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((event) => (
                      <SelectItem key={event.value} value={event.value}>
                        {event.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={(value) => handleLogFilterChange('severity', value)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {severities.map((severity) => (
                      <SelectItem key={severity.value} value={severity.value}>
                        {severity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={resolvedFilter} onValueChange={(value) => handleLogFilterChange('resolved', value)}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Resolved</SelectItem>
                    <SelectItem value="false">Unresolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Security Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Security Logs</CardTitle>
              <CardDescription>
                Monitor security events and incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No security logs found</h3>
                  <p className="text-gray-500">
                    {searchQuery ? 'Try adjusting your search criteria' : 'No security events have been recorded yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            log.severity === 'CRITICAL' ? 'bg-red-100' :
                            log.severity === 'HIGH' ? 'bg-orange-100' :
                            log.severity === 'MEDIUM' ? 'bg-yellow-100' : 'bg-green-100'
                          }`}>
                            {log.severity === 'CRITICAL' ? <AlertCircle className="w-5 h-5 text-red-600" /> :
                             log.severity === 'HIGH' ? <AlertTriangle className="w-5 h-5 text-orange-600" /> :
                             log.severity === 'MEDIUM' ? <AlertTriangle className="w-5 h-5 text-yellow-600" /> :
                             <CheckCircle className="w-5 h-5 text-green-600" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {getEventTypeLabel(log.eventType)}
                            </h3>
                            <Badge className={getSeverityColor(log.severity)}>
                              {log.severity}
                            </Badge>
                            {log.resolved ? (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Resolved
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600">
                                <X className="w-3 h-3 mr-1" />
                                Unresolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {log.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            {log.ipAddress && (
                              <span className="text-xs text-gray-400">
                                IP: {log.ipAddress}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {formatDate(log.createdAt)}
                            </span>
                            {log.user && (
                              <span className="text-xs text-gray-400">
                                User: {log.user.firstName} {log.user.lastName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditLogModal(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditLogModal(log)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLog(log.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {logsPagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {((logsPagination.page - 1) * logsPagination.limit) + 1} to{' '}
                    {Math.min(logsPagination.page * logsPagination.limit, logsPagination.total)} of{' '}
                    {logsPagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLogPageChange(logsPagination.page - 1)}
                      disabled={logsPagination.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-500">
                      Page {logsPagination.page} of {logsPagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLogPageChange(logsPagination.page + 1)}
                      disabled={logsPagination.page === logsPagination.pages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Policies Tab Content */}
        <TabsContent value="policies" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search security policies..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={policyTypeFilter} onValueChange={(value) => handlePolicyFilterChange('policyType', value)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Policy Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {policyTypes.map((policy) => (
                      <SelectItem key={policy.value} value={policy.value}>
                        {policy.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={isActiveFilter} onValueChange={(value) => handlePolicyFilterChange('isActive', value)}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Security Policies Table */}
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>
                Manage security policies and rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {policiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : policies.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No security policies found</h3>
                  <p className="text-gray-500">
                    {searchQuery ? 'Try adjusting your search criteria' : 'No security policies have been created yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {policies.map((policy) => (
                    <div
                      key={policy.id}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {policy.name}
                            </h3>
                            <Badge className={policy.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {policy.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline">
                              {getPolicyTypeLabel(policy.policyType)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {policy.description || 'No description'}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-400">
                              Priority: {policy.priority}
                            </span>
                            <span className="text-xs text-gray-400">
                              Created: {formatDate(policy.createdAt)}
                            </span>
                            <span className="text-xs text-gray-400">
                              by {policy.createdByUser.firstName} {policy.createdByUser.lastName}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditPolicyModal(policy)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditPolicyModal(policy)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePolicy(policy.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {policiesPagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {((policiesPagination.page - 1) * policiesPagination.limit) + 1} to{' '}
                    {Math.min(policiesPagination.page * policiesPagination.limit, policiesPagination.total)} of{' '}
                    {policiesPagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePolicyPageChange(policiesPagination.page - 1)}
                      disabled={policiesPagination.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-500">
                      Page {policiesPagination.page} of {policiesPagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePolicyPageChange(policiesPagination.page + 1)}
                      disabled={policiesPagination.page === policiesPagination.pages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Security Log Modal */}
      <Dialog open={createLogModalOpen} onOpenChange={setCreateLogModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Security Log</DialogTitle>
            <DialogDescription>
              Create a new security event log entry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventType">Event Type</Label>
                <Select value={logFormData.eventType} onValueChange={(value) => setLogFormData(prev => ({ ...prev, eventType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.filter(e => e.value !== 'all').map((event) => (
                      <SelectItem key={event.value} value={event.value}>
                        {event.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select value={logFormData.severity} onValueChange={(value) => setLogFormData(prev => ({ ...prev, severity: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {severities.filter(s => s.value !== 'all').map((severity) => (
                      <SelectItem key={severity.value} value={severity.value}>
                        {severity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter event description"
                value={logFormData.description}
                onChange={(e) => setLogFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ipAddress">IP Address</Label>
                <Input
                  id="ipAddress"
                  placeholder="192.168.1.1"
                  value={logFormData.ipAddress}
                  onChange={(e) => setLogFormData(prev => ({ ...prev, ipAddress: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="userAgent">User Agent</Label>
                <Input
                  id="userAgent"
                  placeholder="Mozilla/5.0..."
                  value={logFormData.userAgent}
                  onChange={(e) => setLogFormData(prev => ({ ...prev, userAgent: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="metadata">Metadata (JSON)</Label>
              <Textarea
                id="metadata"
                placeholder='{"key": "value"}'
                value={logFormData.metadata}
                onChange={(e) => setLogFormData(prev => ({ ...prev, metadata: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateLogModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLog}>
              Create Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Security Log Modal */}
      <Dialog open={editLogModalOpen} onOpenChange={setEditLogModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Security Log</DialogTitle>
            <DialogDescription>
              Update security event log entry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editEventType">Event Type</Label>
                <Select value={logFormData.eventType} onValueChange={(value) => setLogFormData(prev => ({ ...prev, eventType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.filter(e => e.value !== 'all').map((event) => (
                      <SelectItem key={event.value} value={event.value}>
                        {event.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editSeverity">Severity</Label>
                <Select value={logFormData.severity} onValueChange={(value) => setLogFormData(prev => ({ ...prev, severity: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {severities.filter(s => s.value !== 'all').map((severity) => (
                      <SelectItem key={severity.value} value={severity.value}>
                        {severity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                placeholder="Enter event description"
                value={logFormData.description}
                onChange={(e) => setLogFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editIpAddress">IP Address</Label>
                <Input
                  id="editIpAddress"
                  placeholder="192.168.1.1"
                  value={logFormData.ipAddress}
                  onChange={(e) => setLogFormData(prev => ({ ...prev, ipAddress: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editUserAgent">User Agent</Label>
                <Input
                  id="editUserAgent"
                  placeholder="Mozilla/5.0..."
                  value={logFormData.userAgent}
                  onChange={(e) => setLogFormData(prev => ({ ...prev, userAgent: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editMetadata">Metadata (JSON)</Label>
              <Textarea
                id="editMetadata"
                placeholder='{"key": "value"}'
                value={logFormData.metadata}
                onChange={(e) => setLogFormData(prev => ({ ...prev, metadata: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLogModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLog}>
              Update Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Security Policy Modal */}
      <Dialog open={createPolicyModalOpen} onOpenChange={setCreatePolicyModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Security Policy</DialogTitle>
            <DialogDescription>
              Create a new security policy
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="policyName">Policy Name</Label>
                <Input
                  id="policyName"
                  placeholder="Enter policy name"
                  value={policyFormData.name}
                  onChange={(e) => setPolicyFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="policyType">Policy Type</Label>
                <Select value={policyFormData.policyType} onValueChange={(value) => setPolicyFormData(prev => ({ ...prev, policyType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy type" />
                  </SelectTrigger>
                  <SelectContent>
                    {policyTypes.filter(p => p.value !== 'all').map((policy) => (
                      <SelectItem key={policy.value} value={policy.value}>
                        {policy.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="policyDescription">Description</Label>
              <Textarea
                id="policyDescription"
                placeholder="Enter policy description"
                value={policyFormData.description}
                onChange={(e) => setPolicyFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  placeholder="0"
                  value={policyFormData.priority}
                  onChange={(e) => setPolicyFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={policyFormData.isActive}
                  onCheckedChange={(checked) => setPolicyFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="rules">Rules (JSON)</Label>
              <Textarea
                id="rules"
                placeholder='{"rule": "value"}'
                value={policyFormData.rules}
                onChange={(e) => setPolicyFormData(prev => ({ ...prev, rules: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatePolicyModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePolicy}>
              Create Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Security Policy Modal */}
      <Dialog open={editPolicyModalOpen} onOpenChange={setEditPolicyModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Security Policy</DialogTitle>
            <DialogDescription>
              Update security policy
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editPolicyName">Policy Name</Label>
                <Input
                  id="editPolicyName"
                  placeholder="Enter policy name"
                  value={policyFormData.name}
                  onChange={(e) => setPolicyFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="editPolicyType">Policy Type</Label>
                <Select value={policyFormData.policyType} onValueChange={(value) => setPolicyFormData(prev => ({ ...prev, policyType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy type" />
                  </SelectTrigger>
                  <SelectContent>
                    {policyTypes.filter(p => p.value !== 'all').map((policy) => (
                      <SelectItem key={policy.value} value={policy.value}>
                        {policy.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="editPolicyDescription">Description</Label>
              <Textarea
                id="editPolicyDescription"
                placeholder="Enter policy description"
                value={policyFormData.description}
                onChange={(e) => setPolicyFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editPriority">Priority</Label>
                <Input
                  id="editPriority"
                  type="number"
                  placeholder="0"
                  value={policyFormData.priority}
                  onChange={(e) => setPolicyFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editIsActive"
                  checked={policyFormData.isActive}
                  onCheckedChange={(checked) => setPolicyFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="editIsActive">Active</Label>
              </div>
            </div>
            <div>
              <Label htmlFor="editRules">Rules (JSON)</Label>
              <Textarea
                id="editRules"
                placeholder='{"rule": "value"}'
                value={policyFormData.rules}
                onChange={(e) => setPolicyFormData(prev => ({ ...prev, rules: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPolicyModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePolicy}>
              Update Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
