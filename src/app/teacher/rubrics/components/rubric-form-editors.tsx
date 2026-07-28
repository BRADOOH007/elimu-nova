'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle, Edit3, Plus, Trash2 } from 'lucide-react'

interface PerformanceLevel {
  id: string
  name: string
  description: string
  score: number
  color: string
}

interface Criterion {
  id: string
  title: string
  description: string
  weight: number
  maxScore: number
}

interface PerformanceLevelsEditorProps {
  levels: PerformanceLevel[]
  onUpdate: (id: string, updates: Partial<PerformanceLevel>) => void
  onAdd: () => void
  onDelete: (id: string) => void
}

export function PerformanceLevelsEditor({ levels, onUpdate, onAdd, onDelete }: PerformanceLevelsEditorProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Performance Levels
            </CardTitle>
            <CardDescription>Define the scoring levels for your rubric</CardDescription>
          </div>
          <Button onClick={onAdd} size="sm" className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Level
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {levels.map((level) => (
          <div key={level.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <Label>Level Name</Label>
              <Input
                value={level.name}
                onChange={(e) => onUpdate(level.id, { name: e.target.value })}
                placeholder="e.g., Excellent"
                className="bg-white border-0 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Score</Label>
              <Input
                type="number"
                value={level.score}
                onChange={(e) => onUpdate(level.id, { score: parseInt(e.target.value) || 0 })}
                className="bg-white border-0 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={level.description}
                onChange={(e) => onUpdate(level.id, { description: e.target.value })}
                placeholder="e.g., Exceeds expectations"
                className="bg-white border-0 shadow-sm"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => onDelete(level.id)}
                variant="outline"
                size="sm"
                disabled={levels.length <= 2}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

interface CriteriaListProps {
  criteria: Criterion[]
  onUpdate: (id: string, updates: Partial<Criterion>) => void
  onDelete: (id: string) => void
  onAdd: () => void
  onEdit: (criterion: Criterion) => void
}

export function CriteriaList({ criteria, onUpdate, onDelete, onAdd, onEdit }: CriteriaListProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-purple-600" />
              Assessment Criteria
            </CardTitle>
            <CardDescription>Define what will be assessed in your rubric</CardDescription>
          </div>
          <Button onClick={onAdd} size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Criterion
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {criteria.map((criterion, index) => (
          <div key={criterion.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Criterion {index + 1}</h4>
              <div className="flex gap-2">
                <Button onClick={() => onEdit(criterion)} variant="outline" size="sm">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={() => onDelete(criterion.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={criterion.title}
                  onChange={(e) => onUpdate(criterion.id, { title: e.target.value })}
                  placeholder="e.g., Content Quality"
                  className="bg-white border-0 shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Weight</Label>
                <Input
                  type="number"
                  value={criterion.weight}
                  onChange={(e) => onUpdate(criterion.id, { weight: parseInt(e.target.value) || 1 })}
                  className="bg-white border-0 shadow-sm"
                />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label>Description</Label>
              <Textarea
                value={criterion.description}
                onChange={(e) => onUpdate(criterion.id, { description: e.target.value })}
                placeholder="Describe what this criterion assesses..."
                rows={2}
                className="bg-white border-0 shadow-sm"
              />
            </div>
          </div>
        ))}
        {criteria.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Edit3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No criteria added yet. Click "Add Criterion" to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface CriterionEditDialogProps {
  criterion: Criterion | null
  onUpdate: (id: string, updates: Partial<Criterion>) => void
  onSave: (criterion: Criterion) => void
  onCancel: () => void
}

export function CriterionEditDialog({ criterion, onUpdate, onSave, onCancel }: CriterionEditDialogProps) {
  return (
    <Dialog open={!!criterion} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Criterion</DialogTitle>
          <DialogDescription>
            Update the details for this assessment criterion
          </DialogDescription>
        </DialogHeader>

        {criterion && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={criterion.title}
                onChange={(e) => onUpdate(criterion.id, { title: e.target.value })}
                placeholder="e.g., Content Quality"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={criterion.description}
                onChange={(e) => onUpdate(criterion.id, { description: e.target.value })}
                placeholder="Describe what this criterion assesses..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Weight</Label>
                <Input
                  type="number"
                  value={criterion.weight}
                  onChange={(e) => onUpdate(criterion.id, { weight: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Score</Label>
                <Input
                  type="number"
                  value={criterion.maxScore}
                  onChange={(e) => onUpdate(criterion.id, { maxScore: parseInt(e.target.value) || 4 })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button onClick={() => onSave(criterion)}>Save Changes</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
