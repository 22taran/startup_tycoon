'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Edit, Trash2, Users, Calendar } from 'lucide-react'
import { Team } from '@/types'

interface ManageTeamsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTeamsUpdated: () => void
}

export function ManageTeamsModal({ open, onOpenChange, onTeamsUpdated }: ManageTeamsModalProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    members: ''
  })

  useEffect(() => {
    if (open) {
      setError('')
      setSuccess('')
      fetchTeams()
    }
  }, [open])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const [teamsResponse, usersResponse] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/users')
      ])
      
      const teamsData = await teamsResponse.json()
      const usersData = await usersResponse.json()
      
      if (teamsData.success) {
        setTeams(teamsData.data || [])
      } else {
        setError(teamsData.error || 'Failed to fetch teams')
      }
      
      if (usersData.success) {
        setUsers(usersData.data || [])
      }
    } catch (error) {
      setError('An error occurred while fetching teams')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to convert user IDs to emails
  const getUserEmails = (userIds: string[]) => {
    return userIds.map(id => {
      const user = users.find(u => u.id === id)
      return user ? user.email : id
    }).join(', ')
  }

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team)
    setEditFormData({
      name: team.name,
      description: team.description || '',
      members: getUserEmails(team.members || [])
    })
  }

  const handleUpdateTeam = async () => {
    if (!editingTeam) return

    try {
      setLoading(true)
      setError('')

      const members = editFormData.members
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0)

      const response = await fetch('/api/teams', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingTeam.id,
          name: editFormData.name,
          description: editFormData.description,
          members: members
        }),
      })

      const data = await response.json()

      if (data.success) {
        setEditingTeam(null)
        setEditFormData({ name: '', description: '', members: '' })
        setSuccess('Team updated successfully!')
        setError('')
        await fetchTeams()
        onTeamsUpdated()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to update team')
      }
    } catch (error) {
      setError('An error occurred while updating team')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId)
    const teamName = team?.name || 'this team'
    
    if (!confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone and will remove all associated data.`)) {
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/teams?id=${teamId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Team deleted successfully!')
        setError('')
        await fetchTeams()
        onTeamsUpdated()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to delete team')
      }
    } catch (error) {
      setError('An error occurred while deleting team')
    } finally {
      setLoading(false)
    }
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Teams</DialogTitle>
          <DialogDescription>
            View, edit, and delete teams. Click on a team to edit its details.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm mb-4">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-600 text-sm mb-4">
            <div className="h-4 w-4 rounded-full bg-green-600 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            {success}
          </div>
        )}

        {loading && !editingTeam && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading teams...</p>
          </div>
        )}

        {!loading && teams.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No teams found</p>
          </div>
        )}

        {!loading && teams.length > 0 && !editingTeam && (
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{team.name}</h3>
                    <Badge variant="secondary">
                      {team.members?.length || 0} members
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTeam(team)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>

                {team.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {team.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Members:
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {getUserEmails(team.members || []) || 'No members'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Created:
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {(team as any).created_at ? 
                        new Date((team as any).created_at).toLocaleDateString() :
                        team.createdAt ? 
                        new Date(team.createdAt).toLocaleDateString() : 
                        'Unknown'
                      }
                    </span>
                  </div>

                  <div className="text-xs text-gray-500">
                    Team ID: {team.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingTeam && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold mb-4">Edit Team: {editingTeam.name}</h3>
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="editName">Team Name *</Label>
                  <Input
                    id="editName"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    placeholder="Enter team name"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="editDescription">Description</Label>
                  <Textarea
                    id="editDescription"
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditFormChange}
                    placeholder="Enter team description (optional)"
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="editMembers">Members</Label>
                  <Input
                    id="editMembers"
                    name="members"
                    value={editFormData.members}
                    onChange={handleEditFormChange}
                    placeholder="Enter member emails separated by commas"
                  />
                  <p className="text-xs text-gray-500">
                    Separate multiple email addresses with commas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button
                  onClick={handleUpdateTeam}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Team'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingTeam(null)
                    setEditFormData({ name: '', description: '', members: '' })
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
