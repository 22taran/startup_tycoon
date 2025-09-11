'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle, Clock, Users, Plus, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface AssignmentTeamManagerProps {
  assignmentId: string
  currentUserId: string
  userRole: 'admin' | 'student' | 'instructor'
}

interface Team {
  id: string
  name: string
  description?: string
  members: string[]
  currentMemberCount: number
  maxMembers: number
  availableSpots: number
}

interface MyTeam {
  id: string
  assignmentId: string
  studentId: string
  teamId: string
  joinedAt: Date
  isLocked: boolean
  lockedAt?: Date
  team: {
    id: string
    name: string
    description?: string
    members: string[]
    currentMemberCount: number
  }
}

export function AssignmentTeamManager({ assignmentId, currentUserId, userRole }: AssignmentTeamManagerProps) {
  const [myTeam, setMyTeam] = useState<MyTeam | null>(null)
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showChangeTeam, setShowChangeTeam] = useState(false)
  const [canChangeTeams, setCanChangeTeams] = useState({ canChange: false, reason: '' })
  
  // Create team form
  const [createForm, setCreateForm] = useState({
    teamName: '',
    description: '',
    partnerEmail: ''
  })
  
  // Change team form
  const [changeForm, setChangeForm] = useState({
    newTeamId: '',
    reason: ''
  })

  useEffect(() => {
    fetchData()
  }, [assignmentId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [myTeamRes, availableTeamsRes, canChangeRes] = await Promise.all([
        fetch(`/api/assignment-teams?assignmentId=${assignmentId}&type=my-team`),
        fetch(`/api/assignment-teams?assignmentId=${assignmentId}&type=available`),
        fetch(`/api/assignment-teams?assignmentId=${assignmentId}&type=can-change`)
      ])

      const [myTeamData, availableTeamsData, canChangeData] = await Promise.all([
        myTeamRes.json(),
        availableTeamsRes.json(),
        canChangeRes.json()
      ])

      if (myTeamData.success) {
        setMyTeam(myTeamData.data)
      }

      if (availableTeamsData.success) {
        setAvailableTeams(availableTeamsData.data)
      }

      if (canChangeData.success) {
        setCanChangeTeams(canChangeData.data)
      }

      // If admin/instructor, also fetch all teams
      if (userRole === 'admin' || userRole === 'instructor') {
        const allTeamsRes = await fetch(`/api/assignment-teams?assignmentId=${assignmentId}&type=all`)
        const allTeamsData = await allTeamsRes.json()
        
        if (allTeamsData.success) {
          setAllTeams(allTeamsData.data)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!createForm.teamName || !createForm.partnerEmail) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/assignment-teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId,
          teamName: createForm.teamName,
          description: createForm.description,
          studentIds: [currentUserId, createForm.partnerEmail] // This would need to be resolved to user IDs
        })
      })

      const data = await response.json()

      if (data.success) {
        setShowCreateTeam(false)
        setCreateForm({ teamName: '', description: '', partnerEmail: '' })
        await fetchData()
      } else {
        alert(data.error || 'Failed to create team')
      }
    } catch (err) {
      alert('An error occurred while creating team')
    }
  }

  const handleChangeTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!changeForm.newTeamId) {
      alert('Please select a team')
      return
    }

    try {
      const response = await fetch('/api/assignment-teams/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId,
          newTeamId: changeForm.newTeamId,
          reason: changeForm.reason
        })
      })

      const data = await response.json()

      if (data.success) {
        setShowChangeTeam(false)
        setChangeForm({ newTeamId: '', reason: '' })
        await fetchData()
      } else {
        alert(data.error || 'Failed to change team')
      }
    } catch (err) {
      alert('An error occurred while changing team')
    }
  }

  const getStatusIcon = (isLocked: boolean) => {
    return isLocked ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <Clock className="h-4 w-4 text-yellow-500" />
  }

  const getStatusColor = (isLocked: boolean) => {
    return isLocked ? 
      'bg-green-100 text-green-800' : 
      'bg-yellow-100 text-yellow-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading team information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* My Team Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>My Team</span>
              </CardTitle>
              <CardDescription>
                {myTeam ? 'Your current team for this assignment' : 'You are not in a team yet'}
              </CardDescription>
            </div>
            {myTeam && (
              <Badge className={getStatusColor(myTeam.isLocked)}>
                {myTeam.isLocked ? 'Locked' : 'Active'}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {myTeam ? (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Team Name</Label>
                <p className="text-lg font-semibold">{myTeam.team.name}</p>
              </div>
              
              {myTeam.team.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{myTeam.team.description}</p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium">Members</Label>
                <p className="text-sm">{myTeam.team.currentMemberCount}/2 members</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Joined</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(myTeam.joinedAt).toLocaleDateString()}
                </p>
              </div>
              
              {myTeam.isLocked && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Team locked on {new Date(myTeam.lockedAt!).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">You are not in a team yet</p>
              {canChangeTeams.canChange && (
                <Button onClick={() => setShowCreateTeam(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Actions */}
      {myTeam && canChangeTeams.canChange && !myTeam.isLocked && (
        <Card>
          <CardHeader>
            <CardTitle>Team Actions</CardTitle>
            <CardDescription>
              You can change teams before the submission deadline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button onClick={() => setShowChangeTeam(true)} variant="outline">
                <ArrowRight className="h-4 w-4 mr-2" />
                Change Team
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cannot Change Teams Message */}
      {!canChangeTeams.canChange && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-yellow-600">
              <AlertCircle className="h-4 w-4" />
              <span>{canChangeTeams.reason}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Teams */}
      {availableTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Teams</CardTitle>
            <CardDescription>
              Teams you can join (if you're not already in a team)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableTeams.map((team) => (
                <div key={team.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{team.name}</h4>
                      {team.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{team.description}</p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {team.availableSpots} spot{team.availableSpots !== 1 ? 's' : ''} available
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Team Modal */}
      <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a team for this assignment. Teams must have exactly 2 members.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTeam}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="teamName">Team Name *</Label>
                <Input
                  id="teamName"
                  value={createForm.teamName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, teamName: e.target.value }))}
                  placeholder="Enter team name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional team description"
                />
              </div>
              <div>
                <Label htmlFor="partnerEmail">Partner Email *</Label>
                <Input
                  id="partnerEmail"
                  type="email"
                  value={createForm.partnerEmail}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, partnerEmail: e.target.value }))}
                  placeholder="Enter your partner's email"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateTeam(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Team</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Team Modal */}
      <Dialog open={showChangeTeam} onOpenChange={setShowChangeTeam}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Team</DialogTitle>
            <DialogDescription>
              Select a new team to join for this assignment.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangeTeam}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="newTeamId">Select Team *</Label>
                <Select
                  value={changeForm.newTeamId}
                  onValueChange={(value) => setChangeForm(prev => ({ ...prev, newTeamId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} ({team.availableSpots} spots available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  value={changeForm.reason}
                  onChange={(e) => setChangeForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Why are you changing teams?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowChangeTeam(false)}>
                Cancel
              </Button>
              <Button type="submit">Change Team</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
