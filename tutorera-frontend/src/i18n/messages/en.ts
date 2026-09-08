export const en = {
  navigation: { postRequirement: "Post requirement", browseTutors: "Browse tutors", tutoringIndex: "Global Tutoring Index" },
  marketplace: { promise: "You set the requirement. Tutors make offers. You choose.", betaTitle: "Discovery beta", betaAcceptanceUnavailable: "You can discover tutors, post requirements, receive offers, and negotiate here. Acceptance and payment will open after a compliant local provider is configured." },
  geography: { country: "Country", region: "Region", city: "City", locality: "Area or locality", searchCities: "Search cities" },
  common: { loading: "Loading", retry: "Try again", unavailable: "Not available yet" },
} as const;

export type Messages = typeof en;
