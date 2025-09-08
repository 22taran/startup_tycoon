import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Assignment, Team, Submission, Investment, Grade, User } from '@/types'

// Base API functions
const apiCall = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Query keys
export const queryKeys = {
  assignments: ['assignments'] as const,
  assignment: (id: string) => ['assignments', id] as const,
  teams: ['teams'] as const,
  team: (id: string) => ['teams', id] as const,
  submissions: ['submissions'] as const,
  submission: (id: string) => ['submissions', id] as const,
  investments: ['investments'] as const,
  investment: (id: string) => ['investments', id] as const,
  grades: ['grades'] as const,
  grade: (id: string) => ['grades', id] as const,
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
}

// Assignment hooks
export function useAssignments() {
  return useQuery({
    queryKey: queryKeys.assignments,
    queryFn: () => apiCall('/api/assignments'),
    select: (data) => data.data as Assignment[],
    staleTime: 5 * 60 * 1000, // 5 minutes for assignments
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  })
}

export function useAssignment(id: string) {
  return useQuery({
    queryKey: queryKeys.assignment(id),
    queryFn: () => apiCall(`/api/assignments/${id}`),
    select: (data) => data.data as Assignment,
    enabled: !!id,
  })
}

export function useCreateAssignment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (assignment: Partial<Assignment>) => 
      apiCall('/api/assignments', {
        method: 'POST',
        body: JSON.stringify(assignment),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assignments })
    },
  })
}

// Team hooks
export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams,
    queryFn: () => apiCall('/api/teams'),
    select: (data) => data.data as Team[],
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (team: Partial<Team>) => 
      apiCall('/api/teams', {
        method: 'POST',
        body: JSON.stringify(team),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams })
    },
  })
}

// Submission hooks
export function useSubmissions() {
  return useQuery({
    queryKey: queryKeys.submissions,
    queryFn: () => apiCall('/api/submissions'),
    select: (data) => data.data as Submission[],
  })
}

export function useCreateSubmission() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (submission: Partial<Submission>) => 
      apiCall('/api/submissions', {
        method: 'POST',
        body: JSON.stringify(submission),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.submissions })
    },
  })
}

// Investment hooks
export function useInvestments() {
  return useQuery({
    queryKey: queryKeys.investments,
    queryFn: () => apiCall('/api/investments'),
    select: (data) => data.data as Investment[],
  })
}

export function useCreateInvestment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (investment: Partial<Investment>) => 
      apiCall('/api/investments', {
        method: 'POST',
        body: JSON.stringify(investment),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments })
    },
  })
}

// Grade hooks
export function useGrades(assignmentId?: string) {
  return useQuery({
    queryKey: assignmentId ? [...queryKeys.grades, assignmentId] : queryKeys.grades,
    queryFn: () => apiCall(assignmentId ? `/api/grades?assignmentId=${assignmentId}` : '/api/grades'),
    select: (data) => data.data as Grade[],
  })
}

export function useCalculateGrades() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (assignmentId: string) => 
      apiCall(`/api/assignments/${assignmentId}/calculate-grades`, {
        method: 'POST',
      }),
    onSuccess: (_, assignmentId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.grades })
      queryClient.invalidateQueries({ queryKey: queryKeys.assignment(assignmentId) })
    },
  })
}

// User hooks
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => apiCall('/api/users'),
    select: (data) => data.data as User[],
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (user: Partial<User>) => 
      apiCall('/api/users', {
        method: 'POST',
        body: JSON.stringify(user),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}
