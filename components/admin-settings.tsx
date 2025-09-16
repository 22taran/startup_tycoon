'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPlus, Save, AlertCircle, CheckCircle } from 'lucide-react'

interface PlatformSettings {
  [key: string]: {
    value: any
    description: string
  }
}

export function AdminSettings() {
  const [settings, setSettings] = useState<PlatformSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Load settings on component mount
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()

      if (data.success) {
        setSettings(data.data)
      } else {
        console.error('Error fetching settings:', data.error)
        setMessage({ type: 'error', text: 'Failed to load settings' })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: any) => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      })

      const data = await response.json()

      if (data.success) {
        setSettings(prev => ({
          ...prev,
          [key]: { ...prev[key], value }
        }))
        setMessage({ type: 'success', text: 'Setting updated successfully' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update setting' })
      }
    } catch (error) {
      console.error('Error updating setting:', error)
      setMessage({ type: 'error', text: 'Failed to update setting' })
    } finally {
      setSaving(false)
    }
  }

  const handleSignupToggle = (enabled: boolean) => {
    updateSetting('signup_enabled', enabled)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Settings</h2>
            <p className="text-gray-600 dark:text-gray-300">Configure platform-wide policies and settings</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Settings</h2>
          <p className="text-gray-600 dark:text-gray-300">Configure platform-wide policies and settings</p>
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <div className="flex items-center">
            {message.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              User Registration
            </CardTitle>
            <CardDescription>Control user registration and account creation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="signup-enabled">Enable Signup</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Allow new users to create accounts and register
                </p>
              </div>
              <Switch
                id="signup-enabled"
                checked={settings.signup_enabled?.value === true || settings.signup_enabled?.value === 'true' || settings.signup_enabled?.value === '"true"'}
                onCheckedChange={handleSignupToggle}
                disabled={saving}
              />
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>
                <strong>When enabled:</strong> New users can create accounts and join the platform
              </p>
              <p>
                <strong>When disabled:</strong> Only existing users can sign in, no new registrations
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Team Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Team Settings
            </CardTitle>
            <CardDescription>Configure team size limits and policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Team Configuration</p>
              <p className="text-sm text-gray-400">Coming soon - configure team size limits and policies</p>
            </div>
          </CardContent>
        </Card>

        {/* Token Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Token Settings
            </CardTitle>
            <CardDescription>Configure investment tokens and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Token Configuration</p>
              <p className="text-sm text-gray-400">Coming soon - configure token limits and policies</p>
            </div>
          </CardContent>
        </Card>

        {/* Grading Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Grading Rules
            </CardTitle>
            <CardDescription>Set up grading policies and weightings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Grading Configuration</p>
              <p className="text-sm text-gray-400">Coming soon - configure grading rules and weightings</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
