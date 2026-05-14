'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

export function TutorFilters() {
  const [maxPrice, setMaxPrice] = useState(200)

  return (
    <section className="mb-8 rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search by keyword */}
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Search by keyword
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="e.g., 'Physics', 'Dr. Reed', 'Calculus expert'..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Filter by subject */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Filter by subject
          </label>
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="physics">Physics</SelectItem>
              <SelectItem value="chemistry">Chemistry</SelectItem>
              <SelectItem value="math">Mathematics</SelectItem>
              <SelectItem value="biology">Biology</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="computer-science">Computer Science</SelectItem>
              <SelectItem value="history">History</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max Price */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Max Price
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">${maxPrice}</span>
            <span className="text-xs text-gray-500">/hr</span>
          </div>
          <Slider
            value={[maxPrice]}
            onValueChange={(value) => setMaxPrice(value[0])}
            min={10}
            max={300}
            step={5}
            className="mt-2"
          />
        </div>
      </div>

      {/* Minimum Rating */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Minimum Rating
        </label>
        <Select defaultValue="any">
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Any Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Rating</SelectItem>
            <SelectItem value="3">3+ Stars</SelectItem>
            <SelectItem value="3.5">3.5+ Stars</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="4.5">4.5+ Stars</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  )
}
