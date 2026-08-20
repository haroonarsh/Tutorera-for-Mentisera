// app/tutors/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Star, MapPin, BookOpen, Clock, CheckCircle, MessageSquare, Play } from "lucide-react";
import api from "@/lib/axios";
import { TutorProfile, Review } from "@/types/tutor";
import { Heart } from "lucide-react";
import { useFavourites } from "@/hooks/useFavourites";
import DirectBookingModal from "@/components/Dashboard/DirectBookingModal";

const C = { primary: '#1a1a2e', accent: '#2563eb', gray500: '#6b7280', gray50: '#f9fafb', accentLight: '#eff6ff' };

export default function TutorDetailPage() {
  const { id } = useParams();
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<{
  date: string; dayName: string; startTime: string; endTime: string; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "reviews">("about");
  const [videoPlaying, setVideoPlaying] = useState(false);   // ← NEW
  const { isFavourited, toggleFavourite, isStudent, loaded } = useFavourites();
  const [togglingFav, setTogglingFav] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPagination, setReviewPagination] = useState({ pages: 1 });
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First fetch tutor profile
        const tutorRes = await api.get(`/tutors/${id}`);
        const tutorData = tutorRes.data.profile;
        setTutor(tutorData);

        // Then fetch reviews + availability in parallel using user._id
        const [reviewRes, availRes] = await Promise.all([
          api.get(`/reviews/${tutorData.user._id}`),
          api.get(`/tutors/${tutorData.user._id}/availability`),
        ]);
        setReviews(reviewRes.data.reviews);
        setReviewPagination(reviewRes.data.pagination);
        setAvailabilitySlots(availRes.data.slots || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleFavClick = async () => {
    if (!tutor) return;
    setTogglingFav(true);
    await toggleFavourite(tutor._id);
    setTogglingFav(false);
  };

  const handleLoadMoreReviews = async () => {
    if (!tutor || loadingReviews) return;
    setLoadingReviews(true);
    try {
      const nextPage = reviewPage + 1;
      const res = await api.get(`/reviews/${tutor.user._id}?page=${nextPage}`);
      setReviews(prev => [...prev, ...res.data.reviews]);
      setReviewPagination(res.data.pagination);
      setReviewPage(nextPage);
    } catch (err) {
      console.error("Failed to load more reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: C.gray500 }}>Loading tutor profile...</p>
      </div>
    </div>
  );

  if (!tutor) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ color: C.gray500, fontSize: '1.1rem' }}>Tutor not found.</p>
      <Link href="/tutors" style={{ color: C.accent, textDecoration: 'none', fontWeight: '600' }}>← Back to Tutors</Link>
    </div>
  );

  return (
    <div style={{ backgroundColor: C.gray50, minHeight: '100vh' }}>

      {/* Hero Banner */}
      <div style={{ backgroundColor: C.primary, padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
          {/* Avatar */}
          <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, #1d4ed8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: '800', color: 'white', flexShrink: 0, border: '4px solid rgba(255,255,255,0.2)' }}>
            {tutor.user?.avatar ? (
              <img src={tutor.user?.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="" />
            ) : (tutor.user?.name?.charAt(0) || "T")}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'white' }}>{tutor.user?.name}</h1>
              {tutor.isVerified && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#16a34a', color: 'white', fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                  <CheckCircle size={12} /> Verified
                </span>
              )}
              {/* ── NEW: Video intro badge in hero ── */}
              {tutor.videoIntro && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.25)' }}>
                  <Play size={10} fill="white" /> Intro Video
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: '#9ca3af', fontSize: '0.9rem' }}>
              {tutor.city && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={14} />{tutor.city}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14} />{tutor.experience} years exp.</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><BookOpen size={14} />{tutor.teachingMode}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
              {tutor.subjects?.map(s => (
                <span key={s} style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.8rem', padding: '0.2rem 0.75rem', borderRadius: '999px' }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Rating + Price */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '1rem', padding: '1.5rem', textAlign: 'center', minWidth: '160px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
              <Star size={20} color="#f59e0b" fill="#f59e0b" />
              <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'white' }}>{tutor.averageRating || "New"}</span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: '1rem' }}>{tutor.totalReviews} reviews</p>
            <p style={{ fontSize: '1.3rem', fontWeight: '800', color: 'white' }}>Rs. {tutor.hourlyRate?.toLocaleString()}</p>
            <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>per hour</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }} className="tutor-grid">

        {/* Left Column */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0', backgroundColor: 'white', borderRadius: '0.75rem', padding: '0.3rem', marginBottom: '1.5rem', border: '1px solid #e5e7eb' }}>
            {(["about", "reviews"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', textTransform: 'capitalize', backgroundColor: activeTab === tab ? C.accent : 'transparent', color: activeTab === tab ? 'white' : C.gray500, transition: 'all 0.2s' }}>
                {tab} {tab === "reviews" && `(${reviews.length})`}
              </button>
            ))}
          </div>

          {activeTab === "about" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Bio */}
              {tutor.bio && (
                <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.75rem', border: '1px solid #e5e7eb' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: C.primary, marginBottom: '1rem' }}>About</h2>
                  <p style={{ color: C.gray500, lineHeight: '1.8', fontSize: '0.95rem' }}>{tutor.bio}</p>
                </div>
              )}

              {/* ── NEW: Introduction Video ── */}
              {tutor.videoIntro && (
                <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.75rem', border: '1px solid #e5e7eb' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: C.primary, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Play size={18} color={C.accent} />
                    Introduction Video
                  </h2>
                  <p style={{ color: C.gray500, fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                    Watch {tutor.user?.name?.split(' ')[0]} introduce themselves and their teaching style.
                  </p>

                  {!videoPlaying ? (
                    /* Thumbnail / Play button state */
                    <div
                      onClick={() => setVideoPlaying(true)}
                      style={{
                        position: 'relative', borderRadius: '0.75rem', overflow: 'hidden',
                        backgroundColor: C.primary, cursor: 'pointer',
                        aspectRatio: '16/9', display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      {/* Dark overlay with play button */}
                      <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                      }}>
                        <div style={{
                          width: '64px', height: '64px', backgroundColor: C.accent, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 0 0 12px rgba(37,99,235,0.2)',
                          transition: 'transform 0.2s',
                        }}>
                          <Play size={28} color="white" fill="white" style={{ marginLeft: '3px' }} />
                        </div>
                        <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '600' }}>
                          Watch Introduction
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Actual video player */
                    <div style={{ borderRadius: '0.75rem', overflow: 'hidden', aspectRatio: '16/9' }}>
                      <video
                        src={tutor.videoIntro}
                        controls
                        autoPlay
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={() => setVideoPlaying(false)}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                </div>
              )}

              {/* Education */}
              {tutor.education?.length > 0 && (
                <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.75rem', border: '1px solid #e5e7eb' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: C.primary, marginBottom: '1rem' }}>Education</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {tutor.education.map((edu, i) => (
                      <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ width: '40px', height: '40px', backgroundColor: C.accentLight, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <BookOpen size={18} color={C.accent} />
                        </div>
                        <div>
                          <p style={{ fontWeight: '700', color: C.primary, fontSize: '0.95rem' }}>{edu.degree}</p>
                          <p style={{ color: C.gray500, fontSize: '0.875rem' }}>{edu.institution}</p>
                          <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{edu.year}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability */}
              {availabilitySlots.length > 0 && (
                <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.75rem', border: '1px solid #e5e7eb' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: C.primary, marginBottom: '1rem' }}>Availability</h2>
                  <p style={{ fontSize: '0.8rem', color: C.gray500, marginBottom: '1rem' }}>Next 2 weeks — click "Book Now" to reserve a slot</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Group slots by dayName, show unique days */}
                    {Array.from(new Set(availabilitySlots.map(s => s.dayName))).map(dayName => {
                      const daySlots = availabilitySlots.filter(s => s.dayName === dayName);
                      // Show unique start times for this day
                      const uniqueTimes = Array.from(new Set(daySlots.map(s => s.startTime)));
                      return (
                        <div key={dayName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: C.gray50, borderRadius: '0.5rem' }}>
                          <span style={{ fontWeight: '600', color: C.primary, fontSize: '0.9rem', minWidth: '90px' }}>{dayName}</span>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {uniqueTimes.map(time => (
                              <span key={time} style={{ backgroundColor: C.accentLight, color: C.accent, fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: '500' }}>
                                {time}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fallback — show old onboarding availability if no new slots set */}
              {availabilitySlots.length === 0 && tutor.availability?.length > 0 && (
                <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.75rem', border: '1px solid #e5e7eb' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: C.primary, marginBottom: '1rem' }}>Availability</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {tutor.availability.map((a, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: C.gray50, borderRadius: '0.5rem' }}>
                        <span style={{ fontWeight: '600', color: C.primary, fontSize: '0.9rem' }}>{a.day}</span>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {a.slots.map(slot => (
                            <span key={slot} style={{ backgroundColor: C.accentLight, color: C.accent, fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: '500' }}>{slot}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Levels */}
              {tutor.levels?.length > 0 && (
                <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.75rem', border: '1px solid #e5e7eb' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: C.primary, marginBottom: '1rem' }}>Teaching Levels</h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {tutor.levels.map(level => (
                      <span key={level} style={{ backgroundColor: C.gray50, border: '1px solid #e5e7eb', color: C.primary, fontSize: '0.85rem', padding: '0.4rem 0.9rem', borderRadius: '999px', fontWeight: '500' }}>{level}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.length === 0 ? (
                <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '3rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                  <MessageSquare size={40} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ color: C.gray500 }}>No reviews yet for this tutor.</p>
                </div>
              ) : reviews.map(review => (
                <div key={review._id} style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '38px', height: '38px', backgroundColor: C.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '0.9rem' }}>
                        {review.student?.name?.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontWeight: '700', color: C.primary, fontSize: '0.9rem' }}>{review.student?.name}</p>
                        <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      {[1,2,3,4,5].map(i => <Star key={i} size={14} color="#f59e0b" fill={i <= review.rating ? "#f59e0b" : "none"} />)}
                    </div>
                  </div>
                  <p style={{ color: C.gray500, fontSize: '0.9rem', lineHeight: '1.6' }}>{review.comment}</p>
                </div>
              ))}
              {reviewPagination.pages > reviewPage && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button onClick={handleLoadMoreReviews} disabled={loadingReviews}
                    style={{ padding: '0.65rem 1.5rem', backgroundColor: 'white', color: C.accent, border: `1.5px solid ${C.accent}`, borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '600', cursor: loadingReviews ? 'not-allowed' : 'pointer' }}>
                    {loadingReviews ? "Loading..." : "Load More Reviews"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar — Book Now */}
        <div>
          {/* Favourite button (from Feature 3) */}
          {loaded && isStudent && (
            <button
              onClick={handleFavClick}
              disabled={togglingFav}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.75rem', marginBottom: '1rem',
                backgroundColor: isFavourited(tutor._id) ? '#fff1f2' : 'white',
                color: isFavourited(tutor._id) ? '#e94560' : C.gray500,
                border: `1.5px solid ${isFavourited(tutor._id) ? '#fecdd3' : '#e5e7eb'}`,
                borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem',
                cursor: togglingFav ? 'not-allowed' : 'pointer',
              }}>
              <Heart size={16} fill={isFavourited(tutor._id) ? "#e94560" : "none"} />
              {isFavourited(tutor._id) ? "Saved to Favourites" : "Save to Favourites"}
            </button>
          )}

          <div style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.75rem', border: '1px solid #e5e7eb', position: 'sticky', top: '90px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: C.primary, marginBottom: '0.5rem' }}>Book a Session</h3>
            <p style={{ color: C.gray500, fontSize: '0.875rem', marginBottom: '1.5rem' }}>Send a direct booking request to this tutor.</p>
            <div style={{ borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', padding: '1rem 0', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: C.gray500, fontSize: '0.875rem' }}>Hourly Rate</span>
                <span style={{ fontWeight: '700', color: C.primary }}>Rs. {tutor.hourlyRate?.toLocaleString()}/hr</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.gray500, fontSize: '0.875rem' }}>Mode</span>
                <span style={{ fontWeight: '600', color: C.primary, textTransform: 'capitalize', fontSize: '0.875rem' }}>{tutor.teachingMode}</span>
              </div>
            </div>

            {/* ── NEW: Book Now button — primary CTA ── */}
            <button
              onClick={() => setShowBookingModal(true)}
              style={{ display: 'block', width: '100%', textAlign: 'center', backgroundColor: C.accent, color: 'white', padding: '0.875rem', borderRadius: '0.5rem', fontWeight: '700', border: 'none', fontSize: '0.95rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
              Book Now
            </button>
          </div>
        </div>

        {/* ── NEW: Direct Booking Modal ── */}
        {showBookingModal && tutor.user && (
          <DirectBookingModal
            tutorId={tutor.user._id}
            tutorUserId={tutor.user._id}
            tutorName={tutor.user.name}
            hourlyRate={tutor.hourlyRate}
            tutorSubjects={tutor.subjects || []}
            tutorTeachingMode={tutor.teachingMode}
            tutorCity={tutor.city}
            onClose={() => setShowBookingModal(false)}
            onSuccess={() => {}}
          />
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .tutor-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}