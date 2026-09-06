// src/config/matchingConfig.ts
// Centralized, configurable weights, thresholds, and Bayesian constants for TUTORERA Smart Matching Engine

export interface MatchingWeights {
  subject: number;
  levelCurriculum: number;
  availability: number;
  mode: number;
  budget: number;
  location: number;
  language: number;
  quality: number;
  experience: number;
  reliability: number;
  verification: number;
}

export interface MatchingConfigData {
  algorithmVersion: string;
  onlineWeights: MatchingWeights;
  homeWeights: MatchingWeights;
  thresholds: {
    excellent: number;
    strong: number;
    good: number;
    notificationMinimum: number;
  };
  bayesian: {
    globalMeanRating: number;
    minReviewThreshold: number;
  };
  coldStart: {
    explorationRatio: number; // 0.15 = 15% exploration
    newTutorDaysWindow: number; // 30 days
    newTutorQualityScore: number; // 4.85
  };
}

export const DEFAULT_MATCHING_CONFIG: MatchingConfigData = {
  algorithmVersion: "RULE_V1",
  onlineWeights: {
    subject: 20,
    levelCurriculum: 16,
    availability: 15, // includes timezone alignment
    mode: 10,
    budget: 12,
    location: 0, // location not weighted for online
    language: 7,
    quality: 8, // Bayesian rating + degrees
    experience: 5,
    reliability: 5,
    verification: 2,
  },
  homeWeights: {
    subject: 18,
    levelCurriculum: 14,
    availability: 14,
    mode: 10,
    budget: 10,
    location: 15, // proximity & travel radius
    language: 5,
    quality: 6,
    experience: 4,
    reliability: 2,
    verification: 2,
  },
  thresholds: {
    excellent: 90,
    strong: 80,
    good: 70,
    notificationMinimum: 60,
  },
  bayesian: {
    globalMeanRating: 4.85,
    minReviewThreshold: 5,
  },
  coldStart: {
    explorationRatio: 0.15,
    newTutorDaysWindow: 30,
    newTutorQualityScore: 4.85,
  },
};

// Subject Alias & Domain Specialization Map
export const SUBJECT_ALIASES: Record<string, { primary: string; related: string[] }> = {
  mathematics: { primary: "Mathematics", related: ["Calculus", "Algebra", "Statistics", "Geometry", "Trigonometry"] },
  calculus: { primary: "Calculus", related: ["Mathematics", "Algebra"] },
  algebra: { primary: "Algebra", related: ["Mathematics", "Calculus"] },
  statistics: { primary: "Statistics", related: ["Mathematics", "Data Science", "Economics"] },
  physics: { primary: "Physics", related: ["General Science", "Mechanics", "Electronics"] },
  chemistry: { primary: "Chemistry", related: ["General Science", "Organic Chemistry", "Biochemistry"] },
  biology: { primary: "Biology", related: ["General Science", "Zoology", "Botany", "MDCAT"] },
  english: { primary: "English", related: ["IELTS", "Spoken English", "Grammar", "Literature"] },
  ielts: { primary: "IELTS", related: ["English", "Spoken English", "TOEFL"] },
  "computer science": { primary: "Computer Science", related: ["Programming", "Coding", "Python", "Web Development"] },
  accounting: { primary: "Accounting", related: ["Finance", "Commerce", "Economics"] },
  economics: { primary: "Economics", related: ["Commerce", "Business Studies", "Finance"] },
  mdcat: { primary: "MDCAT", related: ["Biology", "Chemistry", "Physics"] },
  ecat: { primary: "ECAT", related: ["Mathematics", "Physics", "Chemistry"] },
  sat: { primary: "SAT", related: ["Mathematics", "English"] },
};

// Academic Level Hierarchy & Compatibility
export const LEVEL_HIERARCHY: Record<string, number> = {
  Primary: 1,
  Middle: 2,
  Matric: 3,
  "O-Level": 3,
  Intermediate: 4,
  "A-Level": 4,
  University: 5,
  Other: 3,
};
