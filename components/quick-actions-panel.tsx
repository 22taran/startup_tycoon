'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus,
  Users,
  FileText,
  Bell,
  Settings,
  BarChart3,
  Calendar,
  FolderOpen,
  Target,
  GraduationCap
} from 'lucide-react'

interface QuickAction {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'outline'
}

interface QuickActionsPanelProps {
  actions: QuickAction[]
  title?: string
  description?: string
}

export function QuickActionsPanel({ 
  actions, 
  title = "Quick Actions", 
  description = "Common tasks and shortcuts" 
}: QuickActionsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || "outline"}
              className="h-16 flex flex-col items-center justify-center space-y-2 p-4"
              onClick={action.onClick}
            >
              <div className="flex items-center space-x-2">
                {action.icon}
                <span className="text-sm font-medium">{action.label}</span>
              </div>
              <span className="text-xs text-gray-500 text-center">
                {action.description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Predefined action sets for different contexts
export const courseManagementActions: QuickAction[] = [
  {
    id: 'create-assignment',
    label: 'Create Assignment',
    description: 'Add new assignment',
    icon: <FileText className="h-4 w-4" />,
    onClick: () => console.log('Create assignment'),
    variant: 'default'
  },
  {
    id: 'manage-teams',
    label: 'Manage Teams',
    description: 'Organize students',
    icon: <Users className="h-4 w-4" />,
    onClick: () => console.log('Manage teams')
  },
  {
    id: 'post-announcement',
    label: 'Post Announcement',
    description: 'Notify students',
    icon: <Bell className="h-4 w-4" />,
    onClick: () => console.log('Post announcement')
  },
  {
    id: 'course-settings',
    label: 'Course Settings',
    description: 'Configure course',
    icon: <Settings className="h-4 w-4" />,
    onClick: () => console.log('Course settings')
  },
  {
    id: 'view-analytics',
    label: 'View Analytics',
    description: 'Performance metrics',
    icon: <BarChart3 className="h-4 w-4" />,
    onClick: () => console.log('View analytics')
  },
  {
    id: 'manage-calendar',
    label: 'Manage Calendar',
    description: 'Schedule events',
    icon: <Calendar className="h-4 w-4" />,
    onClick: () => console.log('Manage calendar')
  }
]

export const instructorDashboardActions: QuickAction[] = [
  {
    id: 'create-course',
    label: 'Create Course',
    description: 'Start new course',
    icon: <Plus className="h-4 w-4" />,
    onClick: () => console.log('Create course'),
    variant: 'default'
  },
  {
    id: 'view-analytics',
    label: 'View Analytics',
    description: 'Course performance',
    icon: <BarChart3 className="h-4 w-4" />,
    onClick: () => console.log('View analytics')
  },
  {
    id: 'manage-resources',
    label: 'Manage Resources',
    description: 'Course materials',
    icon: <FolderOpen className="h-4 w-4" />,
    onClick: () => console.log('Manage resources')
  }
]

export const adminDashboardActions: QuickAction[] = [
  {
    id: 'create-course',
    label: 'Create Course',
    description: 'Add new course',
    icon: <Plus className="h-4 w-4" />,
    onClick: () => console.log('Create course'),
    variant: 'default'
  },
  {
    id: 'manage-users',
    label: 'Manage Users',
    description: 'User accounts',
    icon: <Users className="h-4 w-4" />,
    onClick: () => console.log('Manage users')
  },
  {
    id: 'platform-settings',
    label: 'Platform Settings',
    description: 'System config',
    icon: <Settings className="h-4 w-4" />,
    onClick: () => console.log('Platform settings')
  },
  {
    id: 'view-analytics',
    label: 'View Analytics',
    description: 'Platform metrics',
    icon: <BarChart3 className="h-4 w-4" />,
    onClick: () => console.log('View analytics')
  }
]
