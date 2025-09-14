'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  TrendingUp,
  AlertCircle,
  Save,
  Send
} from 'lucide-react'

interface Grade {
  id: string
  assignmentId: string
  teamId: string
  submissionId: string
  averageInvestment: number
  grade: 'high' | 'median' | 'low' | 'incomplete'
  percentage: number
  totalInvestments: number
  status: 'draft' | 'pending_review' | 'approved' | 'published'
  adminNotes?: string
  reviewedBy?: string
  reviewedAt?: string
  publishedAt?: string
  originalGrade?: string
  originalPercentage?: number
  manualOverride: boolean
  team: {
    id: string
    name: string
    members: string[]
  }
  assignment?: {
    id: string
    title: string
  }
}

interface AdminGradeReviewProps {
  assignmentId: string
  onGradesUpdated?: () => void
}

export function AdminGradeReview({ assignmentId, onGradesUpdated }: AdminGradeReviewProps) {
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<Partial<Grade>>({})
  const [saving, setSaving] = useState(false)
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])

  useEffect(() => {
    fetchGrades()
  }, [assignmentId])

  const fetchGrades = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/grades?assignmentId=${assignmentId}`)
      const data = await response.json()
      
      if (data.success) {
        setGrades(data.data)
      } else {
        setError(data.error || 'Failed to fetch grades')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch grades')
    } finally {
      setLoading(false)
    }
  }

  const handleEditGrade = (grade: Grade) => {
    setSelectedGrade(grade)
    setEditingGrade({
      id: grade.id,
      grade: grade.grade,
      percentage: grade.percentage,
      adminNotes: grade.adminNotes || '',
      status: grade.status,
      manualOverride: grade.manualOverride
    })
    setIsEditModalOpen(true)
  }

  const handleSaveGrade = async () => {
    if (!selectedGrade || !editingGrade.id) return

    try {
      setSaving(true)
      const response = await fetch('/api/admin/grades', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingGrade.id,
          grade: editingGrade.grade,
          percentage: editingGrade.percentage,
          adminNotes: editingGrade.adminNotes,
          status: editingGrade.status,
          manualOverride: editingGrade.manualOverride
        })
      })

      const data = await response.json()
      if (data.success) {
        await fetchGrades()
        setIsEditModalOpen(false)
        setSelectedGrade(null)
        setEditingGrade({})
        onGradesUpdated?.()
      } else {
        setError(data.error || 'Failed to update grade')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update grade')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (!action || selectedGrades.length === 0) {
      console.log('❌ Bulk action failed: No action or no selected grades')
      return
    }

    console.log('🔄 Performing bulk action:', { action, selectedGrades })

    try {
      setSaving(true)
      const response = await fetch('/api/admin/grades/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradeIds: selectedGrades,
          action: action
        })
      })

      const data = await response.json()
      if (data.success) {
        await fetchGrades()
        setSelectedGrades([])
        onGradesUpdated?.()
      } else {
        setError(data.error || 'Failed to perform bulk action')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to perform bulk action')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock, text: 'Draft' },
      published: { color: 'bg-blue-100 text-blue-800', icon: Send, text: 'Published' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  const getGradeColor = (grade: string) => {
    const gradeConfig = {
      high: 'text-green-600 bg-green-50',
      median: 'text-yellow-600 bg-yellow-50',
      low: 'text-orange-600 bg-orange-50',
      incomplete: 'text-red-600 bg-red-50'
    }
    return gradeConfig[grade as keyof typeof gradeConfig] || 'text-gray-600 bg-gray-50'
  }

  const stats = {
    total: grades.length,
    draft: grades.filter(g => g.status === 'draft').length,
    published: grades.filter(g => g.status === 'published').length,
    manual: grades.filter(g => g.manualOverride).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading grades...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Grade Review & Management</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Review, edit, and manage grades before publishing to students
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (selectedGrades.length === grades.length) {
                setSelectedGrades([])
              } else {
                setSelectedGrades(grades.map(g => g.id))
              }
            }}
            variant="outline"
            disabled={saving}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {selectedGrades.length === grades.length ? 'Deselect All' : 'Select All'}
          </Button>
          <Button
            onClick={() => handleBulkAction('publish')}
            disabled={selectedGrades.length === 0 || saving}
          >
            <Send className="h-4 w-4 mr-2" />
            Publish Selected ({selectedGrades.length})
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Grades</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <div className="text-sm text-gray-600">Draft</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.published}</div>
            <div className="text-sm text-gray-600">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.manual}</div>
            <div className="text-sm text-gray-600">Manual Override</div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Grades List */}
      <div className="space-y-4">
        {grades.map((grade) => (
          <Card key={grade.id} className={grade.manualOverride ? 'ring-2 ring-purple-200' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{grade.team.name}</CardTitle>
                  <CardDescription>
                    {grade.assignment?.title} • {grade.team.members.length} members
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {grade.manualOverride && (
                    <Badge variant="outline" className="text-purple-600 border-purple-200">
                      Manual Override
                    </Badge>
                  )}
                  {getStatusBadge(grade.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label className="text-sm text-gray-600">Grade</Label>
                  <div className={`text-lg font-semibold ${getGradeColor(grade.grade)}`}>
                    {grade.grade.toUpperCase()}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Percentage</Label>
                  <div className="text-lg font-semibold">{grade.percentage}%</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Avg Investment</Label>
                  <div className="text-lg font-semibold">{grade.averageInvestment?.toFixed(2) || 0}</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Total Investments</Label>
                  <div className="text-lg font-semibold">{grade.totalInvestments}</div>
                </div>
              </div>
              
              {grade.adminNotes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm text-gray-600">Admin Notes</Label>
                  <p className="text-sm">{grade.adminNotes}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedGrades.includes(grade.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedGrades([...selectedGrades, grade.id])
                    } else {
                      setSelectedGrades(selectedGrades.filter(id => id !== grade.id))
                    }
                  }}
                  className="rounded"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditGrade(grade)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Grade
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Grade Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
            <DialogDescription>
              Review and modify the grade for {selectedGrade?.team.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Select
                  value={editingGrade.grade}
                  onValueChange={(value) => setEditingGrade({ ...editingGrade, grade: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="median">Median</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="percentage">Percentage</Label>
                <Input
                  id="percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={editingGrade.percentage || ''}
                  onChange={(e) => setEditingGrade({ ...editingGrade, percentage: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={editingGrade.status}
                onValueChange={(value) => setEditingGrade({ ...editingGrade, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Textarea
                id="adminNotes"
                placeholder="Add notes about this grade..."
                value={editingGrade.adminNotes || ''}
                onChange={(e) => setEditingGrade({ ...editingGrade, adminNotes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="manualOverride"
                checked={editingGrade.manualOverride || false}
                onChange={(e) => setEditingGrade({ ...editingGrade, manualOverride: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="manualOverride">Manual Override</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveGrade}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
