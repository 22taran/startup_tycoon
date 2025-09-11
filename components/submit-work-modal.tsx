'use client'

import React, { useState } from 'react'
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
import { Submission } from '@/types'

interface SubmitWorkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignmentId: string
  assignmentTitle: string
  teamId: string
  existingSubmission?: Submission | null
  onSubmissionAdded: () => void
}

export function SubmitWorkModal({ 
  open, 
  onOpenChange, 
  assignmentId, 
  assignmentTitle, 
  teamId,
  existingSubmission,
  onSubmissionAdded 
}: SubmitWorkModalProps) {
  const [formData, setFormData] = useState({
    primaryLink: '',
    backupLink: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Update form data when existing submission is provided
  React.useEffect(() => {
    if (existingSubmission) {
      setFormData({
        primaryLink: existingSubmission.primaryLink || '',
        backupLink: existingSubmission.backupLink || ''
      })
    } else {
      setFormData({
        primaryLink: '',
        backupLink: ''
      })
    }
  }, [existingSubmission])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!teamId) {
      setError('You must be part of a team to submit work')
      setLoading(false)
      return
    }

    try {
      const isEditing = !!existingSubmission
      const url = isEditing ? `/api/submissions/${existingSubmission.id}` : '/api/submissions'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId,
          teamId,
          title: assignmentTitle,
          primaryLink: formData.primaryLink,
          backupLink: formData.backupLink,
          status: 'submitted'
        }),
      })

      const data = await response.json()

      if (data.success) {
        console.log(`✅ ${isEditing ? 'Submission updated' : 'Submission created'}, calling onSubmissionAdded...`)
        // Reset form
        setFormData({
          primaryLink: '',
          backupLink: ''
        })
        onOpenChange(false)
        onSubmissionAdded()
        console.log('✅ onSubmissionAdded called')
      } else {
        setError(data.error || `Failed to ${isEditing ? 'update' : 'submit'} work`)
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingSubmission ? 'Edit Submission' : 'Submit Work'}
          </DialogTitle>
          <DialogDescription>
            {existingSubmission ? 'Update your submitted work for:' : 'Submit your work for:'} {assignmentTitle}
          </DialogDescription>
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Team ID:</strong> {teamId}
            </p>
            {existingSubmission && (
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                <strong>Status:</strong> {existingSubmission.status === 'submitted' ? 
                  (existingSubmission.submittedAt ? 
                    'Submitted on ' + new Date(existingSubmission.submittedAt).toLocaleDateString() + ' at ' + 
                    new Date(existingSubmission.submittedAt).toLocaleTimeString() : 
                    'Submitted (no date)'
                  ) : 
                  existingSubmission.status || 'Draft'
                }
              </p>
            )}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="primaryLink">Primary Link *</Label>
              <Input
                id="primaryLink"
                name="primaryLink"
                type="url"
                value={formData.primaryLink}
                onChange={handleChange}
                placeholder="https://your-primary-link.com"
                required={!existingSubmission}
                readOnly={!!existingSubmission}
                className={existingSubmission ? 'bg-gray-50 dark:bg-gray-800' : ''}
              />
              {existingSubmission && formData.primaryLink && (
                <a 
                  href={formData.primaryLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
                >
                  Open Link
                </a>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="backupLink">Backup Link</Label>
              <Input
                id="backupLink"
                name="backupLink"
                type="url"
                value={formData.backupLink}
                onChange={handleChange}
                placeholder="https://your-backup-link.com"
                readOnly={!!existingSubmission}
                className={existingSubmission ? 'bg-gray-50 dark:bg-gray-800' : ''}
              />
              {existingSubmission && formData.backupLink && (
                <a 
                  href={formData.backupLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
                >
                  Open Link
                </a>
              )}
              {!existingSubmission && (
                <p className="text-xs text-gray-500">
                  Optional: Provide a backup link in case the primary link doesn't work
                </p>
              )}
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {existingSubmission ? 'Close' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (existingSubmission ? 'Updating...' : 'Submitting...') : (existingSubmission ? 'Update Submission' : 'Submit Work')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
