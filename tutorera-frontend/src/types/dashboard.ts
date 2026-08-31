// types/dashboard.ts

export interface DashRequest {
  _id: string;
  student: { _id: string; name: string; avatar: string };
  subject: string;
  level: string;
  description: string;
  budget: number;
  maximumBudget?: number;
  pricingUnit: "hour" | "session" | "month" | "course";
  allowCounterOffers: boolean;
  classGrade?: string; curriculum?: string; examType?: string; studentLevel?: string; learningObjectives?: string;
  area?: string; travelRadiusKm?: number; tutorGenderPreference?: "male" | "female" | "none";
  minimumQualification?: string; minimumExperience?: number; preferredLanguage?: string; preferredTutorRating?: number;
  preferredDays?: string[]; preferredStartTime?: string; sessionDurationMinutes?: number; sessionsPerWeek?: number; expectedStartDate?: string;
  teachingMode: string;
  city: string;
  schedule: string;
  status: "draft" | "open" | "published" | "receiving_offers" | "negotiating" | "offer_accepted" | "awaiting_payment" | "booked" | "in_progress" | "completed" | "closed" | "cancelled" | "expired" | "disputed" | "archived";
  createdAt: string;
  bid?: Pick<DashBid, "_id" | "amount" | "status" | "expiresAt" | "pricingUnit" | "createdAt"> | null;
}

export interface DashBid {
  _id: string;
  request: string;
  tutor: { _id: string; name: string; city: string; avatar: string };
  amount: number;
  initialStudentRate: number;
  pricingUnit: "hour" | "session" | "month" | "course";
  availability?: string;
  expiresAt: string;
  matchScore?: number;
  matchScoreBreakdown?: Record<string, number>;
  completedSessions?: number;
  responseRate?: number;
  responseSeconds?: number;
  counterCounts?: { student: number; tutor: number };
  latestSenderRole?: "student" | "tutor";
  profile?: { education?: { degree: string; institution: string }[]; experience?: number; subjects?: string[]; teachingMode?: string; averageRating?: number; totalReviews?: number; isVerified?: boolean; verificationStatus?: string };
  message: string;
  status: "pending" | "submitted" | "viewed" | "countered" | "accepted" | "rejected" | "withdrawn" | "expired" | "not_selected";
  createdAt: string;
}

export interface DashBooking {
  _id: string;
  student: { _id: string; name: string; avatar: string };
  tutor:   { _id: string; name: string; avatar: string };
  request: string | { _id: string; subject: string; level: string; status: string };
  bid: string;
  amount: number;
  finalAgreedRate?: number; pricingUnit?: "hour" | "session" | "month" | "course"; sessionCount?: number; subtotal?: number; studentFee?: number; tutorFee?: number; tax?: number; studentTotal?: number; tutorNet?: number;
  schedule: string;
  teachingMode: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  paymentStatus: "pending" | "received" | "confirmed" | "refunded";
  isFirstSession: boolean;
  createdAt: string;
}

export interface TutorProfileData {
  _id: string;
  user: {
    _id: string; name: string; email: string;
    phone?: string; city: string; avatar: string;
  };
  bio: string;
  subjects: string[];
  levels: string[];
  hourlyRate: number;
  experience: number;
  teachingMode: string;
  city: string;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  verificationStatus: string;
  education: { degree: string; institution: string; year: number; _id: string }[];
  availability: { day: string; slots: string[]; _id: string }[];
}

export interface PostRequestPayload {
  subject: string;
  level: string;
  description: string;
  budget: string;
  teachingMode: string;
  city: string;
  schedule: string;
  maximumBudget: string; pricingUnit: "hour" | "session" | "month" | "course"; allowCounterOffers: boolean;
  classGrade: string; curriculum: string; examType: string; studentLevel: string; learningObjectives: string;
  area: string; travelRadiusKm: string; tutorGenderPreference: "male" | "female" | "none";
  minimumQualification: string; minimumExperience: string; preferredLanguage: string; preferredTutorRating: string;
  preferredDays: string[]; preferredStartTime: string; sessionDurationMinutes: string; sessionsPerWeek: string; expectedStartDate: string;
}

export interface PlaceBidPayload {
  amount: string;
  message: string;
}

export interface DashDirectRequest extends DashRequest {
  isDirect: true;
  bid: DashBid | null;
}
