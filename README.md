# Startup Tycoon - The Investor Game

A modern, game-like evaluation system for team projects where students pitch their ideas and act as investors. Built with Next.js 14, TypeScript, and Excel as the database backend.

## 🎮 Game Overview

Startup Tycoon transforms traditional project evaluation into an engaging game where:
- Teams submit their work as "startup pitches"
- Students act as investors with 100 tokens per round
- Investment decisions directly impact team grades
- Investors earn interest on successful investments
- Bonus marks are available for top performers

## ✨ Features

- **Modern Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **Excel Database**: Uses Excel files as the primary data storage
- **Vercel Ready**: Optimized for Vercel serverless deployment
- **Google OAuth**: Secure authentication with Google accounts
- **Real-time Updates**: Live dashboard with investment tracking
- **Admin Controls**: Complete game management system
- **Responsive Design**: Works on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd startup-tycoon-investor-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.local.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. **Set up Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-domain.vercel.app/api/auth/callback/google` (production)

5. **Create Excel database files**
   ```bash
   mkdir -p public/database
   ```
   
   Create empty Excel files in `public/database/`:
   - `teams.xlsx`
   - `assignments.xlsx`
   - `submissions.xlsx`
   - `evaluations.xlsx`
   - `investments.xlsx`
   - `grades.xlsx`
   - `investor-interests.xlsx`

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

The app uses Excel files as the database. Each file contains specific data:

### Teams (`teams.xlsx`)
- Team ID, name, members, description
- Creation and update timestamps

### Assignments (`assignments.xlsx`)
- Assignment details, due dates, evaluation periods
- Week numbers and active status

### Submissions (`submissions.xlsx`)
- Team submissions for each assignment
- File URLs and submission status

### Evaluations (`evaluations.xlsx`)
- Evaluation assignments and completion status
- Links evaluators to teams

### Investments (`investments.xlsx`)
- Investment amounts and comments
- Links to evaluations and assignments

### Grades (`grades.xlsx`)
- Calculated grades based on investments
- Grade bands and percentages

## 🎯 Game Rules

### For Students (Creators)
1. **Submit Work**: Submit assignments by Wednesday deadlines
2. **Late Penalty**: 50% deduction for late submissions
3. **No Late Submissions**: Once evaluation starts, no submissions allowed

### For Students (Investors)
1. **Token Allocation**: 100 tokens per round
2. **Investment Limits**: 10-50 tokens per team, max 3 teams
3. **Evaluation Period**: Saturday to Monday
4. **Interest Earnings**: Earn interest on successful investments

### Grading System
- **High Investment** (top 1/3): 100%
- **Median Investment** (middle 1/3): 80%
- **Low Investment** (bottom 1/3): 60%
- **Incomplete**: 0%

## 🛠️ Development

### Project Structure
```
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes (Vercel serverless functions)
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── ...               # Feature components
├── lib/                  # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── excel-utils.ts    # Excel file operations
│   └── grading.ts        # Grading algorithms
├── types/                # TypeScript type definitions
└── public/               # Static files
    └── database/         # Excel database files
```

### Key Technologies
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: High-quality UI components
- **NextAuth.js**: Authentication library
- **SheetJS**: Excel file processing
- **Vercel**: Deployment platform

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

2. **Set Environment Variables**
   In Vercel dashboard, add:
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Alternative: Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 📈 Future Enhancements

- [ ] Google Sheets API integration
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Integration with LMS systems
- [ ] Automated email notifications
- [ ] Advanced reporting features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🎉 Acknowledgments

- Next.js team for the amazing framework
- Vercel for seamless deployment
- Shadcn/ui for beautiful components
- The education community for inspiration

---

**Startup Tycoon** - Making education engaging, one investment at a time! 🚀
