import { AlertCircle } from 'lucide-react'

interface ScreenshotPlaceholderProps {
  title: string
  description: string
  className?: string
}

export function ScreenshotPlaceholder({ title, description, className = "" }: ScreenshotPlaceholderProps) {
  return (
    <div className={`bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 ${className}`}>
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <p className="text-yellow-800 dark:text-yellow-200 font-medium">{title}</p>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">{description}</p>
          <div className="mt-2 bg-yellow-100 dark:bg-yellow-800/30 rounded p-3 text-center">
            <p className="text-yellow-600 dark:text-yellow-400 text-xs">
              📸 Screenshot placeholder - Replace with actual image
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
