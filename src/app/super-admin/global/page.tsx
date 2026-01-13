'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
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
  Save,
  X
} from 'lucide-react'

interface GlobalSetting {
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

export default function GlobalSettingsPage() {
  const [settings, setSettings] = useState<GlobalSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all-categories')
  const [typeFilter, setTypeFilter] = useState('all-types')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedSetting, setSelectedSetting] = useState<GlobalSetting | null>(null)
  const [editingSetting, setEditingSetting] = useState<Partial<GlobalSetting>>({})
  const { toast } = useToast()

  const categories = [
    'general', 'security', 'email', 'notifications', 'ui', 'api', 
    'database', 'cache', 'logging', 'maintenance', 'features'
  ]

  const types = ['string', 'number', 'boolean', 'json', 'array', 'object']

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
          description: "Failed to fetch global settings",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: "Error",
        description: "Failed to fetch global settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings(currentPage, searchTerm, categoryFilter, typeFilter, sortBy, sortOrder)
  }, [currentPage, searchTerm, categoryFilter, typeFilter, sortBy, sortOrder])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilter = (category: string, type: string) => {
    setCategoryFilter(category)
    setTypeFilter(type)
    setCurrentPage(1)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleCreate = async (settingData: Partial<GlobalSetting>) => {
    try {
      const response = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Global setting created successfully"
        })
        setCreateModalOpen(false)
        fetchSettings()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create setting",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create setting",
        variant: "destructive"
      })
    }
  }

  const handleUpdate = async (id: string, settingData: Partial<GlobalSetting>) => {
    try {
      const response = await fetch(`/api/system-settings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Global setting updated successfully"
        })
        setEditModalOpen(false)
        setEditingSetting({})
        fetchSettings()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update setting",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string) => {
    // Confirmation removed - using toast notifications only
    try {
      const response = await fetch(`/api/super-admin/global/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSettings(prev => prev.filter(s => s.id !== id))
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
      <h1 className="text-2xl font-bold text-gray-900">Global Settings</h1>
      {/* Global settings content would go here */}
    </div>
  )
}