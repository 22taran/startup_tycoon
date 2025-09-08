'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Coins, AlertCircle, CheckCircle } from 'lucide-react'

interface InvestmentModalProps {
  isOpen: boolean
  onClose: () => void
  assignmentId?: string
  teamId?: string
  onSuccess?: () => void
}

export function InvestmentModal({ isOpen, onClose, assignmentId, teamId, onSuccess }: InvestmentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState(10)
  const [comments, setComments] = useState('')
  const [isIncomplete, setIsIncomplete] = useState(false)
  const [remainingTokens, setRemainingTokens] = useState(100)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setAmount(10)
      setComments('')
      setIsIncomplete(false)
      setError(null)
      fetchRemainingTokens()
    }
  }, [isOpen])

  const fetchRemainingTokens = async () => {
    if (!assignmentId) return
    
    try {
      const response = await fetch(`/api/investments/tokens?assignmentId=${assignmentId}`)
      if (response.ok) {
        const data = await response.json()
        setRemainingTokens(data.data?.remainingTokens || 100)
      }
    } catch (error) {
      console.error('Error fetching remaining tokens:', error)
    }
  }

  const handleSubmit = async () => {
    if (!assignmentId || !teamId) {
      setError('Missing assignment or team information')
      return
    }

    if (isIncomplete) {
      // Submit as incomplete with 0 tokens
      setAmount(0)
    } else if (amount < 10 || amount > 50) {
      setError('Investment amount must be between 10 and 50 tokens')
      return
    }

    if (amount > remainingTokens) {
      setError('Insufficient tokens remaining')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId,
          teamId,
          amount: isIncomplete ? 0 : amount,
          comments: comments.trim() || null,
          isIncomplete
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh remaining tokens
        await fetchRemainingTokens()
        onSuccess?.()
        onClose()
      } else {
        setError(data.error || 'Failed to submit investment')
      }
    } catch (error) {
      setError('Failed to submit investment')
      console.error('Error submitting investment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleIncompleteChange = (checked: boolean) => {
    setIsIncomplete(checked)
    if (checked) {
      setAmount(0)
    } else {
      setAmount(10)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Invest Tokens
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="text-sm font-medium">Available Tokens:</span>
            <span className="text-lg font-bold text-blue-600">{remainingTokens}</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="incomplete" 
                checked={isIncomplete}
                onCheckedChange={handleIncompleteChange}
              />
              <Label htmlFor="incomplete" className="text-sm">
                Mark as Incomplete/Unfinished (0 tokens)
              </Label>
            </div>

            {!isIncomplete && (
              <div className="space-y-2">
                <Label htmlFor="amount">Investment Amount (10-50 tokens)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="10"
                  max="50"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 10)}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  Minimum: 10 tokens, Maximum: 50 tokens
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                placeholder="Share your thoughts about this submission..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Investment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
