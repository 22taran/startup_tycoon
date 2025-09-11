'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Clock, Users, Lock, Unlock } from 'lucide-react'

interface AssignmentTeamManagerProps {
  assignmentId: string
  userRole: 'admin' | 'instructor'
}

interface TeamMember {
  id: string
  name: string
  email: string
  joinedAt: Date
}

interface AssignmentTeam {
  id: string
  name: string
  description?: string
  members: string[]
  currentMemberCount: number
  maxMembers: number
  isLocked: boolean
  lockedAt?: Date
  studentMembers: TeamMember[]
}

export function AdminAssignmentTeams({ assignmentId, userRole }: AssignmentTeamManagerProps) {
  const [teams, setTeams] = useState<AssignmentTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [locking, setLocking] = useState(false)

  useEffect(() => {
    fetchTeams()
  }, [assignmentId])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/assignment-teams?assignmentId=${assignmentId}&type=all`)
      const data = await response.json()

      if (data.success) {
        setTeams(data.data)
      } else {
        setError(data.error || 'Failed to fetch teams')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleLockTeams = async () => {
    try {
      setLocking(true)
      
      const response = await fetch(`/api/assignment-teams/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignmentId })
      })

      const data = await response.json()

      if (data.success) {
        await fetchTeams() // Refresh teams
        alert('Teams locked successfully')
      } else {
        alert(data.error || 'Failed to lock teams')
      }
    } catch (err) {
      alert('An error occurred while locking teams')
    } finally {
      setLocking(false)
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

  const getTeamCompleteness = (team: AssignmentTeam) => {
    if (team.currentMemberCount === team.maxMembers) {
      return { status: 'complete', color: 'bg-green-100 text-green-800', text: 'Complete' }
    } else if (team.currentMemberCount > 0) {
      return { status: 'partial', color: 'bg-yellow-100 text-yellow-800', text: 'Partial' }
    } else {
      return { status: 'empty', color: 'bg-red-100 text-red-800', text: 'Empty' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading teams...</p>
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

  const lockedTeams = teams.filter(team => team.isLocked).length
  const totalTeams = teams.length
  const completeTeams = teams.filter(team => team.currentMemberCount === team.maxMembers).length

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalTeams}</div>
              <div className="text-sm text-gray-600">Total Teams</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completeTeams}</div>
              <div className="text-sm text-gray-600">Complete Teams</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{totalTeams - completeTeams}</div>
              <div className="text-sm text-gray-600">Incomplete Teams</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{lockedTeams}</div>
              <div className="text-sm text-gray-600">Locked Teams</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
          <CardDescription>
            Manage teams for this assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button 
              onClick={handleLockTeams}
              disabled={locking || lockedTeams === totalTeams}
              variant="outline"
            >
              {locking ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Locking...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Lock All Teams
                </>
              )}
            </Button>
            
            <Button onClick={fetchTeams} variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Refresh Teams
            </Button>
          </div>
          
          {lockedTeams === totalTeams && (
            <div className="mt-4 flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>All teams are locked</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teams List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">All Teams</h3>
        
        {teams.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No teams found for this assignment</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {teams.map((team) => {
              const completeness = getTeamCompleteness(team)
              
              return (
                <Card key={team.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(team.isLocked)}
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                      </div>
                      <div className="flex space-x-2">
                        <Badge className={getStatusColor(team.isLocked)}>
                          {team.isLocked ? 'Locked' : 'Active'}
                        </Badge>
                        <Badge className={completeness.color}>
                          {completeness.text}
                        </Badge>
                      </div>
                    </div>
                    {team.description && (
                      <CardDescription>{team.description}</CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Team Members */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Team Members ({team.currentMemberCount}/{team.maxMembers})</h4>
                        {team.studentMembers.length > 0 ? (
                          <div className="space-y-2">
                            {team.studentMembers.map((member) => (
                              <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <div>
                                  <p className="font-medium">{member.name}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
                                </div>
                                <div className="text-xs text-gray-500">
                                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No members</p>
                        )}
                      </div>

                      {/* Team Status */}
                      <div className="border-t pt-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Status:</span>
                            <span className={`ml-2 ${team.isLocked ? 'text-green-600' : 'text-yellow-600'}`}>
                              {team.isLocked ? 'Locked' : 'Active'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Completeness:</span>
                            <span className={`ml-2 ${completeness.color}`}>
                              {completeness.text}
                            </span>
                          </div>
                          {team.isLocked && team.lockedAt && (
                            <div className="col-span-2">
                              <span className="font-medium">Locked at:</span>
                              <span className="ml-2 text-gray-600">
                                {new Date(team.lockedAt).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
