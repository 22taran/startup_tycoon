import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Users, 
  DollarSign, 
  Calculator, 
  Trophy,
  ArrowRight,
  BookOpen,
  Target,
  TrendingUp,
  Award
} from 'lucide-react'

const steps = [
  {
    step: 1,
    icon: BookOpen,
    title: 'Enroll in Courses',
    description: 'Join courses created by instructors and access your personalized course dashboard.',
    details: [
      'Browse available courses in the catalog',
      'Enroll with a single click',
      'Access course-specific assignments and teams',
      'View your progress and grades'
    ]
  },
  {
    step: 2,
    icon: Users,
    title: 'Form Assignment Teams',
    description: 'Create or join teams for each assignment. Teams can change between assignments.',
    details: [
      '1-2 students per team (solo or paired)',
      'Different teams for different assignments',
      'Teams lock once submission is made',
      'Change teams before submission deadline'
    ]
  },
  {
    step: 3,
    icon: Upload,
    title: 'Submit Your Work',
    description: 'Submit your team\'s assignment with primary and backup links before the deadline.',
    details: [
      'Submit before assignment deadline',
      'Provide both primary and backup links',
      'Team submissions are locked after deadline',
      'Track submission status in real-time'
    ]
  },
  {
    step: 4,
    icon: Target,
    title: 'Evaluate Assigned Teams',
    description: 'You\'ll be assigned 5 teams to evaluate for each assignment. Complete evaluations individually.',
    details: [
      'Each student evaluates 5 teams individually',
      'No self-evaluation allowed',
      'Complete evaluations before deadline',
      'View team submissions and provide feedback'
    ]
  },
  {
    step: 5,
    icon: DollarSign,
    title: 'Invest Your Tokens',
    description: 'Invest 10-50 tokens in up to 3 of your assigned teams. You have 100 tokens per assignment.',
    details: [
      'Invest in 3 out of 5 assigned teams',
      'Minimum: 10 tokens, Maximum: 50 tokens per team',
      'Total: 100 tokens per assignment',
      'Mark incomplete submissions as 0 tokens'
    ]
  },
  {
    step: 6,
    icon: Calculator,
    title: 'Automatic Grading',
    description: 'Grades are calculated using the investment system with performance tiers.',
    details: [
      'High Performance (top 1/3): 100%',
      'Median Performance (middle 1/3): 80%',
      'Low Performance (bottom 1/3): 60%',
      'Incomplete submissions: 0%'
    ]
  },
  {
    step: 7,
    icon: TrendingUp,
    title: 'Earn Interest & Bonus',
    description: 'Earn interest on successful investments. Accumulate bonus marks up to +20% of final grade.',
    details: [
      'Interest calculated immediately after grading',
      'High performance: 20% interest rate',
      'Median performance: 10% interest rate',
      'Low performance: 5% interest rate',
      'Track total interest across all assignments'
    ]
  },
  {
    step: 8,
    icon: Award,
    title: 'Track Your Progress',
    description: 'Monitor your performance, investments, and interest earnings across all assignments.',
    details: [
      'View grades and feedback for each assignment',
      'Track your investment portfolio performance',
      'Monitor interest earnings and bonus potential',
      'Access detailed reports and analytics'
    ]
  }
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Follow these 8 steps to participate in the Startup Tycoon game and maximize your learning experience.
          </p>
        </div>
        
        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={step.step} className="flex flex-col lg:flex-row items-start gap-8">
              <div className="flex-shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white">
                  <step.icon className="h-8 w-8" />
                </div>
              </div>
              
              <Card className="flex-1 border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-sm font-semibold">
                      Step {step.step}
                    </Badge>
                    <CardTitle className="text-2xl">{step.title}</CardTitle>
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    {step.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-2">
                        <ArrowRight className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Instructor/Admin Section */}
        <div className="mt-20">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              For Instructors & Administrators
            </h3>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              Manage courses, assignments, and monitor student progress with powerful admin tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Course Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Create and manage multiple courses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Enroll students and manage roles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Set assignment deadlines and phases</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Target className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Assignment Control</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Distribute individual evaluations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Monitor submission and evaluation status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Trigger automatic grading</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Analytics & Reports</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">View detailed grade reports</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Track student interest earnings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Download comprehensive reports</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
