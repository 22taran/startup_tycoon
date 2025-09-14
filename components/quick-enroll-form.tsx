'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, X, Check } from 'lucide-react'

interface QuickEnrollFormProps {
  courseId: string
  onEnroll: (emails: string[], role: string) => Promise<void>
  onSuccess?: () => void
}

export function QuickEnrollForm({ courseId, onEnroll, onSuccess }: QuickEnrollFormProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'student' | 'instructor' | 'ta'>('student')
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    try {
      setEnrolling(true)
      setError('')
      setSuccess(false)
      
      await onEnroll([email.trim()], role)
      
      setSuccess(true)
      setEmail('')
      
      if (onSuccess) {
        onSuccess()
      }
      
      // Reset success message after 2 seconds
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll user')
    } finally {
      setEnrolling(false)
    }
  }

  const handleReset = () => {
    setEmail('')
    setRole('student')
    setError('')
    setSuccess(false)
  }

  return (
    <Card className="border-dashed border-2 border-gray-300">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <Plus className="h-4 w-4 text-gray-500" />
            <Label className="text-sm font-medium">Quick Enroll</Label>
          </div>
          
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={enrolling}
              />
            </div>
            <div className="w-32">
              <Select value={role} onValueChange={(value: any) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="ta">TA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              size="sm" 
              disabled={enrolling || !email.trim()}
            >
              {enrolling ? 'Adding...' : 'Add'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              disabled={enrolling}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="text-red-600 text-sm flex items-center space-x-1">
              <X className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="text-green-600 text-sm flex items-center space-x-1">
              <Check className="h-4 w-4" />
              <span>User enrolled successfully!</span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
