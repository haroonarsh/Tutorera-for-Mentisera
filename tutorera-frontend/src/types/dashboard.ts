// types/dashboard.ts

export interface DashRequest {
  _id: string;
  student: { _id: string; name: string; avatar: string };
  subject: string;
  level: string;
  description: string;
  budget: number;
  teachingMode: string;
  city: string;
  schedule: string;
  status: "open" | "closed" | "cancelled";
  createdAt: string;
}

export interface DashBid {
  _id: string;
  request: string;
  tutor: { _id: string; name: string; city: string; avatar: string };
  amount: number;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface DashBooking {
  _id: string;
  student: { _id: string; name: string; avatar: string };
  tutor:   { _id: string; name: string; avatar: string };
  request: string;
  bid: string;
  amount: number;
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
}

export interface PlaceBidPayload {
  amount: string;
  message: string;
}

export interface DashDirectRequest extends DashRequest {
  isDirect: true;
  bid: DashBid | null;
}