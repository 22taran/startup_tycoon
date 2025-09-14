'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Calendar } from 'lucide-react'
import type { Assignment } from '@/types'

interface EditEvaluationDatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: Assignment | null
  onEvaluationDatesUpdated: () => void
}

export function EditEvaluationDatesModal({ 
  open, 
  onOpenChange, 
  assignment, 
  onEvaluationDatesUpdated 
}: EditEvaluationDatesModalProps) {
  const [formData, setFormData] = useState({
    evaluationStartDate: '',
    evaluationDueDate: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Update form data when assignment changes
  useEffect(() => {
    if (assignment) {
      setFormData({
        evaluationStartDate: assignment.evaluationStartDate 
          ? new Date(assignment.evaluationStartDate).toISOString().slice(0, 16) 
          : '',
        evaluationDueDate: assignment.evaluationDueDate 
          ? new Date(assignment.evaluationDueDate).toISOString().slice(0, 16) 
          : ''
      })
    }
  }, [assignment])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignment) return

    setLoading(true)
    setError('')

    try {
      // Validate dates
      if (!formData.evaluationStartDate || !formData.evaluationDueDate) {
        setError('Both evaluation start date and due date are required')
        setLoading(false)
        return
      }

      const evaluationStartDate = new Date(formData.evaluationStartDate)
      const evaluationDueDate = new Date(formData.evaluationDueDate)
      const assignmentDueDate = new Date(assignment.dueDate)

      if (evaluationStartDate >= evaluationDueDate) {
        setError('Evaluation start date must be before due date')
        setLoading(false)
        return
      }

      if (evaluationStartDate < assignmentDueDate) {
        setError('Evaluation start date must be on or after assignment due date')
        setLoading(false)
        return
      }

      console.log('🔄 Updating evaluation dates:', {
        assignmentId: assignment.id,
        evaluationStartDate: formData.evaluationStartDate,
        evaluationDueDate: formData.evaluationDueDate
      })

      const response = await fetch('/api/assignments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: assignment.id,
          title: assignment.title, // Keep existing values
          description: assignment.description,
          startDate: assignment.startDate,
          dueDate: assignment.dueDate,
          documentUrl: assignment.documentUrl,
          evaluationStartDate: formData.evaluationStartDate,
          evaluationDueDate: formData.evaluationDueDate
        }),
      })

      const data = await response.json()
      console.log('📝 Update response:', data)

      if (data.success) {
        console.log('✅ Evaluation dates updated successfully')
        onOpenChange(false)
        onEvaluationDatesUpdated()
      } else {
        console.error('❌ Update failed:', data.error)
        setError(data.error || 'Failed to update evaluation dates')
      }
    } catch (error) {
      console.error('Error updating evaluation dates:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!assignment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Edit Evaluation Dates
          </DialogTitle>
          <DialogDescription>
            Update the evaluation period for "{assignment.title}"
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="evaluationStartDate">Evaluation Start Date & Time</Label>
              <Input
                id="evaluationStartDate"
                name="evaluationStartDate"
                type="datetime-local"
                value={formData.evaluationStartDate}
                onChange={handleChange}
                required
              />
              <p className="text-sm text-gray-500">
                When students can start evaluating submissions
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="evaluationDueDate">Evaluation Due Date & Time</Label>
              <Input
                id="evaluationDueDate"
                name="evaluationDueDate"
                type="datetime-local"
                value={formData.evaluationDueDate}
                onChange={handleChange}
                required
              />
              <p className="text-sm text-gray-500">
                When evaluation period ends
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Assignment Due Date:</strong> {new Date(assignment.dueDate).toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Evaluation must start on or after this date
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Evaluation Dates'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
