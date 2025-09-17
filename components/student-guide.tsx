import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  LogIn, 
  Users, 
  Upload, 
  Target, 
  DollarSign, 
  Clock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Trophy
} from 'lucide-react'

const phases = [
  {
    phase: "Getting Started",
    icon: LogIn,
    color: "bg-blue-600",
    steps: [
      {
        title: "Log in to the Platform",
        details: [
          "Click on Login",
          "Click on 'Forgot your password?' to reset your password",
          "Then login with your credentials",
          "You'll land on your Course Dashboard",
          "Select your course from the available courses"
        ]
      }
    ]
  },
  {
    phase: "Phase 1: Assignment Submission",
    icon: Upload,
    color: "bg-green-600",
    steps: [
      {
        title: "Create Your Team",
        details: [
          "On the course dashboard, look for the 'Create Team' button",
          "Click 'Create Team' to start forming your team",
          "Add Team Members:",
          "• Enter your team member's email addresses",
          "• You can add up to 1 member or create a solo team if working alone",
          "Click 'Create Team' to finalize"
        ]
      },
      {
        title: "Submit Your Assignment",
        details: [
          "Navigate to the 'Assignments' tab or find the assignment in the overview",
          "Click on the assignment you need to submit",
          "Click 'Submit Work' to open the submission form",
          "Enter your assignment details:",
          "• Primary submission link (required)",
          "• Backup link (optional but recommended)",
          "Click 'Submit Assignment' to complete your submission"
        ]
      }
    ]
  },
  {
    phase: "Phase 2: Peer Evaluation & Investment",
    icon: Target,
    color: "bg-purple-600",
    steps: [
      {
        title: "Evaluate Peer Work & Invest Tokens",
        details: [
          "Go to the 'My Evaluations' tab on your dashboard",
          "You'll see a list of peer assignments assigned to you for evaluation",
          "For each assignment:",
          "• Review the submitted work thoroughly",
          "• After evaluating, you can invest tokens in the teams you reviewed",
          "Investment Rules:",
          "• You can invest 10-50 tokens per assignment",
          "• You can invest in up to 3 teams total",
          "• Choose wisely - your investments affect bonus marks",
          "• Click 'Invest Tokens' to allocate your investment",
          "• Confirm your investment amounts"
        ]
      },
      {
        title: "Wait for Results",
        details: [
          "Once you've completed all evaluations and investments",
          "Wait for the instructor to calculate and release grades",
          "Check back regularly for grade updates",
          "Grades will be available in the 'Grades' section"
        ]
      }
    ]
  }
]

export function StudentGuide() {
  return (
    <section id="student-guide" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            How to Submit an Assignment
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Follow this step-by-step guide to successfully submit assignments and participate in peer evaluation.
          </p>
        </div>
        
        <div className="space-y-12">
          {phases.map((phase, phaseIndex) => (
            <div key={phaseIndex} className="space-y-6">
              {/* Phase Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${phase.color} text-white`}>
                  <phase.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {phase.phase}
                  </h3>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-6">
                {phase.steps.map((step, stepIndex) => (
                  <Card key={stepIndex} className="border-l-4 border-l-blue-500 shadow-lg">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-sm font-semibold">
                          Step {stepIndex + 1}
                        </Badge>
                        <CardTitle className="text-xl text-gray-900 dark:text-white">
                          {step.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start gap-3">
                            {detail.startsWith('•') ? (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                                <span className="text-gray-700 dark:text-gray-300 ml-2">
                                  {detail.substring(2).trim()}
                                </span>
                              </div>
                            ) : detail.includes(':') ? (
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                  {detail}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2">
                                <ArrowRight className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {detail}
                                </span>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Tips Section */}
        <div className="mt-16">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Trophy className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl text-blue-900 dark:text-blue-100">
                  Quick Tips for Success
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">Meet Deadlines</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200">Submit assignments and evaluations before due dates</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">Fair Evaluation</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200">Provide honest, constructive feedback to your peers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">Strategic Investment</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200">Think carefully about where to invest your tokens</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">Team Communication</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200">Stay in touch with your team members throughout the process</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
