'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertCircle, Mail } from 'lucide-react'

interface EditTeamModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamName: string
}

export function EditTeamModal({ open, onOpenChange, teamName }: EditTeamModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Team: {teamName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Team Changes Not Allowed
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Once a team is created, you cannot modify team members or details. 
                Please contact the administrator if you need to make changes.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              window.location.href = 'mailto:admin@startup-tycoon.com?subject=Team Change Request'
            }}
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Admin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
