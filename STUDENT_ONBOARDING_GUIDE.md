# 🎓 Student Onboarding Guide

This guide helps you efficiently onboard 80 students to your Startup Tycoon platform.

## 📋 Prerequisites

1. **Environment Setup**: Ensure your `.env.local` file has the correct Supabase credentials
2. **Course Created**: Create at least one course in the admin dashboard
3. **Signup Enabled**: Make sure signup is enabled in admin settings (or temporarily enable it)

## 🚀 Quick Start (Recommended)

### Option 1: Quick Script (Easiest)

```bash
node scripts/quick-student-onboarding.js
```

This interactive script will:
- Show available courses
- Ask how many students to create
- Create students with default credentials
- Enroll them in the selected course

**Default credentials:**
- Email: `student1@university.edu`, `student2@university.edu`, etc.
- Password: `Student123!`

### Option 2: Bulk Script (Advanced)

1. **Prepare your student data** (optional):
   ```bash
   # Copy the template
   cp students-template.csv students.csv
   
   # Edit students.csv with your actual student data
   # Format: username,firstname,lastname,email,idnumber,course1,role1
   ```

2. **Run the bulk script**:
   ```bash
   node scripts/bulk-student-onboarding.js
   ```

## 📊 What the Scripts Do

### ✅ User Creation
- Creates student accounts with hashed passwords
- Checks for existing users to avoid duplicates
- Sets role as 'student'

### ✅ Course Enrollment
- Enrolls students in the selected course
- Sets enrollment status as 'active'
- Handles existing enrollments gracefully

### ✅ Batch Processing
- Processes students in batches to avoid rate limits
- Provides progress updates
- Generates detailed reports

## 📁 Output Files

### CSV Report
The bulk script generates a detailed CSV report with:
- Student names (firstname + lastname)
- Email addresses
- Login credentials
- Student IDs and usernames
- Creation status
- Error messages (if any)

### Console Output
Real-time progress updates showing:
- Successfully created students
- Failed creations with error reasons
- Already existing users

## 🔧 Customization

### Change Default Password
Edit the `DEFAULT_PASSWORD` variable in the scripts:
```javascript
const DEFAULT_PASSWORD = 'YourCustomPassword123!';
```

### Change Email Domain
Update the email generation pattern:
```javascript
const email = `student${i}@yourdomain.edu`;
```

### Add More Student Data
Modify the `generateStudentData()` function to include:
- Student IDs
- Additional profile information
- Custom naming patterns

## 🛠️ Troubleshooting

### Common Issues

1. **"No courses found"**
   - Create a course in the admin dashboard first
   - Ensure you're logged in as an admin

2. **"User already exists"**
   - Normal behavior - script skips existing users
   - Check the report for details

3. **"Enrollment failed"**
   - User created but course enrollment failed
   - Check course ID and permissions

4. **Rate limit errors**
   - Script includes delays between requests
   - Reduce `BATCH_SIZE` if needed

### Database Issues

1. **Missing tables**
   - Run the platform settings migration
   - Ensure all required tables exist

2. **Permission errors**
   - Check Supabase RLS policies
   - Verify service role key permissions

## 📧 Student Communication

### Email Template
Send this to your students:

```
Subject: Welcome to Startup Tycoon - Your Login Credentials

Dear [Student Name],

Welcome to Startup Tycoon! Your account has been created.

Login Details:
- URL: https://your-domain.vercel.app
- Email: [student email]
- Password: Student123!

Important:
1. Please login and change your password immediately
2. Complete your profile setup
3. Join the course: [Course Name]

If you have any issues, please contact [your email].

Best regards,
[Your Name]
```

## 🔒 Security Notes

1. **Default Password**: Students should change their password on first login
2. **Temporary Access**: Consider disabling signup after onboarding
3. **Data Privacy**: Ensure student data is handled according to privacy laws
4. **Access Control**: Verify only authorized users can access the platform

## 📈 Post-Onboarding

1. **Verify Enrollments**: Check the admin dashboard
2. **Test Login**: Try logging in with a few test accounts
3. **Send Credentials**: Distribute login information to students
4. **Monitor Usage**: Check for any issues or questions

## 🆘 Support

If you encounter issues:
1. Check the console output for error messages
2. Verify your Supabase connection
3. Ensure all required environment variables are set
4. Check the generated CSV report for detailed results

---

**Happy Onboarding! 🎉**
