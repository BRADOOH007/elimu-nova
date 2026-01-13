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
    // Confirmation removed - using toast notifications only
    try {
      const response = await fetch(`/api/school-admin/settings/${setting.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSettings(prev => prev.filter(s => s.id !== setting.id))
        toast.success('Setting deleted successfully')
      } else {
        toast.error('Failed to delete setting')
      }
    } catch (error) {
      console.error('Error deleting setting:', error)
      toast.error('Failed to delete setting')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      {/* Settings content would go here */}
    </div>
  )
}