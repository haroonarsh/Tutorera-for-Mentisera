"use client";
// components/tutors/TutorCard.tsx
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { TutorProfile } from "@/types/tutor";
import StarRating from "./StarRating";
import { useFavourites } from "@/hooks/useFavourites";
import { tutorProfileHref } from "@/lib/tutor-directory";
import styles from "./Tutorcard.module.css";

interface TutorCardProps {
  tutor: TutorProfile;
}

function getModeClass(mode: TutorProfile["teachingMode"]): string {
  // CSS modules: return the right class for each mode
  const map = {
    online: styles.modeOnline,
    "in-person": styles.modeInPerson,
    both: styles.modeBoth,
  };
  return map[mode] ?? styles.modeOnline;
}

function getModeLabel(mode: TutorProfile["teachingMode"]): string {
  if (mode === "both") return "Online & In-Person";
  if (mode === "online") return "Online";
  return "In-Person";
}

export default function TutorCard({ tutor }: TutorCardProps) {
  const { isFavourited, toggleFavourite, isStudent } = useFavourites();
  const favourited = isFavourited(tutor._id);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();   // don't navigate to profile when clicking heart
    e.stopPropagation();
    toggleFavourite(tutor._id);
  };
  
  return (
    <Link href={tutorProfileHref(tutor)} className={styles.card} style={{ position: 'relative' }}>
      {/* Verified badge */}
      {tutor.isVerified && (
        <span className={styles.verifiedBadge} aria-label="Verified tutor">
          <svg width={10} height={10} viewBox="0 0 20 20" fill="white" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Verified
        </span>
      )}

            {/* ── NEW: Favourite heart button — only for students ── */}
      {isStudent && (
        <button
          onClick={handleHeartClick}
          aria-label={favourited ? "Remove from favourites" : "Add to favourites"}
          style={{
            position: 'absolute', top: '12px', left: '12px', zIndex: 2,
            width: '32px', height: '32px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Heart
            size={16}
            color={favourited ? "#C81B7F" : "#9ca3af"}
            fill={favourited ? "#C81B7F" : "none"}
          />
        </button>
      )}

      {/* Avatar + Name + City */}
      <div className={styles.topRow}>
        <div className={styles.avatarWrap}>
          {tutor.user.avatar ? (
            <Image
              src={tutor.user.avatar}
              alt={`${tutor.user.name}'s avatar`}
              width={64}
              height={64}
              sizes="64px"
              className={styles.avatarImg}
            />
          ) : (
            <div className={styles.avatarInitial} aria-hidden="true">
              {tutor.user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className={styles.nameBlock}>
          <h3 className={styles.name}>{tutor.user.name}</h3>
          <div className={styles.cityRow}>
            <svg width={13} height={13} viewBox="0 0 20 20" fill="#9ca3af" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span className={styles.cityText}>{tutor.city}</span>
          </div>
        </div>
      </div>

      {/* Rating + Teaching mode */}
      <div className={styles.ratingRow}>
        <div className={styles.ratingLeft}>
          <StarRating rating={tutor.averageRating} />
          <span className={styles.ratingValue}>{tutor.averageRating.toFixed(1)}</span>
          <span className={styles.ratingCount}>({tutor.totalReviews})</span>
        </div>
        <span className={`${styles.modeBadge} ${getModeClass(tutor.teachingMode)}`}>
          {getModeLabel(tutor.teachingMode)}
        </span>
      </div>

      {/* Bio */}
      <p className={styles.bio}>
        {tutor.bio || "Experienced tutor ready to help students excel."}
      </p>

      {/* Subjects */}
      <div className={styles.tagRow}>
        {tutor.subjects.slice(0, 4).map((subject) => (
          <span key={subject} className={styles.tagBlue}>
            {subject}
          </span>
        ))}
        {tutor.subjects.length > 4 && (
          <span className={styles.tagGray}>+{tutor.subjects.length - 4}</span>
        )}
      </div>

      {/* Levels */}
      {tutor.levels.length > 0 && (
        <div className={styles.tagRow}>
          {tutor.levels.slice(0, 3).map((lvl) => (
            <span key={lvl} className={styles.tagGray}>
              {lvl}
            </span>
          ))}
        </div>
      )}

      {/* Price + CTA */}
      <div className={styles.footer}>
        <div>
          <span className={styles.price}>
            PKR {tutor.hourlyRate.toLocaleString()}
          </span>
          <span className={styles.priceUnit}>/hr</span>
        </div>
        <span className={styles.cta}>View Profile</span>
      </div>
    </Link>
  );
}
