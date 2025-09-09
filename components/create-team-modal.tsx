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
import { AlertCircle } from 'lucide-react'

interface CreateTeamModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTeamCreated: () => void
  currentUserEmail: string
  courseId?: string
}

export function CreateTeamModal({ open, onOpenChange, onTeamCreated, currentUserEmail, courseId }: CreateTeamModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    member1Email: currentUserEmail,
    member2Email: ''
  })

  // Update form data when currentUserEmail changes
  useEffect(() => {
    console.log('🔄 CreateTeamModal: currentUserEmail changed to:', currentUserEmail)
    setFormData(prev => ({
      ...prev,
      member1Email: currentUserEmail
    }))
  }, [currentUserEmail])

  // Debug when modal opens
  useEffect(() => {
    if (open) {
      console.log('🔄 CreateTeamModal: Modal opened with currentUserEmail:', currentUserEmail)
      console.log('🔄 CreateTeamModal: formData.member1Email:', formData.member1Email)
    }
  }, [open, currentUserEmail, formData.member1Email])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Always include the current user as the first member
      const additionalMembers = formData.member2Email
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0 && email !== currentUserEmail)
      
      const members = [currentUserEmail, ...additionalMembers]

      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          members: members,
          courseId: courseId
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Reset form
        setFormData({
          name: '',
          description: '',
          member1Email: currentUserEmail,
          member2Email: ''
        })
        onOpenChange(false)
        onTeamCreated()
      } else {
        setError(data.error || 'Failed to create team')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Your Team</DialogTitle>
          <DialogDescription>
            Create a team with up to 2 members. You cannot change team members after creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter team name"
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
                placeholder="Enter team description (optional)"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="member1Email">Team Creator (You)</Label>
              <Input
                id="member1Email"
                value={formData.member1Email}
                disabled
                className="bg-gray-100 dark:bg-gray-800"
              />
              <p className="text-xs text-gray-500">
                You are automatically added as the first team member
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="member2Email">Additional Members</Label>
              <Input
                id="member2Email"
                name="member2Email"
                type="email"
                value={formData.member2Email}
                onChange={handleChange}
                placeholder="Enter additional member emails separated by commas"
              />
              <p className="text-xs text-gray-500">
                Optional: Add up to 1 additional team member (comma-separated)
              </p>
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
