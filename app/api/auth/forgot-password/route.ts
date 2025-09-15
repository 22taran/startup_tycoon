import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/database'
import { sendForgotPasswordEmail } from '@/lib/notifications'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)
    
    const supabase = getSupabaseClient()
    
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single()
    
    if (userError || !user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      })
    }
    
    // Generate reset token (simple UUID for now, in production use crypto.randomBytes)
    const resetToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    
    // Store reset token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .upsert({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false
      })
    
    if (tokenError) {
      console.error('Error storing reset token:', tokenError)
      return NextResponse.json({
        success: false,
        error: 'Failed to process password reset request'
      }, { status: 500 })
    }
    
    // Send email
    const emailSent = await sendForgotPasswordEmail(user.email, user.name, resetToken)
    
    if (!emailSent) {
      console.error('Failed to send password reset email')
      return NextResponse.json({
        success: false,
        error: 'Failed to send password reset email'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    })
    
  } catch (error) {
    console.error('Error in forgot password:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: error.errors[0].message
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'An error occurred while processing your request'
    }, { status: 500 })
  }
}
