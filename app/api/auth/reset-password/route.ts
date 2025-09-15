import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/database'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)
    
    const supabase = getSupabaseClient()
    
    // Verify reset token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at, used')
      .eq('token', token)
      .eq('used', false)
      .single()
    
    if (tokenError || !resetToken) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired reset token'
      }, { status: 400 })
    }
    
    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(resetToken.expires_at)
    
    if (now > expiresAt) {
      return NextResponse.json({
        success: false,
        error: 'Reset token has expired'
      }, { status: 400 })
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', resetToken.user_id)
    
    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update password'
      }, { status: 500 })
    }
    
    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token)
    
    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully'
    })
    
  } catch (error) {
    console.error('Error in reset password:', error)
    
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Reset token is required'
      }, { status: 400 })
    }
    
    const supabase = getSupabaseClient()
    
    // Verify reset token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at, used')
      .eq('token', token)
      .eq('used', false)
      .single()
    
    if (tokenError || !resetToken) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired reset token'
      }, { status: 400 })
    }
    
    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(resetToken.expires_at)
    
    if (now > expiresAt) {
      return NextResponse.json({
        success: false,
        error: 'Reset token has expired'
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Reset token is valid'
    })
    
  } catch (error) {
    console.error('Error verifying reset token:', error)
    return NextResponse.json({
      success: false,
      error: 'An error occurred while verifying the reset token'
    }, { status: 500 })
  }
}
