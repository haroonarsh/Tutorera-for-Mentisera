export type EligibilityParams = {
  activeApprovedTutors?: number;
  recentStudentRequests?: number;
  homeTuitionEnabled?: boolean;
};

export class SeoEligibilityService {
  /**
   * Determines if a dynamically generated page (e.g., city, subject) 
   * meets the marketplace supply/demand thresholds to be indexed.
   */
  static evaluatePage(params: EligibilityParams): "INDEX" | "NOINDEX_FOLLOW" | "DO_NOT_GENERATE" {
    const {
      activeApprovedTutors = 0,
      recentStudentRequests = 0,
      homeTuitionEnabled = true,
    } = params;

    // Must have at least 3 active approved tutors OR meaningful student demand
    if (activeApprovedTutors >= 3 || recentStudentRequests > 0) {
      if (homeTuitionEnabled) {
        return "INDEX";
      }
    }

    // If there is some minor supply, allow browsing but NOINDEX
    if (activeApprovedTutors > 0) {
      return "NOINDEX_FOLLOW";
    }

    // If completely dead zone, do not generate
    return "NOINDEX_FOLLOW"; // In a full implementation, we might return DO_NOT_GENERATE based on stricter rules
  }

  static getRobotsTag(eligibility: "INDEX" | "NOINDEX_FOLLOW" | "DO_NOT_GENERATE"): string {
    if (eligibility === "INDEX") return "index, follow";
    return "noindex, follow";
  }
}
