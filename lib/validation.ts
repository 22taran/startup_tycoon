import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format')
export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters')
export const nameSchema = z.string().min(1, 'Name is required').max(255, 'Name too long')
export const uuidSchema = z.string().uuid('Invalid ID format')

// User validation schemas
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  role: z.enum(['admin', 'student']).default('student')
})

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  role: z.enum(['admin', 'student']).optional()
})

// Team validation schemas
export const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(255, 'Team name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  memberEmails: z.array(emailSchema).min(1, 'At least one member is required')
})

export const updateTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(255, 'Team name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  memberEmails: z.array(emailSchema).min(1, 'At least one member is required').optional()
})

// Assignment validation schemas
export const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  startDate: z.string().datetime('Invalid start date format'),
  dueDate: z.string().datetime('Invalid due date format'),
  documentUrl: z.string().url('Invalid document URL').optional()
})

export const updateAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  startDate: z.string().datetime('Invalid start date format').optional(),
  dueDate: z.string().datetime('Invalid due date format').optional(),
  documentUrl: z.string().url('Invalid document URL').optional(),
  isActive: z.boolean().optional()
})

// Submission validation schemas
export const createSubmissionSchema = z.object({
  assignmentId: uuidSchema,
  teamId: uuidSchema,
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  primaryLink: z.string().url('Invalid primary link URL'),
  backupLink: z.string().url('Invalid backup link URL').optional(),
  content: z.string().max(5000, 'Content too long').optional()
})

// Investment validation schemas
export const createInvestmentSchema = z.object({
  assignmentId: uuidSchema,
  teamId: uuidSchema,
  amount: z.number().min(0, 'Amount must be non-negative').max(50, 'Amount cannot exceed 50 tokens'),
  comments: z.string().max(500, 'Comments too long').optional(),
  isIncomplete: z.boolean().default(false)
})

// Validation middleware function
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> => {
    try {
      const body = await request.json()
      const validatedData = schema.parse(body)
      return { data: validatedData, error: null }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
        return {
          data: null,
          error: NextResponse.json(
            { success: false, error: 'Validation failed', details: errorMessage },
            { status: 400 }
          )
        }
      }
      return {
        data: null,
        error: NextResponse.json(
          { success: false, error: 'Invalid request body' },
          { status: 400 }
        )
      }
    }
  }
}

// Query parameter validation
export function validateQueryParams<T>(schema: z.ZodSchema<T>) {
  return (request: NextRequest): { data: T; error: null } | { data: null; error: NextResponse } => {
    try {
      const { searchParams } = new URL(request.url)
      const params = Object.fromEntries(searchParams.entries())
      const validatedData = schema.parse(params)
      return { data: validatedData, error: null }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
        return {
          data: null,
          error: NextResponse.json(
            { success: false, error: 'Invalid query parameters', details: errorMessage },
            { status: 400 }
          )
        }
      }
      return {
        data: null,
        error: NextResponse.json(
          { success: false, error: 'Invalid query parameters' },
          { status: 400 }
        )
      }
    }
  }
}

// Common query parameter schemas
export const assignmentIdQuerySchema = z.object({
  assignmentId: uuidSchema
})

export const paginationQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)).default('10')
})
