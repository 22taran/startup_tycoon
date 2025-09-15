# Deployment Troubleshooting Guide

## JavaScript Bundle Error: "Unexpected token '<'"

This error occurs when the browser tries to load a JavaScript file but receives an HTML response instead. This is typically a server configuration issue.

### Common Causes

1. **Static files not being served correctly**
2. **Missing environment variables**
3. **Incorrect base URL configuration**
4. **Build output not deployed properly**

### Solutions

#### 1. Check Server Configuration

Make sure your server is configured to serve static files from the `/_next/static/` directory.

**For Nginx:**
```nginx
location /_next/static/ {
    alias /path/to/your/app/.next/static/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location /_next/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

**For Apache:**
```apache
<Directory "/path/to/your/app/.next/static">
    Options -Indexes
    AllowOverride None
    Require all granted
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
</Directory>
```

#### 2. Set Environment Variables

Create a `.env.production` file with:

```bash
# Base URL for your deployed application
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email (if using Gmail)
EMAIL_PROVIDER=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
FROM_EMAIL=your-email@gmail.com

# JWT Secret
JWT_SECRET=your_strong_jwt_secret_here
```

#### 3. Verify Build Output

Make sure the `.next` folder is properly deployed:

```bash
# Build the application
npm run build

# Check if static files exist
ls -la .next/static/chunks/
ls -la .next/static/css/

# The main JavaScript file should exist
ls -la .next/static/chunks/main-app.js
```

#### 4. Test Locally

Test the production build locally:

```bash
npm run build
npm start
```

Then visit `http://localhost:3000/reset-password?token=test` to see if it works.

#### 5. Check Network Tab

In your browser's developer tools:
1. Go to Network tab
2. Reload the reset password page
3. Look for any failed requests (red status codes)
4. Check if `main-*.js` files are returning HTML instead of JavaScript

#### 6. Common Deployment Platforms

**Vercel:**
- Make sure `NEXTAUTH_URL` is set in environment variables
- No additional configuration needed

**Netlify:**
- Add `_redirects` file in `public/` folder:
```
/_next/static/* /_next/static/:splat 200
```

**Docker:**
- Make sure to copy the entire `.next` folder
- Set proper file permissions

**Traditional VPS:**
- Ensure nginx/apache is configured to serve static files
- Check file permissions (should be readable by web server)

### Debug Steps

1. **Check the actual URL being requested:**
   - Open browser dev tools
   - Look at the Network tab
   - Find the failed JavaScript request
   - Check what URL it's trying to load

2. **Test the JavaScript file directly:**
   - Try accessing `https://yourdomain.com/_next/static/chunks/main-app.js` directly
   - If it returns HTML, the server configuration is wrong
   - If it returns 404, the build output wasn't deployed

3. **Check server logs:**
   - Look for any errors in your server logs
   - Check if the static files are being served correctly

### Quick Fix

If you're using a reverse proxy (nginx/apache), make sure it's not intercepting requests to `/_next/static/` and returning a 404 or error page.

The key is ensuring that requests to `/_next/static/*` are served directly from the file system, not proxied to the Next.js application.
