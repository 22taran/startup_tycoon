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
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'

interface AddTeamModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTeamAdded: () => void
  currentUserEmail: string
  userRole?: 'admin' | 'student'
}

export function AddTeamModal({ open, onOpenChange, onTeamAdded, currentUserEmail, userRole = 'student' }: AddTeamModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberEmails: userRole === 'student' ? currentUserEmail : ''
  })
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
      // Parse member emails (comma-separated)
      const members = formData.memberEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0)
      
      // For students, always include the current user as the first member
      if (userRole === 'student') {
        const additionalMembers = members.filter(email => email !== currentUserEmail)
        members.splice(0, members.length, currentUserEmail, ...additionalMembers)
      }

      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          members: members
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Reset form
        setFormData({
          name: '',
          description: '',
          memberEmails: userRole === 'student' ? currentUserEmail : ''
        })
        onOpenChange(false)
        onTeamAdded()
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Team</DialogTitle>
          <DialogDescription>
            {userRole === 'admin' 
              ? 'Create a new team for students. Enter all team member emails.'
              : 'Create a new team for the Startup Tycoon game. You will be automatically added as the first member.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Team Name</Label>
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
            {userRole === 'student' && (
              <div className="grid gap-2">
                <Label htmlFor="currentUserEmail">Team Creator (You)</Label>
                <Input
                  id="currentUserEmail"
                  value={currentUserEmail}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800"
                />
                <p className="text-xs text-gray-500">
                  You are automatically added as the first team member
                </p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="memberEmails">
                {userRole === 'admin' ? 'Team Members' : 'Additional Members'}
              </Label>
              <Input
                id="memberEmails"
                name="memberEmails"
                value={userRole === 'student' 
                  ? formData.memberEmails.replace(currentUserEmail + ',', '').replace(currentUserEmail, '')
                  : formData.memberEmails
                }
                onChange={handleChange}
                placeholder={userRole === 'admin' 
                  ? "Enter all team member emails separated by commas"
                  : "Enter additional member emails separated by commas"
                }
                required={userRole === 'admin'}
              />
              <p className="text-xs text-gray-500">
                {userRole === 'admin' 
                  ? 'Example: john@example.com, jane@example.com, bob@example.com'
                  : 'Example: john@example.com, jane@example.com, bob@example.com'
                }
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
