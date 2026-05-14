'use client'

import { TutorCard } from './tutor-card'

type TutorData = {
  id: string
  name: string
  title: string
  image: string
  bio: string
  rating: number
  reviewCount: number
  subjects: string[]
  price: number
  badge?: 'Bronze' | 'Gold' | 'Silver'
}

// Sample tutor data - replace with real API data
const tutorsData: TutorData[] = [
  {
    id: '1',
    name: 'Dr. Evelyn Reed',
    title: 'PhD in Physics with 10+ years of teaching experience.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    bio: 'Passionate educator with expertise in physics and mathematics.',
    rating: 4.9,
    reviewCount: 120,
    subjects: ['Physics', 'Mathematics'],
    price: 75,
    badge: 'Gold',
  },
  {
    id: '2',
    name: 'Marcus Bell',
    title: 'Software Engineer & Code Mentor',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    bio: 'Expert in software development and coding best practices.',
    rating: 4.8,
    reviewCount: 85,
    subjects: ['Computer Science'],
    price: 80,
    badge: 'Silver',
  },
  {
    id: '3',
    name: 'Dr. Anya Sharma',
    title: 'Passionate biologist and researcher.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    bio: 'Specializes in biology and chemistry education.',
    rating: 4.9,
    reviewCount: 98,
    subjects: ['Biology', 'Chemistry'],
    price: 65,
    badge: 'Gold',
  },
  {
    id: '4',
    name: 'Leo Tolstoy Jr.',
    title: 'Literature and History enthusiast.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    bio: 'Expert in literature and history with a passion for teaching.',
    rating: 4.7,
    reviewCount: 75,
    subjects: ['English', 'History'],
    price: 50,
    badge: 'Bronze',
  },
  {
    id: '5',
    name: 'Sarah Johnson',
    title: 'Mathematics Specialist',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    bio: 'Dedicated to making mathematics accessible and fun.',
    rating: 4.8,
    reviewCount: 110,
    subjects: ['Mathematics', 'Calculus'],
    price: 70,
    badge: 'Gold',
  },
  {
    id: '6',
    name: 'Ahmed Khan',
    title: 'Chemistry Expert',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    bio: 'Specializing in organic and inorganic chemistry.',
    rating: 4.6,
    reviewCount: 92,
    subjects: ['Chemistry', 'Physics'],
    price: 60,
  },
]

export function TutorGrid() {
  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tutorsData.map((tutor) => (
          <TutorCard
            key={tutor.id}
            {...tutor}
          />
        ))}
      </div>
    </section>
  )
}
