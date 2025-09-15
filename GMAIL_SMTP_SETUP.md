# Gmail SMTP Setup Guide

This guide explains how to set up Gmail SMTP for sending emails from your Startup Tycoon application. Gmail SMTP is the recommended email provider for this application.

## Prerequisites

- A Gmail account
- 2-Factor Authentication enabled on your Gmail account

## Step-by-Step Setup

### 1. Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **2-Step Verification**
3. Follow the setup process to enable 2FA

### 2. Generate App Password

1. Go back to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **App passwords**
3. You may need to sign in again
4. Select **Mail** as the app
5. Select **Other (Custom name)** as the device
6. Enter "Startup Tycoon" as the name
7. Click **Generate**
8. **Copy the 16-character password** (you won't see it again!)

### 3. Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Gmail SMTP Configuration
EMAIL_PROVIDER=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
FROM_EMAIL=your-email@gmail.com
```

### 4. Install Dependencies

```bash
npm install nodemailer @types/nodemailer
```

## Important Notes

### Security
- **Never use your regular Gmail password** - always use App Passwords
- **Keep your App Password secure** - treat it like a regular password
- **App Passwords are account-specific** - each Gmail account needs its own

### Gmail Limits
- **Daily limit**: 500 emails per day for free accounts
- **Rate limit**: ~100 emails per hour
- **Recipients per email**: Up to 500 recipients per email

### Troubleshooting

#### "Invalid credentials" error
- Make sure 2FA is enabled
- Verify you're using the App Password, not your regular password
- Check that the App Password is exactly 16 characters

#### "Less secure app access" error
- This shouldn't happen with App Passwords
- If it does, make sure you're using the App Password correctly

#### "Connection timeout" error
- Check your internet connection
- Verify Gmail SMTP settings (smtp.gmail.com:587)

## Testing

To test Gmail SMTP:

1. Set `EMAIL_PROVIDER=gmail` in your environment
2. Configure your Gmail credentials
3. Try the forgot password flow
4. Check your Gmail sent folder

## Production Considerations

### For Production Use
- Consider using a dedicated email service (Resend, SendGrid) for better deliverability
- Gmail is great for development and small-scale applications
- For high-volume applications, use a professional email service

### Alternative: Gmail API
For more advanced features, you can use the Gmail API instead of SMTP:
- Higher sending limits
- Better tracking and analytics
- More complex setup but more powerful

## Example Usage

Once configured, the notification service will automatically use Gmail SMTP:

```javascript
// This will now send via Gmail SMTP
await notificationService.sendEmail({
  to: 'student@example.com',
  subject: 'Welcome to Startup Tycoon!',
  template: 'assignment-started',
  data: { name: 'John', assignmentTitle: 'Assignment 1' }
})
```

## Support

If you encounter issues:
1. Double-check your App Password
2. Verify 2FA is enabled
3. Check the console logs for detailed error messages
4. Test with a simple email first
