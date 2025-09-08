'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'

interface SetEvaluationDeadlineModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeadlineSet: (startDate: Date, dueDate: Date, evaluationsPerStudent: number) => void
  assignmentTitle: string
  assignmentDueDate: Date | string
}

export function SetEvaluationDeadlineModal({
  open,
  onOpenChange,
  onDeadlineSet,
  assignmentTitle,
  assignmentDueDate
}: SetEvaluationDeadlineModalProps) {
  const [formData, setFormData] = useState({
    evaluationStartDate: '',
    evaluationDueDate: '',
    evaluationsPerStudent: 5
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Convert assignmentDueDate to Date object if it's a string
  const dueDate = typeof assignmentDueDate === 'string' ? new Date(assignmentDueDate) : assignmentDueDate

  // Calculate suggested dates (3 days after assignment due date for start, 5 days for end)
  const suggestedStartDate = new Date(dueDate)
  suggestedStartDate.setDate(suggestedStartDate.getDate() + 3)
  
  const suggestedDueDate = new Date(dueDate)
  suggestedDueDate.setDate(suggestedDueDate.getDate() + 5)

  // Format dates for datetime-local input
  const formatForInput = (date: Date) => {
    return date.toISOString().slice(0, 16)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) || 5 : e.target.value
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }))
    setError('')
  }

  const handleSubmit = async () => {
    if (!formData.evaluationStartDate || !formData.evaluationDueDate) {
      setError('Please select both start and due dates for evaluation')
      return
    }

    if (formData.evaluationsPerStudent < 1 || formData.evaluationsPerStudent > 10) {
      setError('Evaluations per student must be between 1 and 10')
      return
    }

    const evaluationStartDate = new Date(formData.evaluationStartDate)
    const evaluationDueDate = new Date(formData.evaluationDueDate)

    if (evaluationStartDate >= evaluationDueDate) {
      setError('Evaluation start date must be before due date')
      return
    }

    if (evaluationStartDate < dueDate) {
      setError('Evaluation start date must be on or after assignment due date')
      return
    }
    
    // If same day, ensure it's after the due time
    if (evaluationStartDate.getTime() <= dueDate.getTime()) {
      setError('Evaluation start time must be after assignment due time')
      return
    }

    setIsSubmitting(true)
    try {
      onDeadlineSet(evaluationStartDate, evaluationDueDate, formData.evaluationsPerStudent)
      onOpenChange(false)
    } catch (error) {
      console.error('Error setting evaluation deadline:', error)
      setError('Failed to set evaluation deadline')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      evaluationStartDate: '',
      evaluationDueDate: '',
      evaluationsPerStudent: 5
    })
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Set Evaluation Deadline</DialogTitle>
          <DialogDescription>
            Set the evaluation period for <strong>{assignmentTitle}</strong>.
            Students will evaluate their assigned projects during this time.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label>Assignment Due Date</Label>
            <Input
              value={dueDate.toLocaleString()}
              disabled
              className="bg-gray-100 dark:bg-gray-800"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="evaluationStartDate">Evaluation Start Date & Time *</Label>
            <Input
              id="evaluationStartDate"
              name="evaluationStartDate"
              type="datetime-local"
              value={formData.evaluationStartDate}
              onChange={handleChange}
              min={formatForInput(dueDate)} // Can be same day as assignment due date
              required
            />
            <p className="text-xs text-gray-500">
              Suggested: {suggestedStartDate.toLocaleString()} (3 days after assignment due)
              <br />
              Can be same day as assignment due date, but must be after due time
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="evaluationDueDate">Evaluation Due Date & Time *</Label>
            <Input
              id="evaluationDueDate"
              name="evaluationDueDate"
              type="datetime-local"
              value={formData.evaluationDueDate}
              onChange={handleChange}
              min={formData.evaluationStartDate || formatForInput(new Date(dueDate.getTime() + 24 * 60 * 60 * 1000))}
              required
            />
            <p className="text-xs text-gray-500">
              Suggested: {suggestedDueDate.toLocaleString()} (5 days after assignment due)
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="evaluationsPerStudent">Teams per Student *</Label>
            <Input
              id="evaluationsPerStudent"
              name="evaluationsPerStudent"
              type="number"
              min="1"
              max="10"
              value={formData.evaluationsPerStudent}
              onChange={handleChange}
              required
            />
            <p className="text-xs text-gray-500">
              Number of teams each student will evaluate (1-10). For 2 teams, use 1. For 40+ teams, use 5-10.
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Distribution Requirements
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• At least 1 student must be registered</li>
              <li>• At least 1 team must have submitted work</li>
              <li>• Each student will be assigned {formData.evaluationsPerStudent} random projects to evaluate</li>
              <li>• Each student gets 100 tokens to invest (10-50 per project)</li>
              <li>• Students cannot evaluate their own team's projects</li>
              <li>• No late evaluations allowed</li>
            </ul>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !formData.evaluationStartDate || !formData.evaluationDueDate}
          >
            {isSubmitting ? 'Setting...' : 'Set Deadline & Distribute'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
