import mongoose from "mongoose";
import dotenv from "dotenv";
import RecurringPlan from "../src/models/RecurringPlan.model";

dotenv.config();

const defaultPlans = [
  {
    name: "Weekly Starter",
    type: "weekly",
    sessionCount: 4,
    durationWeeks: 4,
    pricePerSession: 0,
    totalPrice: 0,
    discountPercent: 0,
    description: "One session per week for a month",
    isActive: true,
  },
  {
    name: "Twice Weekly Intensive",
    type: "twice_weekly",
    sessionCount: 8,
    durationWeeks: 4,
    pricePerSession: 0,
    totalPrice: 0,
    discountPercent: 0,
    description: "Two sessions per week for faster progress",
    isActive: true,
  },
  {
    name: "4-Session Package",
    type: "package_4",
    sessionCount: 4,
    durationWeeks: 8,
    pricePerSession: 0,
    totalPrice: 0,
    discountPercent: 0,
    description: "Flexible 4-session package, use within 2 months",
    isActive: true,
  },
  {
    name: "8-Session Package",
    type: "package_8",
    sessionCount: 8,
    durationWeeks: 16,
    pricePerSession: 0,
    totalPrice: 0,
    discountPercent: 0,
    description: "Best value - 8 sessions to use over 4 months",
    isActive: true,
  },
  {
    name: "Monthly Plan",
    type: "monthly",
    sessionCount: 12,
    durationWeeks: 4,
    pricePerSession: 0,
    totalPrice: 0,
    discountPercent: 0,
    description: "Intensive daily sessions for exam preparation",
    isActive: true,
  },
];

async function seed() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGO_URI not set in environment");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  for (const plan of defaultPlans) {
    await RecurringPlan.findOneAndUpdate(
      { type: plan.type },
      plan,
      { upsert: true, new: true }
    );
    console.log(`Upserted plan: ${plan.name} (${plan.type})`);
  }

  console.log("Seeding complete!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
