'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserX, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface RemoveUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    id: string
    name: string
    email: string
    role: string
  } | null
  courseName: string
  onRemove: (userId: string) => Promise<void>
}

export function RemoveUserModal({
  open,
  onOpenChange,
  user,
  courseName,
  onRemove
}: RemoveUserModalProps) {
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState('')

  const handleRemove = async () => {
    if (!user) return

    try {
      setRemoving(true)
      setError('')
      
      await onRemove(user.id)
      
      // Close modal
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove user')
    } finally {
      setRemoving(false)
    }
  }

  const handleClose = () => {
    setError('')
    onOpenChange(false)
  }

  const getRoleColor = (userRole: string) => {
    switch (userRole) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'student': return 'bg-blue-100 text-blue-800'
      case 'instructor': return 'bg-green-100 text-green-800'
      case 'ta': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserX className="h-5 w-5 text-red-500" />
            <span>Remove User from Course</span>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this user from {courseName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
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
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action will remove the user from the course and they will lose access to all course materials and assignments.
            </AlertDescription>
          </Alert>

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
              disabled={removing}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRemove}
              disabled={removing}
            >
              {removing ? 'Removing...' : 'Remove User'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
