'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  School, 
  Users, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Eye,
  Loader2,
  X
} from 'lucide-react'

interface SearchResult {
  id: string
  name: string
  email?: string
  address?: string
  phone?: string
  role?: string
  isActive?: boolean
  adminCount?: number
  teacherCount?: number
  studentCount?: number
  createdAt: string
}

interface SearchResults {
  schools: SearchResult[]
  users: SearchResult[]
  packages: SearchResult[]
  total: number
}

interface SearchResultsModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

export function SearchResultsModal({ isOpen, onClose, initialQuery = '' }: SearchResultsModalProps) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResults>({
    schools: [],
    users: [],
    packages: [],
    total: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && initialQuery) {
      setQuery(initialQuery)
      handleSearch(initialQuery)
    }
  }, [isOpen, initialQuery])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults({ schools: [], users: [], packages: [], total: 0 })
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`)
      const data = await response.json()

      if (response.ok) {
        setResults(data.results)
      } else {
        setError(data.error || 'Search failed')
      }
    } catch (error) {
      console.error('Search error:', error)
      setError('Failed to search. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-800'
      case 'SCHOOL_ADMIN': return 'bg-blue-100 text-blue-800'
      case 'TEACHER': return 'bg-green-100 text-green-800'
      case 'STUDENT': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin'
      case 'SCHOOL_ADMIN': return 'School Admin'
      case 'TEACHER': return 'Teacher'
      case 'STUDENT': return 'Student'
      default: return role
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search Results</span>
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4 mt-1">
          {/* Search Input */}
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search schools, users, and more..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-4"
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
              {error}
            </div>
          )}

          {/* Results */}
          <div className="space-y-4">
            {!isLoading && results.total === 0 && query && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No results found for "{query}"</p>
                <p className="text-sm">Try different keywords or check your spelling</p>
              </div>
            )}

            {/* Schools Results */}
            {results.schools.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <School className="w-5 h-5 text-blue-600" />
                  <span>Schools ({results.schools.length})</span>
                </h3>
                <div className="space-y-3">
                  {results.schools.map((school) => (
                    <div key={school.id} className="bg-gradient-to-r from-white to-blue-50 rounded-lg p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <School className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{school.name}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                {school.email && (
                                  <div className="flex items-center space-x-1">
                                    <Mail className="w-3 h-3" />
                                    <span>{school.email}</span>
                                  </div>
                                )}
                                {school.phone && (
                                  <div className="flex items-center space-x-1">
                                    <Phone className="w-3 h-3" />
                                    <span>{school.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {school.address && (
                            <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                              <MapPin className="w-3 h-3" />
                              <span>{school.address}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{school.adminCount} admins</span>
                            <span>{school.teacherCount} teachers</span>
                            <span>{school.studentCount} students</span>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>Joined {formatDate(school.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            school.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {school.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Results */}
            {results.users.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span>Users ({results.users.length})</span>
                </h3>
                <div className="space-y-3">
                  {results.users.map((user) => (
                    <div key={user.id} className="bg-gradient-to-r from-white to-green-50 rounded-lg p-4 border border-green-100 hover:shadow-md transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{user.name}</h4>
                              {user.email && (
                                <div className="flex items-center space-x-1 text-sm text-gray-600">
                                  <Mail className="w-3 h-3" />
                                  <span>{user.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {user.role && (
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                                {getRoleDisplayName(user.role)}
                              </span>
                            )}
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>Joined {formatDate(user.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results Message */}
            {!isLoading && results.total === 0 && !query && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Start typing to search for schools, users, and more</p>
              </div>
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
