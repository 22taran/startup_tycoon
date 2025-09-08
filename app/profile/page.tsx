import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Mail, Calendar, Shield } from 'lucide-react'

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/signin')
  }

  const user = session.user

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your personal account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={(user as any).image || ''} alt={user.name || ''} />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xl">
                    {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {user.name || 'No name set'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {user.email}
                  </p>
                  <Badge 
                    variant={user.role === 'admin' ? 'destructive' : 'default'}
                    className="mt-2"
                  >
                    {user.role === 'admin' ? 'Administrator' : 'Student'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Role</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.role === 'admin' ? 'Administrator' : 'Student'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Member Since</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Profile Picture
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Upload a new profile picture to personalize your account.
                </p>
                <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Change Picture
                </button>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Password
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Update your password to keep your account secure.
                </p>
                <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Change Password
                </button>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Notifications
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Manage your notification preferences.
                </p>
                <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Manage Notifications
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  View Dashboard
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Go to your main dashboard
                </p>
              </button>

              <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  Account Settings
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your account settings
                </p>
              </button>

              <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  Help & Support
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get help and contact support
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
