'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

interface Class {
  id: string
  name: string
  grade: string
}

interface StudentFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  classFilter: string
  onClassFilterChange: (value: string) => void
  classes: Class[]
  onClearFilters: () => void
}

export function StudentFilters({
  searchTerm, onSearchChange,
  statusFilter, onStatusFilterChange,
  classFilter, onClassFilterChange,
  classes, onClearFilters,
}: StudentFiltersProps) {
  return (
    <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 shadow-lg backdrop-blur-sm border-0">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-gradient-to-r from-white via-blue-50 to-purple-50 border-0 shadow-sm hover:shadow-md transition-all duration-300"
            />
          </div>

          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="bg-gradient-to-r from-white via-blue-50 to-purple-50 border-0 shadow-sm hover:shadow-md transition-all duration-300">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={classFilter} onValueChange={onClassFilterChange}>
            <SelectTrigger className="bg-gradient-to-r from-white via-blue-50 to-purple-50 border-0 shadow-sm hover:shadow-md transition-all duration-300">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} - {cls.grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={onClearFilters}
            className="bg-gradient-to-r from-white via-gray-50 to-gray-100 border-0 shadow-sm hover:shadow-md transition-all duration-300"
          >
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
