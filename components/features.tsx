import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  TrendingUp, 
  Users, 
  Award, 
  BarChart3, 
  Shield 
} from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Assignment Submissions',
    description: 'Submit your team\'s work through our intuitive platform with file uploads and detailed descriptions.'
  },
  {
    icon: TrendingUp,
    title: 'Investment System',
    description: 'Invest 10-50 tokens in up to 3 teams per round. Watch your portfolio grow with smart investments.'
  },
  {
    icon: Users,
    title: 'Peer Evaluation',
    description: 'Evaluate 5 assigned teams each round. Your investment decisions directly impact their grades.'
  },
  {
    icon: Award,
    title: 'Grading System',
    description: 'Fair grading based on average investments with highest and lowest values removed to prevent manipulation.'
  },
  {
    icon: BarChart3,
    title: 'Interest Earnings',
    description: 'Earn interest on successful investments. High-performing teams give you better returns!'
  },
  {
    icon: Shield,
    title: 'Secure & Fair',
    description: 'Robust system with admin controls, audit trails, and transparent evaluation processes.'
  }
]

export function Features() {
  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Game Features
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Experience a unique blend of education and gamification that makes learning engaging and competitive.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
