#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables...');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ .env.local already exists');
  return;
}

// Create basic .env.local
const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://auyspomblqdbhragxemu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1eXNwb21ibHFkYmhyYWd4ZW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU1NjQ4MzMsImV4cCI6MjA0MTE0MDgzM30.placeholder
SUPABASE_SERVICE_ROLE_KEY=placeholder

# NextAuth Configuration
AUTH_SECRET=your-secret-key-here-please-change-in-production
NEXTAUTH_URL=http://localhost:3000
`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local with basic configuration');
  console.log('⚠️  Please update the Supabase keys with your actual values');
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
  process.exit(1);
}
