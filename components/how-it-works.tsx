import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Users, 
  DollarSign, 
  Calculator, 
  Trophy,
  ArrowRight
} from 'lucide-react'

const steps = [
  {
    step: 1,
    icon: Upload,
    title: 'Submit Your Work',
    description: 'Each team submits their assignment through the platform with detailed descriptions and file uploads.',
    details: [
      'Due every Wednesday (Weeks 3, 5, 7, 9, 11, 13)',
      'Late submissions get 50% deduction',
      'No submissions allowed once evaluation starts'
    ]
  },
  {
    step: 2,
    icon: Users,
    title: 'Get Assigned Teams',
    description: 'You\'ll be assigned 5 teams to evaluate each round. Each team gets evaluated by 5 different students.',
    details: [
      'Evaluation opens Saturday, closes Monday',
      'No late evaluations allowed',
      'Each team receives 10 total investments'
    ]
  },
  {
    step: 3,
    icon: DollarSign,
    title: 'Invest Your Tokens',
    description: 'Invest 10-50 tokens in up to 3 teams. You have 100 tokens per round to distribute.',
    details: [
      'Minimum investment: 10 tokens',
      'Maximum investment: 50 tokens',
      'Mark incomplete submissions as 0 tokens'
    ]
  },
  {
    step: 4,
    icon: Calculator,
    title: 'Automatic Grading',
    description: 'Grades are calculated by averaging investments, removing highest and lowest values.',
    details: [
      'High Investment (top 1/3): 100%',
      'Median Investment (middle 1/3): 80%',
      'Low Investment (bottom 1/3): 60%',
      'Incomplete: 0%'
    ]
  },
  {
    step: 5,
    icon: Trophy,
    title: 'Earn Interest & Bonus',
    description: 'Earn interest on successful investments. Accumulate bonus marks up to +20% of final grade.',
    details: [
      'Interest rates vary by team performance',
      'Track your portfolio across all rounds',
      'Exchange interest for bonus marks'
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
            Follow these 5 simple steps to participate in the Startup Tycoon game.
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
      </div>
    </section>
  )
}
