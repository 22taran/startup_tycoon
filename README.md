# Startup Tycoon - The Investor Game

A modern, game-like evaluation system for team projects where students pitch their ideas and act as investors. Built with Next.js 15, TypeScript, and Supabase as the database backend.

## 🎮 Game Overview

Startup Tycoon transforms traditional project evaluation into an engaging game where:
- Teams submit their work as "startup pitches"
- Students act as investors with 100 tokens per round
- Investment decisions directly impact team grades
- Investors earn interest on successful investments
- Bonus marks are available for top performers

## ✨ Features

- **Modern Tech Stack**: Next.js 15, TypeScript, Tailwind CSS, Shadcn/ui
- **Supabase Database**: PostgreSQL with real-time capabilities and Row Level Security
- **NextAuth.js**: Secure authentication with Google OAuth
- **Vercel Ready**: Optimized for Vercel serverless deployment
- **Real-time Updates**: Live dashboard with investment tracking
- **Admin Controls**: Complete game management system
- **Responsive Design**: Works on all devices
- **Performance Monitoring**: Built-in performance tracking and rate limiting

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd startup_tycoon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [Supabase](https://supabase.com)
   - Go to Settings > API to get your project URL and service role key
   - Run the database setup script:
   ```bash
   # Copy the SQL from scripts/setup-complete-database.sql
   # and run it in your Supabase SQL editor
   ```

4. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

5. **Set up Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-domain.vercel.app/api/auth/callback/google` (production)

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

The app uses Supabase (PostgreSQL) with the following main tables:

### Users
- User authentication and profile information
- Role-based access (admin/student)
- Team associations

### Teams
- Team information and member lists
- Created by and timestamps

### Assignments
- Assignment details, due dates, evaluation periods
- Active status and evaluation phases
- Document URLs and descriptions

### Submissions
- Team submissions for each assignment
- Primary and backup links
- Submission status tracking

### Evaluations
- Evaluation assignments linking teams to submissions
- Completion status tracking
- Team-based evaluation system

### Investments
- Investment amounts (10-50 tokens per team, max 3 teams)
- Investor comments and completion status
- Links to submissions and assignments

### Grades
- Calculated grades based on investment averages
- Grade bands: high (100%), median (80%), low (60%), incomplete (0%)
- Investment statistics and totals

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
- **High Investment** (≥40 tokens average): 100%
- **Median Investment** (25-39 tokens average): 80%
- **Low Investment** (<25 tokens average): 60%
- **Incomplete**: 0% (no investments or marked incomplete)

## 🎮 Game Workflow

### 1. Setup Phase (Admin)
- Create assignments with due dates
- Set up teams and add students
- Configure evaluation periods

### 2. Submission Phase (Students)
- Teams submit their work by the deadline
- Late submissions receive penalties
- Submissions are locked once evaluation begins

### 3. Evaluation Phase (Students as Investors)
- Students receive 100 tokens to invest
- Each student can invest 10-50 tokens in up to 3 teams
- Investment period typically runs Saturday to Monday
- Students can mark submissions as incomplete

### 4. Grading Phase (System)
- System calculates average investments per team
- Drops highest and lowest investments for fairness
- Assigns grades based on investment thresholds
- Generates final grade reports

### 5. Results Phase (All Users)
- Students can view their investment performance
- Teams can see their grades and feedback
- Admins can export reports and analytics

## 🛠️ Development

### Project Structure
```
├── app/                    # Next.js 15 app directory
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes (Vercel serverless functions)
│   ├── dashboard/         # Student dashboard
│   ├── profile/           # User profile pages
│   └── settings/          # User settings
├── components/            # React components
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   ├── admin-dashboard.tsx
│   ├── student-dashboard.tsx
│   └── ...               # Feature components
├── lib/                  # Utility functions
│   ├── database.ts       # Supabase database operations
│   ├── auth.ts           # NextAuth configuration
│   ├── validation.ts     # Zod schemas
│   └── utils.ts          # General utilities
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── scripts/              # Database setup and migration scripts
└── migrations/           # Database migration files
```

### Key Technologies
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Supabase**: PostgreSQL database with real-time features
- **NextAuth.js**: Authentication library with Google OAuth
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: High-quality UI components
- **React Query**: Data fetching and caching
- **Zod**: Schema validation
- **Vercel**: Deployment platform

## 🔌 API Endpoints

The application provides a comprehensive REST API:

### Authentication
- `POST /api/auth/signup` - User registration
- `GET /api/auth/[...nextauth]` - NextAuth.js endpoints

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/evaluations` - Get evaluation statistics

### Assignments
- `GET /api/assignments` - Get all assignments
- `POST /api/assignments` - Create new assignment
- `PUT /api/assignments/[id]` - Update assignment
- `DELETE /api/assignments/[id]` - Delete assignment
- `POST /api/assignments/[id]/distribute` - Distribute evaluation assignments
- `POST /api/assignments/[id]/trigger-evaluation` - Start evaluation phase
- `POST /api/assignments/[id]/calculate-grades` - Calculate final grades

### Teams
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create new team
- `PUT /api/teams/[id]` - Update team
- `DELETE /api/teams/[id]` - Delete team

### Submissions
- `GET /api/submissions` - Get all submissions
- `POST /api/submissions` - Create new submission
- `PUT /api/submissions/[id]` - Update submission

### Investments
- `GET /api/investments` - Get all investments
- `POST /api/investments` - Create new investment
- `GET /api/investments/tokens` - Get user's token balance

### Grades
- `GET /api/grades` - Get all grades
- `GET /api/grades?assignment_id=[id]` - Get grades for specific assignment

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
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
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

- [ ] Real-time notifications with Supabase real-time subscriptions
- [ ] Advanced analytics dashboard with charts and insights
- [ ] Mobile app (React Native)
- [ ] Integration with LMS systems (Canvas, Blackboard)
- [ ] Automated email notifications for deadlines
- [ ] Advanced reporting features with PDF exports
- [ ] Team collaboration tools
- [ ] Investment portfolio tracking
- [ ] Leaderboards and achievements

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
- Supabase team for the powerful database platform
- Vercel for seamless deployment
- Shadcn/ui for beautiful components
- The education community for inspiration

---

**Startup Tycoon** - Making education engaging, one investment at a time! 🚀
