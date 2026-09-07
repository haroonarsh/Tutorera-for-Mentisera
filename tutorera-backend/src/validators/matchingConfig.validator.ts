import { z } from "zod";

const weights = z.object({
  subject: z.number().min(0).max(40),
  levelCurriculum: z.number().min(0).max(40),
  availability: z.number().min(0).max(40),
  mode: z.number().min(0).max(40),
  budget: z.number().min(0).max(40),
  location: z.number().min(0).max(40),
  language: z.number().min(0).max(40),
  quality: z.number().min(0).max(40),
  experience: z.number().min(0).max(40),
  reliability: z.number().min(0).max(40),
  verification: z.number().min(0).max(40),
}).strict().refine(
  (value) => Object.values(value).reduce((sum, weight) => sum + weight, 0) === 100,
  { message: "Matching weights must total exactly 100 points." }
);

export const matchingConfigUpdateSchema = z.object({
  algorithmVersion: z.string().trim().min(1).max(50),
  onlineWeights: weights,
  homeWeights: weights,
  thresholds: z.object({
    excellent: z.number().min(1).max(100),
    strong: z.number().min(1).max(100),
    good: z.number().min(1).max(100),
    notificationMinimum: z.number().min(0).max(100),
    maxOffers: z.number().int().min(1).max(20),
  }).strict().refine(
    (value) => value.excellent > value.strong && value.strong > value.good && value.good >= value.notificationMinimum,
    { message: "Thresholds must descend from excellent to notification minimum." }
  ),
  bayesian: z.object({
    globalMeanRating: z.number().min(1).max(5),
    minReviewThreshold: z.number().int().min(1).max(100),
  }).strict(),
  coldStart: z.object({
    explorationRatio: z.number().min(0).max(0.5),
    newTutorDaysWindow: z.number().int().min(1).max(365),
    newTutorQualityScore: z.number().min(1).max(5),
  }).strict(),
}).strict();

export function formatMatchingConfigError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(" ");
}
