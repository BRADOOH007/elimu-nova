"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Search,
  Plus,
  Settings,
  Save,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Palette,
  Bell,
  Shield,
  Globe,
  Database,
  FileText,
  Mail,
  Users,
  Calendar,
  Clock
} from "lucide-react"

interface SchoolSetting {
  id: string
  key: string
  value: string
  type: string
  category: string
  description?: string
  isEditable: boolean
  createdAt: string
  updatedAt: string
  updatedByUser: {
    firstName: string
    lastName: string
    email: string
  }
}

interface SettingsResponse {
  settings: SchoolSetting[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const settingCategories = [
  { value: 'all', label: 'All Categories', icon: Settings },
  { value: 'general', label: 'General', icon: Globe },
  { value: 'appearance', label: 'Appearance', icon: Palette },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'security', label: 'Security', icon: Shield },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'calendar', label: 'Calendar', icon: Calendar },
  { value: 'data', label: 'Data', icon: Database },
  { value: 'reports', label: 'Reports', icon: FileText }
]

const settingTypes = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'True/False' },
  { value: 'json', label: 'JSON' },
  { value: 'array', label: 'List' }
]

export default function SchoolAdminSettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('settings')
  
  // Settings state
  const [settings, setSettings] = useState<SchoolSetting[]>([])
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsPagination, setSettingsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedSetting, setSelectedSetting] = useState<SchoolSetting | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    type: 'string',
    category: 'general',
    description: '',
    isEditable: true
  })

  // Fetch settings data
  const fetchSettings = async (page = 1) => {
    try {
      setSettingsLoading(true)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: settingsPagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/school-admin/settings?${params}`)
      if (response.ok) {
        const data: SettingsResponse = await response.json()
        setSettings(data.settings)
        setSettingsPagination(data.pagination)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch settings data",
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch settings data",
      })
    } finally {
      setSettingsLoading(false)
    }
  }

  // Load data
  useEffect(() => {
    fetchSettings()
  }, [searchQuery, categoryFilter, sortBy, sortOrder])

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setSettingsPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setCategoryFilter(filter)
    setSettingsPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle sort change
  const handleSortChange = (field: string) => {
    setSortBy(field)
  }

  // Handle sort order change
  const handleSortOrderChange = (order: string) => {
    setSortOrder(order)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setSettingsPagination(prev => ({ ...prev, page }))
    fetchSettings(page)
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchSettings(settingsPagination.page)
  }

  // Handle create setting
  const handleCreateSetting = async () => {
    try {
      const response = await fetch('/api/school-admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Setting created successfully",
        })
        setCreateModalOpen(false)
        setFormData({
          key: '',
          value: '',
          type: 'string',
          category: 'general',
          description: '',
          isEditable: true
        })
        fetchSettings()
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to create setting",
        })
      }
    } catch (error) {
      console.error('Error creating setting:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create setting",
      })
    }
  }

  // Handle edit setting
  const handleEditSetting = async () => {
    if (!selectedSetting) return

    try {
      const response = await fetch(`/api/school-admin/settings/${selectedSetting.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Setting updated successfully",
        })
        setEditModalOpen(false)
        setSelectedSetting(null)
        setFormData({
          key: '',
          value: '',
          type: 'string',
          category: 'general',
          description: '',
          isEditable: true
        })
        fetchSettings()
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to update setting",
        })
      }
    } catch (error) {
      console.error('Error updating setting:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update setting",
      })
    }
  }

  // Handle delete setting
  const handleDeleteSetting = async (setting: SchoolSetting) => {
    if (!confirm('Are you sure you want to delete this setting?')) return

    try {
      const response = await fetch(`/api/school-admin/settings/${setting.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Setting deleted successfully",
        })
        fetchSettings()
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to delete setting",
        })
      }
    } catch (error) {
      console.error('Error deleting setting:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete setting",
      })
    }
  }

  // Open edit modal
  const openEditModal = (setting: SchoolSetting) => {
    setSelectedSetting(setting)
    setFormData({
      key: setting.key,
      value: setting.value,
      type: setting.type,
      category: setting.category,
      description: setting.description || '',
      isEditable: setting.isEditable
    })
    setEditModalOpen(true)
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const categoryInfo = settingCategories.find(cat => cat.value === category)
    return categoryInfo ? categoryInfo.icon : Settings
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      general: 'bg-blue-100 text-blue-800',
      appearance: 'bg-purple-100 text-purple-800',
      notifications: 'bg-yellow-100 text-yellow-800',
      security: 'bg-red-100 text-red-800',
      email: 'bg-green-100 text-green-800',
      users: 'bg-indigo-100 text-indigo-800',
      calendar: 'bg-pink-100 text-pink-800',
      data: 'bg-gray-100 text-gray-800',
      reports: 'bg-orange-100 text-orange-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  // Format value for display
  const formatValue = (value: string, type: string) => {
    try {
      if (type === 'json') {
        return JSON.stringify(JSON.parse(value), null, 2)
      }
      if (type === 'boolean') {
        return value === 'true' ? 'Yes' : 'No'
      }
      return value
    } catch {
      return value
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
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
          <h1 className="text-3xl font-bold tracking-tight">School Settings</h1>
          <p className="text-muted-foreground">
            Manage your school's configuration and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={settingsLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${settingsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setCreateModalOpen(true)}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Setting
          </Button>
        </div>
      </div>

      {/* Settings Tab */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab Content */}
        <TabsContent value="settings" className="space-y-6">
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
                      placeholder="Search settings..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {settingCategories.map((category) => {
                      const IconComponent = category.icon
                      return (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center space-x-2">
                            <IconComponent className="w-4 h-4" />
                            <span>{category.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="updatedAt">Updated Date</SelectItem>
                    <SelectItem value="key">Key</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={handleSortOrderChange}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Settings Table */}
          <Card>
            <CardHeader>
              <CardTitle>School Settings</CardTitle>
              <CardDescription>
                Configure your school's settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : settings.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No settings found</h3>
                  <p className="text-gray-500">
                    {searchQuery ? 'Try adjusting your search criteria' : 'No settings have been configured yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {settings.map((setting) => {
                    const CategoryIcon = getCategoryIcon(setting.category)
                    return (
                      <div
                        key={setting.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <CategoryIcon className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {setting.key}
                              </h3>
                              <Badge className={getCategoryColor(setting.category)}>
                                {setting.category}
                              </Badge>
                              {!setting.isEditable && (
                                <Badge variant="outline" className="text-gray-500">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Read-only
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {setting.description || 'No description'}
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-400">
                                Type: {settingTypes.find(t => t.value === setting.type)?.label || setting.type}
                              </span>
                              <span className="text-xs text-gray-400">
                                Updated: {formatDate(setting.updatedAt)}
                              </span>
                              <span className="text-xs text-gray-400">
                                by {setting.updatedByUser.firstName} {setting.updatedByUser.lastName}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // View setting details
                              setSelectedSetting(setting)
                              setFormData({
                                key: setting.key,
                                value: setting.value,
                                type: setting.type,
                                category: setting.category,
                                description: setting.description || '',
                                isEditable: setting.isEditable
                              })
                              setEditModalOpen(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {setting.isEditable && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(setting)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSetting(setting)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pagination */}
              {settingsPagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {((settingsPagination.page - 1) * settingsPagination.limit) + 1} to{' '}
                    {Math.min(settingsPagination.page * settingsPagination.limit, settingsPagination.total)} of{' '}
                    {settingsPagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(settingsPagination.page - 1)}
                      disabled={settingsPagination.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-500">
                      Page {settingsPagination.page} of {settingsPagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(settingsPagination.page + 1)}
                      disabled={settingsPagination.page === settingsPagination.pages}
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

      {/* Create Setting Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create New Setting</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Key</label>
                <Input
                  value={formData.key}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="setting_key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <Input
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Setting value"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {settingTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {settingCategories.slice(1).map((category) => {
                      const IconComponent = category.icon
                      return (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center space-x-2">
                            <IconComponent className="w-4 h-4" />
                            <span>{category.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Setting description"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSetting}>
                <Save className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Setting Modal */}
      {editModalOpen && selectedSetting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Edit Setting</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Key</label>
                <Input
                  value={formData.key}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <Input
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  disabled={!selectedSetting.isEditable}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  disabled={!selectedSetting.isEditable}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {settingTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  disabled={!selectedSetting.isEditable}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {settingCategories.slice(1).map((category) => {
                      const IconComponent = category.icon
                      return (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center space-x-2">
                            <IconComponent className="w-4 h-4" />
                            <span>{category.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  disabled={!selectedSetting.isEditable}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setEditModalOpen(false)
                  setSelectedSetting(null)
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditSetting}
                disabled={!selectedSetting.isEditable}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
