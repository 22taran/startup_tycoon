// User and Authentication Types
export interface User {
  id: string
  email: string
  name: string
  image?: string
  role: 'student' | 'admin'
  teamId?: string
  createdAt: Date
  updatedAt: Date
}

// Course Types
export interface Course {
  id: string
  name: string
  description?: string
  code: string // e.g., "CS101", "BUS200"
  semester: string // e.g., "Fall 2024", "Spring 2025"
  year: number
  instructorId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CourseEnrollment {
  id: string
  courseId: string
  userId: string
  role: 'student' | 'instructor' | 'ta'
  enrolledAt: Date
  status: 'active' | 'inactive'
}

// Team Types
export interface Team {
  id: string
  name: string
  members: string[] // User IDs
  description?: string
  courseId: string // Link teams to specific courses
  createdAt: Date
  updatedAt: Date
}

// Assignment Types
export interface Assignment {
  id: string
  title: string
  description: string
  startDate: Date
  dueDate: Date
  documentUrl?: string
  isActive: boolean
  evaluationStartDate?: Date
  evaluationDueDate?: Date
  isEvaluationActive: boolean
  courseId: string // Link assignments to specific courses
  createdAt: Date
  updatedAt: Date
}

// Submission Types
export interface Submission {
  id: string
  assignmentId: string
  teamId: string
  title: string
  description?: string
  content: string
  primaryLink?: string
  backupLink?: string
  fileUrl?: string
  attachments?: string[]
  status: 'draft' | 'submitted' | 'evaluated'
  submittedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Evaluation Types
export interface Evaluation {
  id: string
  assignmentId: string
  evaluatorId?: string // User ID of the evaluator (optional for backward compatibility)
  evaluatorTeamId?: string // Team ID of the evaluator team (new field)
  submissionId: string
  teamId: string // Team being evaluated
  isComplete: boolean
  createdAt: Date
  updatedAt: Date
}

// Investment Types
export interface Investment {
  id: string
  submissionId: string
  investorId: string
  teamId: string
  assignmentId: string
  amount: number // 0-50 tokens
  isIncomplete: boolean
  comments?: string
  createdAt: Date
  updatedAt: Date
}

// Grade Types
export interface Grade {
  id: string
  assignmentId: string
  teamId: string
  submissionId: string
  averageInvestment: number
  grade: 'high' | 'median' | 'low' | 'incomplete'
  percentage: number // 100%, 80%, 60%, or 0%
  totalInvestments: number
  createdAt: Date
  updatedAt: Date
}

// Investor Interest Types
export interface InvestorInterest {
  id: string
  investorId: string
  assignmentId: string
  teamId: string
  investmentAmount: number
  grade: 'high' | 'median' | 'low' | 'incomplete'
  interestEarned: number
  createdAt: Date
  updatedAt: Date
}

// Game Configuration Types
export interface GameConfig {
  id: string
  totalTokens: number
  minInvestment: number
  maxInvestment: number
  maxTeamsPerEvaluator: number
  highInvestmentThreshold: number
  medianInvestmentThreshold: number
  lowInvestmentThreshold: number
  bonusMarksCap: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Database row types (raw from Supabase)
export interface UserRow {
  id: string
  email: string
  name: string
  image?: string
  role: 'student' | 'admin'
  team_id?: string
  created_at: string
  updated_at: string
}

export interface TeamRow {
  id: string
  name: string
  description?: string
  members: string[]
  course_id: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface AssignmentRow {
  id: string
  title: string
  description?: string
  start_date: string
  due_date: string
  document_url?: string
  is_active: boolean
  evaluation_start_date?: string
  evaluation_due_date?: string
  is_evaluation_active?: boolean
  course_id: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface SubmissionRow {
  id: string
  assignment_id: string
  team_id: string
  title?: string
  description?: string
  content?: string
  primary_link?: string
  backup_link?: string
  file_url?: string
  attachments?: string[]
  status: 'draft' | 'submitted' | 'evaluated'
  submitted_at?: string
  created_at: string
  updated_at: string
}

export interface InvestmentRow {
  id: string
  submission_id: string
  investor_id: string
  team_id: string
  assignment_id: string
  amount: number
  is_incomplete: boolean
  comments?: string
  created_at: string
  updated_at: string
}

export interface GradeRow {
  id: string
  assignment_id: string
  team_id: string
  submission_id: string
  average_investment?: number
  grade?: 'high' | 'median' | 'low' | 'incomplete'
  percentage?: number
  total_investments: number
  created_at: string
  updated_at: string
}

export interface EvaluationRow {
  id: string
  assignment_id: string
  evaluator_id?: string
  evaluator_team_id?: string
  submission_id: string
  team_id: string
  is_complete: boolean
  created_at: string
  updated_at: string
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface ValidationError {
  success: false
  error: string
  details?: string
}

// Dashboard Data Types
export interface DashboardStats {
  totalTeams: number
  totalAssignments: number
  activeAssignments: number
  totalSubmissions: number
  pendingEvaluations: number
  completedEvaluations: number
}

export interface StudentDashboard {
  user: User
  team?: Team
  assignments: Assignment[]
  submissions: Submission[]
  evaluations: Evaluation[]
  investments: Investment[]
  grades: Grade[]
  investorInterests: InvestorInterest[]
  stats: {
    totalInvestments: number
    totalInterestEarned: number
    averageGrade: number
    pendingEvaluations: number
  }
}

export interface AdminDashboard {
  stats: DashboardStats
  teams: Team[]
  assignments: Assignment[]
  submissions: Submission[]
  evaluations: Evaluation[]
  investments: Investment[]
  grades: Grade[]
  recentActivity: ActivityLog[]
}

export interface ActivityLog {
  id: string
  type: 'submission' | 'evaluation' | 'investment' | 'grade'
  description: string
  userId: string
  teamId?: string
  assignmentId?: string
  courseId?: string
  timestamp: Date
}

// Course-related row types
export interface CourseRow {
  id: string
  name: string
  description?: string
  code: string
  semester: string
  year: number
  instructor_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CourseEnrollmentRow {
  id: string
  course_id: string
  user_id: string
  role: 'student' | 'instructor' | 'ta'
  enrolled_at: string
  status: 'active' | 'inactive'
}

// Form Types
export interface SubmissionForm {
  title: string
  description: string
  file?: File
}

export interface InvestmentForm {
  amount: number
  isIncomplete: boolean
  comments?: string
}

export interface TeamForm {
  name: string
  description?: string
  memberEmails: string[]
}

export interface AssignmentForm {
  title: string
  description: string
  startDate: string
  dueDate: string
  document?: File
  courseId: string
}

export interface CourseForm {
  name: string
  description?: string
  code: string
  semester: string
  year: number
}

export interface EnrollmentForm {
  courseId: string
  userEmails: string[]
  role: 'student' | 'instructor' | 'ta'
}

// Excel Export Types
export interface ExcelExportData {
  teams: Team[]
  assignments: Assignment[]
  submissions: Submission[]
  evaluations: Evaluation[]
  investments: Investment[]
  grades: Grade[]
  investorInterests: InvestorInterest[]
}
