import { getSupabaseClient } from './database'

export interface NotificationData {
  to: string | string[]
  subject: string
  template: string
  data: Record<string, any>
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export class NotificationService {
  private static instance: NotificationService
  private emailProvider: 'gmail' | 'console'
  
  constructor() {
    this.emailProvider = (process.env.EMAIL_PROVIDER as any) || 'console'
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async sendEmail(notificationData: NotificationData): Promise<boolean> {
    try {
      const template = this.getTemplate(notificationData.template, notificationData.data)
      const recipients = Array.isArray(notificationData.to) ? notificationData.to : [notificationData.to]
      
      console.log(`📧 Sending email to ${recipients.length} recipient(s)`)
      console.log(`   Subject: ${template.subject}`)
      console.log(`   Template: ${notificationData.template}`)
      
      switch (this.emailProvider) {
        case 'gmail':
          return await this.sendViaGmail(recipients, template)
        case 'console':
        default:
          return await this.sendViaConsole(recipients, template)
      }
    } catch (error) {
      console.error('❌ Error sending email:', error)
      return false
    }
  }


  private async sendViaGmail(recipients: string[], template: EmailTemplate): Promise<boolean> {
    try {
      const nodemailer = await import('nodemailer')
      
      // Create transporter
      const transporter = nodemailer.default.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD // Use App Password, not regular password
        }
      })
      
      const results = await Promise.allSettled(
        recipients.map(recipient => 
          transporter.sendMail({
            from: process.env.FROM_EMAIL || process.env.GMAIL_USER,
            to: recipient,
            subject: template.subject,
            html: template.html,
            text: template.text
          })
        )
      )
      
      const successCount = results.filter(result => result.status === 'fulfilled').length
      console.log(`✅ Gmail SMTP: ${successCount}/${recipients.length} emails sent successfully`)
      
      return successCount === recipients.length
    } catch (error) {
      console.error('❌ Gmail SMTP not available, falling back to console mode:', error)
      return await this.sendViaConsole(recipients, template)
    }
  }

  private async sendViaConsole(recipients: string[], template: EmailTemplate): Promise<boolean> {
    console.log('\n' + '='.repeat(60))
    console.log('📧 EMAIL NOTIFICATION (Console Mode)')
    console.log('='.repeat(60))
    console.log(`To: ${recipients.join(', ')}`)
    console.log(`Subject: ${template.subject}`)
    console.log('\nHTML Content:')
    console.log(template.html)
    console.log('\nText Content:')
    console.log(template.text)
    console.log('='.repeat(60) + '\n')
    
    return true
  }

  private getTemplate(templateName: string, data: Record<string, any>): EmailTemplate {
    switch (templateName) {
      case 'forgot-password':
        return this.getForgotPasswordTemplate(data as { userName: string; resetLink: string })
      case 'assignment-started':
        return this.getAssignmentStartedTemplate(data as { userName: string; assignmentTitle: string; courseName: string; dueDate: string; assignmentLink: string })
      case 'evaluation-started':
        return this.getEvaluationStartedTemplate(data as { userName: string; assignmentTitle: string; courseName: string; evaluationDueDate: string; evaluationLink: string })
      case 'assignment-due-reminder':
        return this.getAssignmentDueReminderTemplate(data as { userName: string; assignmentTitle: string; courseName: string; dueDate: string; hoursLeft: number; assignmentLink: string })
      case 'evaluation-due-reminder':
        return this.getEvaluationDueReminderTemplate(data as { userName: string; assignmentTitle: string; courseName: string; evaluationDueDate: string; hoursLeft: number; evaluationLink: string })
      case 'team-invitation':
        return this.getTeamInvitationTemplate(data as { userName: string; inviterName: string; teamName: string; courseName: string; invitationLink: string })
      case 'grade-published':
        return this.getGradePublishedTemplate(data as { userName: string; assignmentTitle: string; courseName: string; grade: number; feedback: string; gradesLink: string })
      default:
        return this.getDefaultTemplate(data)
    }
  }

  private getForgotPasswordTemplate(data: { userName: string; resetLink: string }): EmailTemplate {
    return {
      subject: 'Reset Your Password - Startup Tycoon',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Reset Your Password</h2>
          <p>Hello ${data.userName},</p>
          <p>You requested to reset your password for your Startup Tycoon account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Startup Tycoon - Learn entrepreneurship through hands-on experience
          </p>
        </div>
      `,
      text: `
        Reset Your Password - Startup Tycoon
        
        Hello ${data.userName},
        
        You requested to reset your password for your Startup Tycoon account.
        
        Click the link below to reset your password:
        ${data.resetLink}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request this password reset, please ignore this email.
        
        --
        Startup Tycoon - Learn entrepreneurship through hands-on experience
      `
    }
  }

  private getAssignmentStartedTemplate(data: { 
    userName: string; 
    assignmentTitle: string; 
    courseName: string; 
    dueDate: string;
    assignmentLink: string;
  }): EmailTemplate {
    return {
      subject: `New Assignment: ${data.assignmentTitle} - ${data.courseName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Assignment Available!</h2>
          <p>Hello ${data.userName},</p>
          <p>A new assignment has been posted in <strong>${data.courseName}</strong>:</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1f2937;">${data.assignmentTitle}</h3>
            <p><strong>Due Date:</strong> ${data.dueDate}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.assignmentLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Assignment
            </a>
          </div>
          
          <p>Good luck with your assignment!</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Startup Tycoon - Learn entrepreneurship through hands-on experience
          </p>
        </div>
      `,
      text: `
        New Assignment: ${data.assignmentTitle} - ${data.courseName}
        
        Hello ${data.userName},
        
        A new assignment has been posted in ${data.courseName}:
        
        Assignment: ${data.assignmentTitle}
        Due Date: ${data.dueDate}
        
        View the assignment: ${data.assignmentLink}
        
        Good luck with your assignment!
        
        --
        Startup Tycoon - Learn entrepreneurship through hands-on experience
      `
    }
  }

  private getEvaluationStartedTemplate(data: { 
    userName: string; 
    assignmentTitle: string; 
    courseName: string; 
    evaluationDueDate: string;
    evaluationLink: string;
  }): EmailTemplate {
    return {
      subject: `Evaluation Phase Started: ${data.assignmentTitle} - ${data.courseName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Evaluation Phase Started!</h2>
          <p>Hello ${data.userName},</p>
          <p>The evaluation phase has begun for <strong>${data.assignmentTitle}</strong> in <strong>${data.courseName}</strong>.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #1f2937;">${data.assignmentTitle}</h3>
            <p><strong>Evaluation Due Date:</strong> ${data.evaluationDueDate}</p>
            <p>You can now evaluate other teams' submissions and invest in promising projects!</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.evaluationLink}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Start Evaluating
            </a>
          </div>
          
          <p>Make sure to complete your evaluations before the due date!</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Startup Tycoon - Learn entrepreneurship through hands-on experience
          </p>
        </div>
      `,
      text: `
        Evaluation Phase Started: ${data.assignmentTitle} - ${data.courseName}
        
        Hello ${data.userName},
        
        The evaluation phase has begun for ${data.assignmentTitle} in ${data.courseName}.
        
        Assignment: ${data.assignmentTitle}
        Evaluation Due Date: ${data.evaluationDueDate}
        
        You can now evaluate other teams' submissions and invest in promising projects!
        
        Start evaluating: ${data.evaluationLink}
        
        Make sure to complete your evaluations before the due date!
        
        --
        Startup Tycoon - Learn entrepreneurship through hands-on experience
      `
    }
  }

  private getAssignmentDueReminderTemplate(data: { 
    userName: string; 
    assignmentTitle: string; 
    courseName: string; 
    dueDate: string;
    hoursLeft: number;
    assignmentLink: string;
  }): EmailTemplate {
    return {
      subject: `Reminder: ${data.assignmentTitle} due in ${data.hoursLeft} hours`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Assignment Due Soon!</h2>
          <p>Hello ${data.userName},</p>
          <p>This is a friendly reminder that your assignment is due soon:</p>
          
          <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #1f2937;">${data.assignmentTitle}</h3>
            <p><strong>Due Date:</strong> ${data.dueDate}</p>
            <p><strong>Time Remaining:</strong> ${data.hoursLeft} hours</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.assignmentLink}" 
               style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Complete Assignment
            </a>
          </div>
          
          <p>Don't forget to submit your work on time!</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Startup Tycoon - Learn entrepreneurship through hands-on experience
          </p>
        </div>
      `,
      text: `
        Reminder: ${data.assignmentTitle} due in ${data.hoursLeft} hours
        
        Hello ${data.userName},
        
        This is a friendly reminder that your assignment is due soon:
        
        Assignment: ${data.assignmentTitle}
        Due Date: ${data.dueDate}
        Time Remaining: ${data.hoursLeft} hours
        
        Complete your assignment: ${data.assignmentLink}
        
        Don't forget to submit your work on time!
        
        --
        Startup Tycoon - Learn entrepreneurship through hands-on experience
      `
    }
  }

  private getEvaluationDueReminderTemplate(data: { 
    userName: string; 
    assignmentTitle: string; 
    courseName: string; 
    evaluationDueDate: string;
    hoursLeft: number;
    evaluationLink: string;
  }): EmailTemplate {
    return {
      subject: `Reminder: Evaluation for ${data.assignmentTitle} due in ${data.hoursLeft} hours`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Evaluation Due Soon!</h2>
          <p>Hello ${data.userName},</p>
          <p>This is a reminder that the evaluation phase is ending soon:</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #1f2937;">${data.assignmentTitle}</h3>
            <p><strong>Evaluation Due Date:</strong> ${data.evaluationDueDate}</p>
            <p><strong>Time Remaining:</strong> ${data.hoursLeft} hours</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.evaluationLink}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Complete Evaluations
            </a>
          </div>
          
          <p>Make sure to complete your evaluations and investments before the deadline!</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Startup Tycoon - Learn entrepreneurship through hands-on experience
          </p>
        </div>
      `,
      text: `
        Reminder: Evaluation for ${data.assignmentTitle} due in ${data.hoursLeft} hours
        
        Hello ${data.userName},
        
        This is a reminder that the evaluation phase is ending soon:
        
        Assignment: ${data.assignmentTitle}
        Evaluation Due Date: ${data.evaluationDueDate}
        Time Remaining: ${data.hoursLeft} hours
        
        Complete your evaluations: ${data.evaluationLink}
        
        Make sure to complete your evaluations and investments before the deadline!
        
        --
        Startup Tycoon - Learn entrepreneurship through hands-on experience
      `
    }
  }

  private getTeamInvitationTemplate(data: { 
    userName: string; 
    inviterName: string; 
    teamName: string; 
    courseName: string;
    invitationLink: string;
  }): EmailTemplate {
    return {
      subject: `Team Invitation: ${data.teamName} - ${data.courseName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Team Invitation</h2>
          <p>Hello ${data.userName},</p>
          <p><strong>${data.inviterName}</strong> has invited you to join their team:</p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="margin-top: 0; color: #1f2937;">${data.teamName}</h3>
            <p><strong>Course:</strong> ${data.courseName}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.invitationLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p>Click the button above to accept the invitation and join the team!</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Startup Tycoon - Learn entrepreneurship through hands-on experience
          </p>
        </div>
      `,
      text: `
        Team Invitation: ${data.teamName} - ${data.courseName}
        
        Hello ${data.userName},
        
        ${data.inviterName} has invited you to join their team:
        
        Team: ${data.teamName}
        Course: ${data.courseName}
        
        Accept the invitation: ${data.invitationLink}
        
        Click the link above to accept the invitation and join the team!
        
        --
        Startup Tycoon - Learn entrepreneurship through hands-on experience
      `
    }
  }

  private getGradePublishedTemplate(data: { 
    userName: string; 
    assignmentTitle: string; 
    courseName: string; 
    grade: number;
    feedback: string;
    gradesLink: string;
  }): EmailTemplate {
    return {
      subject: `Grades Published: ${data.assignmentTitle} - ${data.courseName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Grades Published!</h2>
          <p>Hello ${data.userName},</p>
          <p>Your grades for <strong>${data.assignmentTitle}</strong> in <strong>${data.courseName}</strong> have been published:</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="margin-top: 0; color: #1f2937;">${data.assignmentTitle}</h3>
            <p><strong>Your Grade:</strong> ${data.grade}%</p>
            ${data.feedback ? `<p><strong>Feedback:</strong> ${data.feedback}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.gradesLink}" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View All Grades
            </a>
          </div>
          
          <p>Great work! Keep up the excellent progress!</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Startup Tycoon - Learn entrepreneurship through hands-on experience
          </p>
        </div>
      `,
      text: `
        Grades Published: ${data.assignmentTitle} - ${data.courseName}
        
        Hello ${data.userName},
        
        Your grades for ${data.assignmentTitle} in ${data.courseName} have been published:
        
        Assignment: ${data.assignmentTitle}
        Your Grade: ${data.grade}%
        ${data.feedback ? `Feedback: ${data.feedback}` : ''}
        
        View all grades: ${data.gradesLink}
        
        Great work! Keep up the excellent progress!
        
        --
        Startup Tycoon - Learn entrepreneurship through hands-on experience
      `
    }
  }

  private getDefaultTemplate(data: Record<string, any>): EmailTemplate {
    return {
      subject: 'Notification from Startup Tycoon',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Notification</h2>
          <p>Hello,</p>
          <p>You have a new notification from Startup Tycoon.</p>
          <pre style="background-color: #f8fafc; padding: 15px; border-radius: 6px; overflow-x: auto;">
            ${JSON.stringify(data, null, 2)}
          </pre>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Startup Tycoon - Learn entrepreneurship through hands-on experience
          </p>
        </div>
      `,
      text: `
        Notification from Startup Tycoon
        
        Hello,
        
        You have a new notification from Startup Tycoon.
        
        ${JSON.stringify(data, null, 2)}
        
        --
        Startup Tycoon - Learn entrepreneurship through hands-on experience
      `
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()

// Helper functions for common notification scenarios
export async function sendForgotPasswordEmail(email: string, userName: string, resetToken: string) {
  // Use NEXT_PUBLIC_SITE_URL for production, fallback to NEXTAUTH_URL for development
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000';
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`
  
  return await notificationService.sendEmail({
    to: email,
    subject: 'Reset Your Password - Startup Tycoon',
    template: 'forgot-password',
    data: { userName, resetLink }
  })
}

export async function sendAssignmentStartedNotification(
  courseId: string, 
  assignmentId: string, 
  assignmentTitle: string
) {
  const supabase = getSupabaseClient()
  
  // Get course details
  const { data: course } = await supabase
    .from('courses')
    .select('name')
    .eq('id', courseId)
    .single()
  
  if (!course) return false
  
  // Get all enrolled students
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select(`
      users:user_id (
        email,
        name
      )
    `)
    .eq('course_id', courseId)
    .eq('role', 'student')
    .eq('status', 'active')
  
  if (!enrollments || enrollments.length === 0) return false
  
  const students = enrollments.flatMap(e => e.users).filter(Boolean)
  const emails = students.map(s => s.email)
  
  const dueDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000';
  const assignmentLink = `${baseUrl}/courses/${courseId}/assignments/${assignmentId}`
  
  return await notificationService.sendEmail({
    to: emails,
    subject: `New Assignment: ${assignmentTitle} - ${course.name}`,
    template: 'assignment-started',
    data: {
      name: 'Student', // Will be personalized in the template
      assignmentTitle,
      courseName: course.name,
      dueDate,
      assignmentLink
    }
  })
}

export async function sendEvaluationStartedNotification(
  courseId: string, 
  assignmentId: string, 
  assignmentTitle: string
) {
  const supabase = getSupabaseClient()
  
  // Get course and assignment details
  const { data: course } = await supabase
    .from('courses')
    .select('name')
    .eq('id', courseId)
    .single()
  
  const { data: assignment } = await supabase
    .from('assignments')
    .select('evaluation_due_date')
    .eq('id', assignmentId)
    .single()
  
  if (!course || !assignment) return false
  
  // Get all enrolled students
  const { data: enrollments } = await supabase
    .from('course_enrollments')
    .select(`
      users:user_id (
        email,
        name
      )
    `)
    .eq('course_id', courseId)
    .eq('role', 'student')
    .eq('status', 'active')
  
  if (!enrollments || enrollments.length === 0) return false
  
  const students = enrollments.flatMap(e => e.users).filter(Boolean)
  const emails = students.map(s => s.email)
  
  const evaluationDueDate = assignment.evaluation_due_date 
    ? new Date(assignment.evaluation_due_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'TBD'
  
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000';
  const evaluationLink = `${baseUrl}/courses/${courseId}/evaluations/${assignmentId}`
  
  return await notificationService.sendEmail({
    to: emails,
    subject: `Evaluation Phase Started: ${assignmentTitle} - ${course.name}`,
    template: 'evaluation-started',
    data: {
      name: 'Student', // Will be personalized in the template
      assignmentTitle,
      courseName: course.name,
      evaluationDueDate,
      evaluationLink
    }
  })
}
