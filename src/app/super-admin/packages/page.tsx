'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Search,
  Filter,
  Plus,
  Package,
  Users,
  DollarSign,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Settings,
  Star,
  CheckCircle,
  XCircle
} from 'lucide-react'
import CreatePackageModal from '@/components/modals/create-package-modal'
import PackageDetailsModal from '@/components/modals/package-details-modal'

interface Package {
  id: string
  name: string
  description: string
  price: number
  duration: number
  maxTeachers: number
  maxStudents: number
  features: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  subscriptions: Array<{ id: string }>
  _count: {
    subscriptions: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const { toast } = useToast()

  const fetchPackages = async (page = 1, search = '', sort = 'createdAt', order = 'desc') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        sortBy: sort,
        sortOrder: order
      })

      const response = await fetch(`/api/packages?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPackages(data.packages)
        setPagination(data.pagination)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch packages",
        })
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch packages",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPackages(currentPage, searchTerm, sortBy, sortOrder)
  }, [currentPage, searchTerm, sortBy, sortOrder])

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

  const handlePackageClick = (pkg: Package) => {
    setSelectedPackage(pkg)
    setDetailsModalOpen(true)
  }

  const handlePackageCreated = (newPackage: Package) => {
    setPackages(prev => [newPackage, ...prev])
    setCreateModalOpen(false)
    toast({
      title: "Success",
      description: "Package created successfully",
    })
  }

  const handlePackageUpdated = (updatedPackage: Package) => {
    setPackages(prev => prev.map(pkg => 
      pkg.id === updatedPackage.id ? updatedPackage : pkg
    ))
    setDetailsModalOpen(false)
    toast({
      title: "Success",
      description: "Package updated successfully",
    })
  }

  const handlePackageDeleted = (packageId: string) => {
    setPackages(prev => prev.filter(pkg => pkg.id !== packageId))
    setDetailsModalOpen(false)
    toast({
      title: "Success",
      description: "Package deleted successfully",
    })
  }

  const handleStatusToggle = async (packageId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/packages/${packageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus
        }),
      })

      if (response.ok) {
        const updatedPackage = await response.json()
        setPackages(prev => prev.map(pkg => 
          pkg.id === packageId ? updatedPackage : pkg
        ))
        toast({
          title: "Success",
          description: `Package ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        })
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Failed to update package status",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update package status",
      })
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? CheckCircle : XCircle
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="edugenius-text-gradient">Package Management</span>
          </h1>
          <p className="text-gray-600">Manage subscription packages and pricing plans</p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="edugenius-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Package
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 edugenius-card-gradient">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search packages..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 edugenius-glass"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value) => {
                setSortBy(value)
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-40 edugenius-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="maxTeachers">Max Teachers</SelectItem>
                  <SelectItem value="maxStudents">Max Students</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="edugenius-glass"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPackages(currentPage, searchTerm, sortBy, sortOrder)}
                className="edugenius-glass"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Packages Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-500">Loading packages...</span>
        </div>
      ) : packages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const StatusIcon = getStatusIcon(pkg.isActive)
            return (
              <Card key={pkg.id} className="group hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white via-blue-50 to-purple-50 border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1 flex items-center">
                        <Package className="w-5 h-5 mr-2 text-blue-600" />
                        {pkg.name}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {pkg.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={pkg.isActive}
                        onCheckedChange={() => handleStatusToggle(pkg.id, pkg.isActive)}
                        onClick={(e) => e.stopPropagation()}
                        className="data-[state=checked]:bg-green-600"
                      />
                      <Badge className={getStatusColor(pkg.isActive)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price and Duration */}
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">${pkg.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">per {pkg.duration} days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-blue-600">{pkg._count.subscriptions}</p>
                      <p className="text-xs text-gray-500">Subscriptions</p>
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-lg font-semibold text-purple-600">{pkg.maxTeachers}</p>
                      <p className="text-xs text-gray-500">Max Teachers</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-orange-600">{pkg.maxStudents}</p>
                      <p className="text-xs text-gray-500">Max Students</p>
                    </div>
                  </div>

                  {/* Features Preview */}
                  {pkg.features.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Key Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {pkg.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {pkg.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{pkg.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-gray-500">
                      Created {new Date(pkg.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePackageClick(pkg)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation()
                          // Confirmation removed - using toast notifications only
                          try {
                            const response = await fetch(`/api/super-admin/packages/${pkg.id}`, {
                              method: 'DELETE',
                            })
                            if (response.ok) {
                              handlePackageDeleted(pkg.id)
                            } else {
                              const error = await response.json()
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: error.error || "Failed to delete package",
                              })
                            }
                          } catch (error) {
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: "Failed to delete package",
                            })
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:text-red-700"
                        title="Delete Package"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-0 edugenius-card-gradient">
          <CardContent className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No packages found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No packages match your search criteria.' : 'Get started by creating your first package.'}
            </p>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="edugenius-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Package
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Card className="border-0 edugenius-card-gradient">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} packages
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="edugenius-glass"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {pagination.pages}
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
      <CreatePackageModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onPackageCreated={handlePackageCreated}
      />

      {selectedPackage && (
        <PackageDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false)
            setSelectedPackage(null)
          }}
          packageId={selectedPackage.id}
          onPackageUpdated={handlePackageUpdated}
          onPackageDeleted={handlePackageDeleted}
        />
      )}
    </div>
  )
}
