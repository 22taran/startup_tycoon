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
import { AlertCircle, Mail } from 'lucide-react'

interface EditTeamModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamName: string
  allowEditing?: boolean
  teamData?: {
    id: string
    name: string
    description?: string
    members: string[]
  }
  currentUserEmail?: string
  allUsers?: any[]
  courseId?: string
  onTeamUpdated?: () => void
}

export function EditTeamModal({ 
  open, 
  onOpenChange, 
  teamName, 
  allowEditing = false, 
  teamData, 
  currentUserEmail,
  allUsers = [],
  courseId,
  onTeamUpdated 
}: EditTeamModalProps) {
  const [formData, setFormData] = useState({
    name: teamData?.name || '',
    description: teamData?.description || '',
    member1Email: currentUserEmail || '',
    member2Email: teamData?.members?.filter(m => m !== currentUserEmail).join(', ') || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Helper function to convert user IDs to emails
  const getUserEmail = (userId: string) => {
    const user = allUsers.find(u => u.id === userId)
    return user ? user.email : userId
  }

  // Update form data when teamData changes
  useEffect(() => {
    if (teamData && allUsers.length > 0) {
      // Convert user IDs to emails for display
      const memberEmails = teamData.members?.map(getUserEmail) || []
      const otherMembers = memberEmails.filter(email => email !== currentUserEmail)
      
      setFormData({
        name: teamData.name || '',
        description: teamData.description || '',
        member1Email: currentUserEmail || '',
        member2Email: otherMembers.join(', ')
      })
    }
  }, [teamData, currentUserEmail, allUsers])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allowEditing || !teamData) return

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
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: teamData.id,
          name: formData.name,
          description: formData.description,
          members: members,
          courseId: courseId
        }),
      })

      const data = await response.json()

      if (data.success) {
        onOpenChange(false)
        onTeamUpdated?.()
      } else {
        setError(data.error || 'Failed to update team')
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
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            {allowEditing ? 'Update your team details' : `Team: ${teamName}`}
          </DialogDescription>
        </DialogHeader>
        
        {allowEditing && teamData ? (
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
              <div className="flex items-center gap-2 text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error:</span>
                <span>{error}</span>
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
                {loading ? 'Updating...' : 'Update Team'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <div className="py-4">
          {allowEditing ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Team Editing Allowed
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  You can modify team members and details. Changes will apply to future assignments.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Team Changes Not Allowed
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Team editing is not available while assignments are being evaluated. 
                  Please contact the administrator if you need to make changes.
                </p>
              </div>
            </div>
          )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              {!allowEditing && (
                <Button
                  onClick={() => {
                    window.location.href = 'mailto:admin@startup-tycoon.com?subject=Team Change Request'
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Admin
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
