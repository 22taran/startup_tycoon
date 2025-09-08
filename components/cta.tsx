'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play } from 'lucide-react'
import Link from 'next/link'
import AuthModal from '@/components/auth-modal'

export function CTA() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  return (
    <section className="py-20 bg-blue-600 dark:bg-blue-700">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Start Your Investment Journey?
          </h2>
          <p className="mt-4 text-lg text-blue-100 sm:text-xl">
            Join hundreds of students already playing Startup Tycoon. 
            Build your portfolio, earn interest, and climb the leaderboard!
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-6"
              onClick={() => setIsAuthModalOpen(true)}
            >
              <Play className="mr-2 h-5 w-5" />
              Start Playing Now
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="/dashboard">
                View Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          
          <div className="mt-12 rounded-lg bg-white/10 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-4">
              Game Statistics
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">6</div>
                <div className="text-blue-100">Assignment Rounds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">100</div>
                <div className="text-blue-100">Tokens Per Round</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">+20%</div>
                <div className="text-blue-100">Max Bonus Marks</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab="signin"
      />
    </section>
  )
}
