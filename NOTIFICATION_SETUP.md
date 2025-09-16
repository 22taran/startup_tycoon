# Notification System Setup

This document explains how to set up the notification system for Startup Tycoon.

## Features

The notification system supports the following email notifications:

1. **Forgot Password** - Password reset emails
2. **Assignment Started** - When a new assignment is posted
3. **Evaluation Started** - When evaluation phase begins
4. **Assignment Due Reminder** - Reminder before assignment deadline
5. **Evaluation Due Reminder** - Reminder before evaluation deadline
6. **Team Invitation** - When invited to join a team
7. **Grade Published** - When grades are published

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Email Configuration
EMAIL_PROVIDER=console
# For Gmail SMTP
# EMAIL_PROVIDER=gmail
# GMAIL_USER=your-gmail@gmail.com
# GMAIL_APP_PASSWORD=your_app_password_here

# From Email Address
FROM_EMAIL=noreply@startup-tycoon.com
```

## Email Providers

### 1. Console Mode (Default)
- No setup required
- Emails are logged to console
- Perfect for development
- **Automatic fallback** if Gmail fails

### 2. Gmail SMTP
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Set `EMAIL_PROVIDER=gmail`, `GMAIL_USER=your-email@gmail.com`, and `GMAIL_APP_PASSWORD=your_app_password`

For detailed Gmail setup instructions, see [GMAIL_SMTP_SETUP.md](./GMAIL_SMTP_SETUP.md)

## Database Setup

Run the password reset migration:

```sql
-- Run this in your Supabase SQL editor
-- File: scripts/add-password-reset.sql
```

## Usage

### Forgot Password
Users can click "Forgot your password?" on the sign-in form to request a password reset.

### Triggering Notifications
Admins and instructors can trigger notifications via the API:

```javascript
// Example: Send assignment started notification
fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'assignment-started',
    courseId: 'course-id',
    assignmentId: 'assignment-id',
    data: { assignmentTitle: 'Assignment 1' }
  })
})
```

### Automatic Notifications
The system can be extended to automatically trigger notifications when:
- Assignments are created
- Evaluation phases start
- Due dates approach
- Grades are published

## Email Templates

All email templates are defined in `lib/notifications.ts` and include:
- Professional HTML and text versions
- Responsive design
- Branded styling
- Clear call-to-action buttons

## Security

- Password reset tokens expire in 1 hour
- Tokens are single-use only
- Email addresses are validated
- Rate limiting can be added for production

## Graceful Fallbacks

The notification system includes automatic fallbacks:

- **Gmail connection issues**: If Gmail SMTP fails, falls back to console mode
- **Invalid credentials**: If Gmail credentials are wrong, falls back to console mode
- **Network issues**: If Gmail service is down, falls back to console mode
- **Configuration errors**: If environment variables are missing, falls back to console mode

This ensures your application never crashes due to email issues.

## Testing

To test the notification system:

1. Set `EMAIL_PROVIDER=console` for development
2. Check console logs for email content
3. Use the forgot password flow to test email sending
4. Trigger notifications via the API endpoints
5. Test fallback behavior by setting invalid credentials



