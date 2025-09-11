'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { Eye, EyeOff, AlertCircle, X, Mail, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'signin' | 'signup'
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'signin' }: AuthModalProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loginStep, setLoginStep] = useState<'idle' | 'authenticating' | 'redirecting'>('idle')

  // Sign up form state
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'student' as 'admin' | 'student'
  })

  // Sign in form state
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  })

  // Close modal when user is authenticated
  useEffect(() => {
    if (session?.user && isOpen) {
      onClose()
    }
  }, [session, isOpen, onClose])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setMessage('')
      setErrors({})
      setSignUpData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'student'
      })
      setSignInData({
        email: '',
        password: ''
      })
      setLoginStep('idle')
    }
  }, [isOpen])

  const validateSignUpForm = useCallback(() => {
    const newErrors: Record<string, string[]> = {}

    // Email validation
    if (!signUpData.email) {
      newErrors.email = ['Email is required']
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpData.email)) {
      newErrors.email = ['Please enter a valid email address']
    }

    // Password validation
    if (!signUpData.password) {
      newErrors.password = ['Password is required']
    } else if (signUpData.password.length < 6) {
      newErrors.password = ['Password must be at least 6 characters long']
    }

    // Confirm password validation
    if (!signUpData.confirmPassword) {
      newErrors.confirmPassword = ['Please confirm your password']
    } else if (signUpData.password !== signUpData.confirmPassword) {
      newErrors.confirmPassword = ['Passwords do not match']
    }

    // Name validation
    if (!signUpData.name) {
      newErrors.name = ['Name is required']
    } else if (signUpData.name.length < 2) {
      newErrors.name = ['Name must be at least 2 characters long']
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [signUpData])

  const validateSignInForm = useCallback(() => {
    const newErrors: Record<string, string[]> = {}

    if (!signInData.email) {
      newErrors.email = ['Email is required']
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signInData.email)) {
      newErrors.email = ['Please enter a valid email address']
    }

    if (!signInData.password) {
      newErrors.password = ['Password is required']
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [signInData])

  const handleSignUp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setErrors({})

    if (!validateSignUpForm()) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: signUpData.name,
          email: signUpData.email,
          password: signUpData.password,
          role: signUpData.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      setMessage('Account created successfully! Please sign in to continue.')
      setSignUpData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'student'
      })
      setActiveTab('signin')
    } catch (error: any) {
      setMessage(error.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [signUpData, validateSignUpForm])

  const handleSignIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setErrors({})
    setLoginStep('authenticating')

    if (!validateSignInForm()) {
      setLoading(false)
      setLoginStep('idle')
      return
    }

    try {
      const result = await signIn('credentials', {
        email: signInData.email,
        password: signInData.password,
        redirect: false,
      })

      if (result?.error) {
        setMessage('Invalid credentials. Please try again.')
        setLoginStep('idle')
      } else if (result?.ok) {
        setLoginStep('redirecting')
        setMessage('Sign in successful! Redirecting...')
        
        // Force a page refresh to ensure session is updated
        window.location.href = '/dashboard'
      }
    } catch (error: any) {
      setMessage('An error occurred. Please try again.')
      setLoginStep('idle')
    } finally {
      setLoading(false)
    }
  }, [signInData, validateSignInForm, router, onClose])

  // Memoize form validation
  const isSignInFormValid = useMemo(() => {
    return signInData.email.length > 0 && signInData.password.length >= 6
  }, [signInData])

  const isSignUpFormValid = useMemo(() => {
    return signUpData.email.length > 0 && 
           signUpData.password.length >= 6 && 
           signUpData.confirmPassword === signUpData.password &&
           signUpData.name.length >= 2
  }, [signUpData])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Startup Tycoon</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>Welcome back! Please sign in to your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="Enter your email"
                          value={signInData.email}
                          onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                      {errors.email && (
                        <div className="flex items-center gap-1 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          {errors.email[0]}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="signin-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={signInData.password}
                          onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                          className="pl-10 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {errors.password && (
                        <div className="flex items-center gap-1 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          {errors.password[0]}
                        </div>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={loading || !isSignInFormValid}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {loginStep === 'authenticating' ? 'Authenticating...' : 'Redirecting...'}
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Join Startup Tycoon to start your investment journey.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Enter your full name"
                          value={signUpData.name}
                          onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                      {errors.name && (
                        <div className="flex items-center gap-1 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          {errors.name[0]}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                      {errors.email && (
                        <div className="flex items-center gap-1 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          {errors.email[0]}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-role">Role</Label>
                      <Select value={signUpData.role} onValueChange={(value: 'admin' | 'student') => setSignUpData({ ...signUpData, role: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          value={signUpData.password}
                          onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                          className="pl-10 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {errors.password && (
                        <div className="flex items-center gap-1 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          {errors.password[0]}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="signup-confirm-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                      {errors.confirmPassword && (
                        <div className="flex items-center gap-1 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          {errors.confirmPassword[0]}
                        </div>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={loading || !isSignUpFormValid}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Message Display */}
          {message && (
            <Alert className={`mt-4 ${
              message.includes('successfully') 
                ? 'border-green-200 bg-green-50 text-green-700' 
                : 'border-red-200 bg-red-50 text-red-700'
            }`}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}
