'use client'

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Upload, FileText } from 'lucide-react'
import { Assignment } from '@/types'

interface EditAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: Assignment | null
  onAssignmentUpdated: () => void
}

export function EditAssignmentModal({ open, onOpenChange, assignment, onAssignmentUpdated }: EditAssignmentModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    dueDate: '',
    document: null as File | null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  // Update form data when assignment changes
  useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title,
        description: assignment.description,
        startDate: assignment.startDate ? new Date(assignment.startDate).toISOString().slice(0, 16) : '',
        dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : '',
        document: null
      })
    }
  }, [assignment])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({
      ...prev,
      document: file
    }))
  }

  const uploadDocument = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'assignments')

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to upload document')
    }

    const data = await response.json()
    return data.url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignment) return

    setLoading(true)
    setError('')

    try {
      let documentUrl = assignment.documentUrl || ''

      // Upload new document if provided
      if (formData.document) {
        setUploading(true)
        try {
          documentUrl = await uploadDocument(formData.document)
        } catch (uploadError) {
          setError('Failed to upload document. Please try again.')
          setUploading(false)
          setLoading(false)
          return
        }
        setUploading(false)
      }

      console.log('🔄 Updating assignment with data:', {
        id: assignment.id,
        title: formData.title,
        startDate: formData.startDate,
        dueDate: formData.dueDate
      })

      const response = await fetch('/api/assignments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: assignment.id,
          title: formData.title,
          description: formData.description,
          startDate: formData.startDate,
          dueDate: formData.dueDate,
          documentUrl: documentUrl
        }),
      })

      const data = await response.json()
      console.log('📝 Update response:', data)

      if (data.success) {
        console.log('✅ Assignment updated successfully')
        onOpenChange(false)
        onAssignmentUpdated()
      } else {
        console.error('❌ Update failed:', data.error)
        setError(data.error || 'Failed to update assignment')
      }
    } catch (error) {
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
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription>
            Update the assignment details and settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Assignment Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter assignment title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter assignment description"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date & Time</Label>
              <Input
                id="startDate"
                name="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-gray-500">
                Assignment becomes active on this date
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date & Time</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-gray-500">
                Assignment gets locked on this date
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="document">Assignment Document (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="document"
                  name="document"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {formData.document && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <FileText className="h-4 w-4" />
                    {formData.document.name}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Upload new document to replace existing one (PDF, DOC, DOCX, TXT, MD)
              </p>
              {assignment.documentUrl && (
                <div className="text-xs text-blue-600">
                  Current document: 
                  <a 
                    href={assignment.documentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline ml-1"
                  >
                    View Current Document
                  </a>
                </div>
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
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {uploading ? 'Uploading...' : loading ? 'Updating...' : 'Update Assignment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
