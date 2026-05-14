'use client'

import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SupportSection() {
  return (
    <section className="bg-amber-50 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <HelpCircle className="mx-auto h-12 w-12 text-blue-600 sm:h-14 sm:w-14" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
          Need a Tailored Solution?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
          Feeling confused? Our customer support team is available to understand your unique needs and guide you to the perfect tutor.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Contact Support
          </Button>
          <Button variant="outline" className="border-gray-300">
            Chat on WhatsApp
          </Button>
        </div>
      </div>
    </section>
  )
}
