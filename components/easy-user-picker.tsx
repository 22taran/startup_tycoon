'use client'

import { useState, useEffect } from 'react'
import { User } from '@/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Users, CheckCircle, UserPlus } from 'lucide-react'

interface EasyUserPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  courseName: string
  onEnroll: (userIds: string[], role: string) => Promise<void>
  enrolledUserIds: string[]
}

export function EasyUserPicker({
  open,
  onOpenChange,
  courseId,
  courseName,
  onEnroll,
  enrolledUserIds
}: EasyUserPickerProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [role, setRole] = useState<'student' | 'instructor' | 'ta'>('student')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Load users when modal opens
  useEffect(() => {
    if (open) {
      loadUsers()
      // Reset form
      setSelectedUserIds([])
      setSearchTerm('')
      setRole('student')
      setError('')
    }
  }, [open])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/users')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data)
      } else {
        setError(data.error || 'Failed to load users')
      }
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // Filter users - simple and direct
  const getAvailableUsers = () => {
    return users.filter(user => {
      // Don't show already enrolled users
      if (enrolledUserIds.includes(user.id)) return false
      
      // Filter by role
      if (role === 'student' && user.role !== 'student') return false
      if (role === 'instructor' && user.role !== 'admin') return false
      if (role === 'ta' && user.role !== 'student') return false
      
      // Filter by search
      if (searchTerm) {
        const matches = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.email.toLowerCase().includes(searchTerm.toLowerCase())
        if (!matches) return false
      }
      
      return true
    })
  }

  const availableUsers = getAvailableUsers()

  const handleUserToggle = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId))
    } else {
      setSelectedUserIds([...selectedUserIds, userId])
    }
  }

  const handleSelectAll = () => {
    const isAllSelected = selectedUserIds.length === availableUsers.length
    if (isAllSelected) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(availableUsers.map(u => u.id))
    }
  }

  const handleEnroll = async () => {
    if (selectedUserIds.length === 0) {
      setError('Please select at least one user')
      return
    }

    try {
      setEnrolling(true)
      setError('')
      
      await onEnroll(selectedUserIds, role)
      
      // Close modal
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll users')
    } finally {
      setEnrolling(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const getRoleColor = (userRole: string) => {
    switch (userRole) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'student': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isAllSelected = availableUsers.length > 0 && selectedUserIds.length === availableUsers.length
  const isIndeterminate = selectedUserIds.length > 0 && selectedUserIds.length < availableUsers.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Add Users to {courseName}</span>
          </DialogTitle>
          <DialogDescription>
            Select users from your registered users to enroll them in this course.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role for Selected Users</Label>
            <Select value={role} onValueChange={(value: any) => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="ta">Teaching Assistant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Select All */}
          {availableUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={isAllSelected ? true : isIndeterminate ? "indeterminate" : false}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="text-sm">
                Select All ({availableUsers.length} users)
              </Label>
            </div>
          )}

          {/* Users List */}
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
            {loading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : error ? (
              <div className="text-red-600 text-center py-4">{error}</div>
            ) : availableUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm ? 'No users found matching your search' : 'No available users to enroll'}
                </p>
              </div>
            ) : (
              availableUsers.map(user => (
                <Card
                  key={user.id}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedUserIds.includes(user.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleUserToggle(user.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedUserIds.includes(user.id)}
                        className="pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium truncate">{user.name}</p>
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {user.email}
                        </p>
                      </div>
                      {selectedUserIds.includes(user.id) && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Selected Count */}
          {selectedUserIds.length > 0 && (
            <div className="text-sm text-gray-600">
              {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={enrolling}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEnroll}
              disabled={enrolling || selectedUserIds.length === 0}
            >
              {enrolling ? 'Adding...' : `Add ${selectedUserIds.length} User${selectedUserIds.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
