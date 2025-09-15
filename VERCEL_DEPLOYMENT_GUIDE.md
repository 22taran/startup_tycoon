# Vercel Deployment Guide for Startup Tycoon

## Environment Variables Setup

Set these environment variables in your Vercel dashboard:

### Required Environment Variables

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Authentication (NEXTAUTH_URL is automatically set by Vercel)
NEXTAUTH_SECRET=your_nextauth_secret

# Email Configuration (if using Gmail)
EMAIL_PROVIDER=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
FROM_EMAIL=your-email@gmail.com

# JWT Secret for Password Reset
JWT_SECRET=your_strong_jwt_secret_here
```

### Important Notes

1. **NEXTAUTH_URL**: ✅ **Automatically set by Vercel** - No need to set this manually
2. **NEXTAUTH_SECRET**: Generate a random string for this
3. **JWT_SECRET**: Generate a strong random string for password reset tokens

## Deployment Steps

1. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect it's a Next.js app

2. **Set Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all the variables listed above
   - Make sure to set them for Production, Preview, and Development

3. **Deploy**:
   - Vercel will automatically deploy when you push to your main branch
   - Or you can trigger a manual deployment

## Common Issues and Solutions

### Issue: "Unexpected token '<'" Error

This usually means JavaScript files are not being served correctly.

**Solution**: 
- ✅ **NEXTAUTH_URL is automatically set by Vercel** - Don't set it manually
- Don't use `basePath` or `assetPrefix` unless deploying to a subdirectory
- Remove any custom `vercel.json` file (Vercel handles Next.js automatically)
- Check that all required environment variables are set (except NEXTAUTH_URL)

### Issue: Reset Password Links Not Working

**Solution**:
- ✅ **NEXTAUTH_URL is automatically set by Vercel** - No manual configuration needed
- Check that the database migration has been run
- Verify email configuration is working

### Issue: Database Connection Errors

**Solution**:
- Double-check `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Make sure the Supabase project is active
- Run the database migrations in Supabase

## Database Setup

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add password column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
```

## Testing the Deployment

1. **Test Basic Functionality**:
   - Visit your Vercel URL
   - Try signing up a new user
   - Test the forgot password flow

2. **Test Reset Password**:
   - Go to the sign-in page
   - Click "Forgot your password?"
   - Enter an email address
   - Check your email for the reset link
   - Click the reset link and test password reset

3. **Check Console for Errors**:
   - Open browser dev tools
   - Look for any JavaScript errors
   - Check the Network tab for failed requests

## Troubleshooting

If you encounter issues:

1. **Check Vercel Function Logs**:
   - Go to your Vercel dashboard
   - Click on your project
   - Go to Functions tab
   - Check for any error logs

2. **Verify Environment Variables**:
   - Make sure all required variables are set
   - Check that they don't have extra spaces or quotes

3. **Test Locally in Production Mode**:
   ```bash
   npm run build
   npm start
   ```

4. **Check Database Connection**:
   - Verify Supabase is accessible
   - Check that all tables exist
   - Test API endpoints directly

## Support

If you continue to have issues:
- Check the Vercel documentation: https://vercel.com/docs
- Check Next.js documentation: https://nextjs.org/docs
- Review the Supabase documentation: https://supabase.com/docs
