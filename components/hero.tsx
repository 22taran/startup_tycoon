'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Trophy, Users, Target } from 'lucide-react'
import Link from 'next/link'
import AuthModal from '@/components/auth-modal'

export function Hero() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-20 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Startup Tycoon
            <span className="block text-blue-600 dark:text-blue-400">
              The Investor Game
            </span>
          </h1>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
            A game-like evaluation system where teams pitch their ideas and students act as investors. 
            Build your portfolio, earn interest, and climb the leaderboard!
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => setIsAuthModalOpen(true)}
            >
              Start Playing
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link href="#how-it-works">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">100+</h3>
            <p className="text-gray-600 dark:text-gray-300">Active Students</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Trophy className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">6</h3>
            <p className="text-gray-600 dark:text-gray-300">Assignment Rounds</p>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
              <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">100</h3>
            <p className="text-gray-600 dark:text-gray-300">Investment Tokens</p>
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
