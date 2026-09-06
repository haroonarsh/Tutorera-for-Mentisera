import mongoose, { Schema, Document } from "mongoose";
import { DEFAULT_MATCHING_CONFIG, MatchingConfigData } from "../config/matchingConfig";

export interface IMatchingConfigDocument extends Document, MatchingConfigData {
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const matchingWeightsSchema = new Schema(
  {
    subject: { type: Number, required: true },
    levelCurriculum: { type: Number, required: true },
    availability: { type: Number, required: true },
    mode: { type: Number, required: true },
    budget: { type: Number, required: true },
    location: { type: Number, required: true },
    language: { type: Number, required: true },
    quality: { type: Number, required: true },
    experience: { type: Number, required: true },
    reliability: { type: Number, required: true },
    verification: { type: Number, required: true },
  },
  { _id: false }
);

const matchingConfigSchema = new Schema<IMatchingConfigDocument>(
  {
    algorithmVersion: { type: String, default: DEFAULT_MATCHING_CONFIG.algorithmVersion },
    onlineWeights: { type: matchingWeightsSchema, default: () => ({ ...DEFAULT_MATCHING_CONFIG.onlineWeights }) },
    homeWeights: { type: matchingWeightsSchema, default: () => ({ ...DEFAULT_MATCHING_CONFIG.homeWeights }) },
    thresholds: {
      excellent: { type: Number, default: DEFAULT_MATCHING_CONFIG.thresholds.excellent },
      strong: { type: Number, default: DEFAULT_MATCHING_CONFIG.thresholds.strong },
      good: { type: Number, default: DEFAULT_MATCHING_CONFIG.thresholds.good },
      notificationMinimum: { type: Number, default: DEFAULT_MATCHING_CONFIG.thresholds.notificationMinimum },
    },
    bayesian: {
      globalMeanRating: { type: Number, default: DEFAULT_MATCHING_CONFIG.bayesian.globalMeanRating },
      minReviewThreshold: { type: Number, default: DEFAULT_MATCHING_CONFIG.bayesian.minReviewThreshold },
    },
    coldStart: {
      explorationRatio: { type: Number, default: DEFAULT_MATCHING_CONFIG.coldStart.explorationRatio },
      newTutorDaysWindow: { type: Number, default: DEFAULT_MATCHING_CONFIG.coldStart.newTutorDaysWindow },
      newTutorQualityScore: { type: Number, default: DEFAULT_MATCHING_CONFIG.coldStart.newTutorQualityScore },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<IMatchingConfigDocument>("MatchingConfig", matchingConfigSchema);
