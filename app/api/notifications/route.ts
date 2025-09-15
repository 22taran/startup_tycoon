import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { notificationService } from '@/lib/notifications'
import { z } from 'zod'

const notificationSchema = z.object({
  type: z.enum([
    'assignment-started',
    'evaluation-started', 
    'assignment-due-reminder',
    'evaluation-due-reminder',
    'team-invitation',
    'grade-published'
  ]),
  courseId: z.string().uuid(),
  assignmentId: z.string().uuid().optional(),
  data: z.record(z.any())
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and instructors can trigger notifications
    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Admin/Instructor access required' }, { status: 403 })
    }

    const body = await request.json()
    const { type, courseId, assignmentId, data } = notificationSchema.parse(body)

    let success = false

    switch (type) {
      case 'assignment-started':
        if (!assignmentId) {
          return NextResponse.json({
            success: false,
            error: 'Assignment ID is required for assignment-started notification'
          }, { status: 400 })
        }
        success = await sendAssignmentStartedNotification(courseId, assignmentId, data.assignmentTitle)
        break

      case 'evaluation-started':
        if (!assignmentId) {
          return NextResponse.json({
            success: false,
            error: 'Assignment ID is required for evaluation-started notification'
          }, { status: 400 })
        }
        success = await sendEvaluationStartedNotification(courseId, assignmentId, data.assignmentTitle)
        break

      case 'assignment-due-reminder':
        if (!assignmentId) {
          return NextResponse.json({
            success: false,
            error: 'Assignment ID is required for assignment-due-reminder notification'
          }, { status: 400 })
        }
        success = await sendAssignmentDueReminderNotification(courseId, assignmentId, data)
        break

      case 'evaluation-due-reminder':
        if (!assignmentId) {
          return NextResponse.json({
            success: false,
            error: 'Assignment ID is required for evaluation-due-reminder notification'
          }, { status: 400 })
        }
        success = await sendEvaluationDueReminderNotification(courseId, assignmentId, data)
        break

      case 'team-invitation':
        success = await sendTeamInvitationNotification(data)
        break

      case 'grade-published':
        if (!assignmentId) {
          return NextResponse.json({
            success: false,
            error: 'Assignment ID is required for grade-published notification'
          }, { status: 400 })
        }
        success = await sendGradePublishedNotification(courseId, assignmentId, data)
        break

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown notification type'
        }, { status: 400 })
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send notification'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error sending notification:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: error.errors[0].message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'An error occurred while sending the notification'
    }, { status: 500 })
  }
}

// Helper functions for different notification types
async function sendAssignmentStartedNotification(courseId: string, assignmentId: string, assignmentTitle: string) {
  const { sendAssignmentStartedNotification } = await import('@/lib/notifications')
  return await sendAssignmentStartedNotification(courseId, assignmentId, assignmentTitle)
}

async function sendEvaluationStartedNotification(courseId: string, assignmentId: string, assignmentTitle: string) {
  const { sendEvaluationStartedNotification } = await import('@/lib/notifications')
  return await sendEvaluationStartedNotification(courseId, assignmentId, assignmentTitle)
}

async function sendAssignmentDueReminderNotification(courseId: string, assignmentId: string, data: any) {
  // Implementation for assignment due reminder
  return await notificationService.sendEmail({
    to: data.emails || [],
    subject: `Reminder: ${data.assignmentTitle} due in ${data.hoursLeft} hours`,
    template: 'assignment-due-reminder',
    data: {
      name: 'Student',
      assignmentTitle: data.assignmentTitle,
      courseName: data.courseName,
      dueDate: data.dueDate,
      hoursLeft: data.hoursLeft,
      assignmentLink: data.assignmentLink
    }
  })
}

async function sendEvaluationDueReminderNotification(courseId: string, assignmentId: string, data: any) {
  // Implementation for evaluation due reminder
  return await notificationService.sendEmail({
    to: data.emails || [],
    subject: `Reminder: Evaluation for ${data.assignmentTitle} due in ${data.hoursLeft} hours`,
    template: 'evaluation-due-reminder',
    data: {
      name: 'Student',
      assignmentTitle: data.assignmentTitle,
      courseName: data.courseName,
      evaluationDueDate: data.evaluationDueDate,
      hoursLeft: data.hoursLeft,
      evaluationLink: data.evaluationLink
    }
  })
}

async function sendTeamInvitationNotification(data: any) {
  return await notificationService.sendEmail({
    to: data.email,
    subject: `Team Invitation: ${data.teamName} - ${data.courseName}`,
    template: 'team-invitation',
    data: {
      name: data.name,
      inviterName: data.inviterName,
      teamName: data.teamName,
      courseName: data.courseName,
      invitationLink: data.invitationLink
    }
  })
}

async function sendGradePublishedNotification(courseId: string, assignmentId: string, data: any) {
  return await notificationService.sendEmail({
    to: data.email,
    subject: `Grades Published: ${data.assignmentTitle} - ${data.courseName}`,
    template: 'grade-published',
    data: {
      name: data.name,
      assignmentTitle: data.assignmentTitle,
      courseName: data.courseName,
      grade: data.grade,
      feedback: data.feedback,
      gradesLink: data.gradesLink
    }
  })
}
