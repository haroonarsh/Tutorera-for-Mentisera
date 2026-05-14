'use client'

import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TutorCardProps {
  id: string
  name: string
  title: string
  image: string
  bio: string
  rating: number
  reviewCount: number
  subjects: string[]
  price: number
  badge?: 'Gold' | 'Silver' | 'Bronze'
}

export function TutorCard({
  name,
  title,
  image,
  bio,
  rating,
  reviewCount,
  subjects,
  price,
  badge,
}: TutorCardProps) {
  const badgeColors: Record<string, { bg: string; text: string }> = {
    Gold: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    Silver: { bg: 'bg-gray-100', text: 'text-gray-700' },
    Bronze: { bg: 'bg-orange-100', text: 'text-orange-700' },
  }

  const badgeStyle = badge ? badgeColors[badge] : null

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Name & Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-600">{title}</p>
          </div>
          {badge && (
            <Badge className={`${badgeStyle?.bg} ${badgeStyle?.text} flex-shrink-0 whitespace-nowrap text-xs font-medium`}>
              ⭐ {badge}
            </Badge>
          )}
        </div>

        {/* Bio */}
        <p className="text-sm text-gray-600">{bio}</p>

        {/* Subjects */}
        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => (
            <Badge key={subject} variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
              {subject}
            </Badge>
          ))}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold text-gray-900">{rating}</span>
          <span className="text-sm text-gray-500">({reviewCount} reviews)</span>
        </div>

        {/* Price & Button */}
        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <span className="text-lg font-bold text-gray-900">${price}</span>
            <span className="text-sm text-gray-500">/hour</span>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">View Profile</Button>
        </div>
      </div>
    </div>
  )
}
