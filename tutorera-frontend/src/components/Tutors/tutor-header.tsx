'use client'

import { Users } from 'lucide-react'

export function TutorHeader() {
  return (
    <section className="border-b border-gray-200 bg-white py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3 sm:gap-4">
          <Users className="mt-1 h-8 w-8 flex-shrink-0 text-blue-600 sm:h-10 sm:w-10" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
              Find Your Perfect Tutor
            </h1>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Search and filter from our list of expert, verified educators to find the right match for your learning needs.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
