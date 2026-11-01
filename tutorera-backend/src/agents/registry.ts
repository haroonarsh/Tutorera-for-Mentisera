import { AgentDefinition } from "./types";

export const AGENT_REGISTRY: AgentDefinition[] = [
  {
    id: "tutor-operations",
    name: "Tutor Operations Agent",
    description: "Monitors and analyses tutor registrations, verification status, profile completeness, subject coverage, and onboarding health.",
    capabilities: [
      { name: "tutor_counts", description: "Total, active, inactive, and pending-verification tutor counts" },
      { name: "profile_completeness", description: "Tutors with incomplete profiles or missing documents" },
      { name: "subject_coverage", description: "Subject and curriculum distribution across tutors" },
      { name: "geo_distribution", description: "Tutor distribution by country and city" },
      { name: "onboarding_bottlenecks", description: "Onboarding step breakdown and blockers" },
      { name: "public_eligibility", description: "Public profile eligibility indicators" },
      { name: "anomalies", description: "Operational anomalies in tutor accounts" },
    ],
    status: "active",
  },
  {
    id: "student-operations",
    name: "Student Operations Agent",
    description: "Provides administrative intelligence about student accounts, registration trends, subject demand, and engagement.",
    capabilities: [
      { name: "student_counts", description: "Total, active, inactive student registrations" },
      { name: "onboarding_status", description: "Student onboarding completion rates" },
      { name: "geo_distribution", description: "Student distribution by country and city" },
      { name: "subject_demand", description: "Subject and curriculum demand from students" },
      { name: "awaiting_match", description: "Students with open unmatched requests" },
      { name: "registration_trends", description: "Registration trends over time" },
    ],
    status: "active",
  },
  {
    id: "booking-learning",
    name: "Booking & Learning Operations Agent",
    description: "Analyses tutoring requests, bookings, lessons, conversion rates, and unmatched demand.",
    capabilities: [
      { name: "booking_counts", description: "Total, pending, accepted, rejected, cancelled, completed bookings" },
      { name: "conversion_rate", description: "Request-to-booking conversion rate" },
      { name: "response_times", description: "Tutor response time statistics" },
      { name: "unmatched_requests", description: "Open requests with no accepted offers" },
      { name: "subject_demand", description: "Subject-level booking demand" },
      { name: "booking_trends", description: "Booking trends over time periods" },
    ],
    status: "active",
  },
  {
    id: "platform-intelligence",
    name: "Platform Intelligence & Compliance Agent",
    description: "Monitors platform-wide KPIs, admin workload, data quality, role anomalies, and operational risk indicators.",
    capabilities: [
      { name: "platform_kpis", description: "Platform-wide operational KPIs" },
      { name: "verification_trends", description: "Account verification trends and backlog" },
      { name: "data_quality", description: "Data completeness and quality inconsistencies" },
      { name: "role_anomalies", description: "Role and permission anomalies" },
      { name: "compliance_indicators", description: "Public profile compliance indicators" },
      { name: "risk_indicators", description: "Operational risk signals" },
      { name: "audit_summary", description: "Audit-log summaries" },
    ],
    status: "active",
  },
];

export function getAgentById(id: string): AgentDefinition | undefined {
  return AGENT_REGISTRY.find((a) => a.id === id);
}

// Intent → agent routing via keyword matching (deterministic, no LLM required)
const INTENT_PATTERNS: { pattern: RegExp; agents: string[] }[] = [
  { pattern: /tutor|verif|profile|subject|curriculum|onboard|document|eligib/i, agents: ["tutor-operations"] },
  { pattern: /student|learner|parent|enrol|registr|demand|match/i, agents: ["student-operations"] },
  { pattern: /book|lesson|session|request|offer|conver|response.?time|unmatched/i, agents: ["booking-learning"] },
  { pattern: /platform|kpi|metric|health|compli|risk|data.?quality|audit|role|permission/i, agents: ["platform-intelligence"] },
  { pattern: /overview|summary|report|dashboard|all|everything|status/i, agents: ["tutor-operations", "student-operations", "booking-learning", "platform-intelligence"] },
];

export function classifyIntent(query: string): { selectedAgents: string[]; reasoning: string } {
  const matched = new Set<string>();
  const matchedPatterns: string[] = [];

  for (const { pattern, agents } of INTENT_PATTERNS) {
    if (pattern.test(query)) {
      agents.forEach((a) => matched.add(a));
      matchedPatterns.push(pattern.source);
    }
  }

  if (matched.size === 0) {
    // Default: delegate to all agents for unrecognised queries
    AGENT_REGISTRY.forEach((a) => matched.add(a.id));
    return {
      selectedAgents: Array.from(matched),
      reasoning: "Query did not match specific patterns — routing to all agents for comprehensive coverage.",
    };
  }

  return {
    selectedAgents: Array.from(matched),
    reasoning: `Matched patterns: ${matchedPatterns.join(", ")}`,
  };
}
