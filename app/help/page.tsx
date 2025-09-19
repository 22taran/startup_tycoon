import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BookOpen, 
  Upload, 
  Target, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  ArrowRight,
  FileText,
  DollarSign,
  Lightbulb
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ScreenshotPlaceholder } from '@/components/screenshot-placeholder'

export const metadata: Metadata = {
  title: 'Student Guide - How to Submit & Invest',
  description: 'Complete student guide for submitting assignments and investing in peer work',
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-4">
            📚 Student Guide
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Learn how to submit assignments and invest in peer work to maximize your learning and grades
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-gray-600 dark:text-gray-400" />
              </div>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">Phase 1: Assignment Submission</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create teams, submit assignments, and meet deadlines
              </p>
              <Button asChild className="w-full">
                <a href="#submission-guide">
                  View Submission Guide <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-gray-600 dark:text-gray-400" />
              </div>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">Phase 2: Peer Investment</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Evaluate peers and make strategic token investments
              </p>
              <Button asChild className="w-full">
                <a href="#investment-guide">
                  View Investment Guide <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg">
              <BookOpen className="h-7 w-7" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Getting Started</h2>
          </div>
          
          <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Badge variant="secondary" className="text-lg font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 mt-1">
                    Step 1
                  </Badge>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access the Platform</h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      Go to the platform and log in with your student account
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Platform URL:</strong> <Link href="/" className="text-blue-600 hover:underline">startup-tycoon.vercel.app</Link>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Badge variant="secondary" className="text-lg font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 mt-1">
                    Step 2
                  </Badge>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Reset Your Password</h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      If you're a new student or haven't logged in recently, reset your password
                    </p>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                      <li>Click on "Login" on the homepage</li>
                      <li>Click on "Forgot your password?"</li>
                      <li>Enter your student email address</li>
                      <li>Check your student email for reset instructions</li>
                      <li>Set a new password and log in</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Badge variant="secondary" className="text-lg font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 mt-1">
                    Step 3
                  </Badge>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select Your Course</h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      After logging in, you'll land on your Course Dashboard. Select your course from the available courses.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Assignment Submission Guide */}
        <section id="submission-guide" className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg">
              <Upload className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Phase 1: Assignment Submission</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">Create teams and submit your work</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Create Team */}
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader className="bg-gray-50 dark:bg-gray-800/50">
                <CardTitle className="text-2xl text-gray-900 dark:text-white flex items-center gap-3">
                  <Users className="h-6 w-6" />
                  Phase 1 - Step 1: Create Your Team
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300 text-lg">
                    On the course dashboard, look for the "Create Team" button
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg border shadow-lg overflow-hidden relative">
                        <Image 
                          src="/screenshots/create_team.png" 
                          alt="Course Dashboard - Create Team Button"
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          quality={95}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        Course Dashboard - Create Team Button
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg border shadow-lg overflow-hidden relative">
                        <Image 
                          src="/screenshots/create_team_modal.png" 
                          alt="Team Creation Modal"
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          quality={95}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        Team Creation Modal
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Team Creation Steps:</h4>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                        <li>Click "Create Team" to start forming your team</li>
                        <li>Enter your team member's email addresses</li>
                        <li>You can add up to 1 member or create a solo team</li>
                        <li>Click "Create Team" to finalize</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Team Rules:</h4>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                        <li>Maximum 2 members per team</li>
                        <li>Minimum 1 member (solo teams allowed)</li>
                        <li>Teams are locked after submission</li>
                        <li>Cannot change teams after deadline</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Assignment */}
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader className="bg-gray-50 dark:bg-gray-800/50">
                <CardTitle className="text-2xl text-gray-900 dark:text-white flex items-center gap-3">
                  <FileText className="h-6 w-6" />
                  Phase 1 - Step 2: Submit Your Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300 text-lg">
                    Navigate to the "Assignments" tab or find the assignment in the overview
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg border shadow-lg overflow-hidden relative">
                        <Image 
                          src="/screenshots/submit_assignment.png" 
                          alt="Assignments Tab - Assignment Card"
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          quality={95}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        Assignments Tab - Assignment Card
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg border shadow-lg overflow-hidden relative">
                        <Image 
                          src="/screenshots/submit.png" 
                          alt="Submission Modal Form"
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          quality={95}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        Submission Modal Form
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Submission Steps:</h4>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                        <li>Click on the assignment you need to submit</li>
                        <li>Click "Submit Work" to open the submission form</li>
                        <li>Enter your assignment details</li>
                        <li>Click "Submit Assignment" to complete</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Required Information:</h4>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                        <li><strong>Primary Link:</strong> Main submission (required)</li>
                        <li><strong>Backup Link:</strong> Alternative link (optional)</li>
                        <li><strong>Title:</strong> Brief description (optional)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <Clock className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-red-800 dark:text-red-200 font-medium">Important Deadline Information</p>
                        <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                          Submissions are automatically blocked after the assignment deadline. Make sure to submit on time!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Investment Guide */}
        <section id="investment-guide" className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg">
              <Target className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Phase 2: Peer Investment</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">Evaluate peers and invest tokens</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Evaluate and Invest */}
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader className="bg-gray-50 dark:bg-gray-800/50">
                <CardTitle className="text-2xl text-gray-900 dark:text-white flex items-center gap-3">
                  <DollarSign className="h-6 w-6" />
                  Phase 2 - Step 1: Evaluate Peer Work & Invest Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300 text-lg">
                    Go to the "My Evaluations" tab on your dashboard. You'll see a list of peer assignments assigned to you for evaluation.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg border shadow-lg overflow-hidden relative">
                        <Image 
                          src="/screenshots/investment_tab.png" 
                          alt="My Evaluations Tab - Investment Tab"
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          quality={95}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        My Evaluations Tab - Investment Options
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg border shadow-lg overflow-hidden relative">
                        <Image 
                          src="/screenshots/investment.png" 
                          alt="Investment Modal with Token Selection"
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          quality={95}
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        Investment Modal with Token Selection
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Evaluation Process:</h4>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                        <li>Review the submitted work thoroughly</li>
                        <li>Provide detailed feedback and comments</li>
                        <li>Rate the work based on criteria</li>
                        <li>Complete all required evaluation fields</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Investment Rules:</h4>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                        <li>Invest <strong>10-50 tokens</strong> per assignment</li>
                        <li>Invest in <strong>up to 3 teams</strong> total</li>
                        <li>Choose wisely - affects bonus marks</li>
                        <li>Cannot invest after evaluation deadline</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
                    <div className="flex">
                      <Lightbulb className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                      <div>
                        <p className="text-blue-800 dark:text-blue-200 font-medium">Investment Strategy Tips</p>
                        <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                          Higher-performing teams give better returns (20% vs 5% interest). Evaluate quality carefully before investing!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Wait for Results */}
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
              <CardHeader className="bg-gray-50 dark:bg-gray-800/50">
                <CardTitle className="text-2xl text-gray-900 dark:text-white flex items-center gap-3">
                  <CheckCircle className="h-6 w-6" />
                  Phase 2 - Step 2: Wait for Results
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300 text-lg">
                    Once you've completed all evaluations and investments, wait for the instructor to calculate and release grades.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">What Happens Next:</h4>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                        <li>Instructor calculates team grades</li>
                        <li>Interest is calculated on your investments</li>
                        <li>Final grades are released</li>
                        <li>Check "Grades" section for results</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Interest Rates:</h4>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                        <li><strong>High Performance:</strong> 20% interest</li>
                        <li><strong>Median Performance:</strong> 10% interest</li>
                        <li><strong>Low Performance:</strong> 5% interest</li>
                        <li><strong>Incomplete:</strong> 0% interest</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Tips */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg">
              <Lightbulb className="h-7 w-7" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Quick Tips for Success</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  Team Communication
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Ensure clear communication with your team members throughout the assignment lifecycle.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  Watch Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Always keep an eye on submission and evaluation deadlines to avoid late penalties.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  Quality Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  When evaluating peers, offer helpful and actionable feedback to aid their learning.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  Strategic Investing
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Think strategically about your token investments to maximize your bonus marks.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  Seek Help Early
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Don't hesitate to reach out to your instructor or support if you encounter any issues.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  Review Results
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Regularly check the "Grades" section for your results and instructor feedback.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Need more help? Contact your instructor or{' '}
            <Link href="/" className="text-blue-600 hover:underline">
              return to homepage
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
