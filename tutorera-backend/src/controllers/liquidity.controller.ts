import { Response } from "express";
import { AuthRequest } from "../types";
import { computeLiquidityScore, getAllLiquidityScores } from "../services/liquidityScore.service";

export const getLiquidityScore = async (req: AuthRequest, res: Response): Promise<void> => {
  const { city, subject, teachingMode } = req.query;

  const score = await computeLiquidityScore({
    city: city as string,
    subject: subject as string,
    teachingMode: teachingMode as string,
    countryCode: req.query.countryCode as string,
  });

  res.status(200).json({ success: true, score });
};

export const getMarketLiquidityOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  const { countryCode } = req.query;

  const scores = await getAllLiquidityScores(countryCode as string);

  const entries = Object.entries(scores);
  if (entries.length === 0) {
    res.status(200).json({ success: true, scores: [], summary: { avgScore: 0, high: 0, moderate: 0, low: 0 } });
    return;
  }

  const values = entries.map(([, v]) => v.score);
  const avgScore = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
  const high = entries.filter(([, v]) => v.grade === "High").length;
  const moderate = entries.filter(([, v]) => v.grade === "Moderate").length;
  const low = entries.filter(([, v]) => v.grade === "Low" || v.grade === "Very Low").length;

  res.status(200).json({
    success: true,
    scores,
    summary: {
      avgScore,
      totalSegments: entries.length,
      high,
      moderate,
      low,
    },
  });
};
