import { TutorHeader } from '@/components/Tutors/tutor-header';
import { TutorFilters } from '@/components/Tutors/tutor-filters';
import { TutorGrid } from '@/components/Tutors/tutor-grid';
import { SupportSection } from '@/components/Tutors/support-section';

export default function TutorsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <TutorHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters Section */}
        <TutorFilters />

        {/* Tutors Grid */}
        <TutorGrid />
      </main>

      {/* Support Section */}
      <SupportSection />
    </div>
  )
}
