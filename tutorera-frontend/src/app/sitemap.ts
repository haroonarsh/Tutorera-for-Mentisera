import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { CITIES, LEVELS, LOCAL_SUBJECT_SLUGS, PRIMARY_CITY_SLUGS, SUBJECTS, fetchTutors, tutorProfileSlug } from "@/lib/tutor-directory";

const routes = [
  "", "online-tutors", "about", "become-a-tutor", "blog", "business-model", "contact", "coverage", "first-session-guarantee", "team",
  "help", "help/for-parents", "help/for-tutors", "how-it-works", "how-tutor-offers-work", "levels", "locations", "pricing",
  "payment-process", "refund-policy", "safety-policy", "services", "student-journey", "subjects", "tutors", "terms", "privacy", "complaint-process", "cancellation-policy",
  "tutor-verification-standards", "in-person-home-tuition-terms", "review-policy", "editorial-policy", "academic-standards",
  "content-review-policy", "research-methodology", "tutor-screening-policy", "governance",
  "tuition-requests", "tuition-requests/pk", "tuition-requests/pk/lahore", "tuition-requests/pk/islamabad", "tuition-requests/pk/karachi",
  "blog/how-to-find-a-trusted-tutor-in-pakistan", "blog/online-vs-home-tuition-in-pakistan",
  "blog/what-to-look-for-before-hiring-a-tutor-pakistan",
];

const TARGET_COUNTRIES = ["pk", "ae", "gb"] as const;
const HOME_TUTOR_CITY_SLUGS = ["lahore", "islamabad", "karachi"] as const;

export async function generateSitemaps() {
  return [
    { id: 'core' },
    { id: 'local' },
    { id: 'demand' },
    { id: 'tutors' }
  ];
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date(); // In the future this should come from database max(updatedAt)

  if (id === 'core') {
    const staticPages: MetadataRoute.Sitemap = routes.map((route) => ({
      url: `${SITE_URL}/${route}`,
      lastModified,
      changeFrequency: route === "" || route === "tutors" || route === "online-tutors" ? "daily" : "monthly",
      priority: route === "" ? 1 : route === "tutors" || route === "online-tutors" ? 0.9 : 0.7,
    }));
    
    const directories: MetadataRoute.Sitemap = [
      ...Object.keys(SUBJECTS).map((slug) => `/tutors/subject/${slug}`),
      ...Object.keys(CITIES).map((slug) => `/tutors/city/${slug}`),
      ...Object.keys(LEVELS).map((slug) => `/tutors/level/${slug}`),
    ].map((path) => ({ url: `${SITE_URL}${path}`, lastModified, changeFrequency: "daily", priority: 0.8 }));

    const countryHubResults = await Promise.all(
      TARGET_COUNTRIES.map(async (code) => {
        const { total } = await fetchTutors({ countryCode: code.toUpperCase() }, 1);
        return code === "pk" || total > 0
          ? {
              url: `${SITE_URL}/${code}/tutors`,
              lastModified,
              changeFrequency: "daily" as const,
              priority: 0.85,
            }
          : null;
      })
    );

    const homeTutorResults = await Promise.all(
      HOME_TUTOR_CITY_SLUGS.map(async (citySlug) => {
        const city = CITIES[citySlug];
        const { total } = await fetchTutors({ countryCode: "PK", city, teachingMode: "in-person" }, 1);
        return total > 0
          ? {
              url: `${SITE_URL}/pk/home-tutors/${citySlug}`,
              lastModified,
              changeFrequency: "daily" as const,
              priority: 0.9,
            }
          : null;
      })
    );

    const research: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/research/pakistan-tutoring-rates`, lastModified, changeFrequency: "weekly", priority: 0.75 },
      { url: `${SITE_URL}/research/tutoring-index`, lastModified, changeFrequency: "weekly", priority: 0.75 },
    ];

    return [
      ...staticPages,
      ...directories,
      ...countryHubResults.filter((page): page is NonNullable<typeof page> => page !== null),
      ...homeTutorResults.filter((page): page is NonNullable<typeof page> => page !== null),
      ...research
    ];
  }

  if (id === 'local') {
    const localResults = await Promise.all(
      PRIMARY_CITY_SLUGS.flatMap((citySlug) =>
        LOCAL_SUBJECT_SLUGS.map(async (subjectSlug) => {
          const city = CITIES[citySlug];
          const subject = SUBJECTS[subjectSlug];
          const { total } = await fetchTutors({ city, subject }, 1);
          return total > 0
            ? {
                url: `${SITE_URL}/tutors/city/${citySlug}/${subjectSlug}`,
                lastModified,
                changeFrequency: "daily" as const,
                priority: 0.85,
              }
            : null;
        })
      )
    );
    return localResults.filter((page): page is NonNullable<typeof page> => page !== null);
  }

  if (id === 'demand') {
    const TARGET_DEMAND_SLUGS = PRIMARY_CITY_SLUGS.flatMap((citySlug) =>
      LOCAL_SUBJECT_SLUGS.map((subjectSlug) => ({ citySlug, subjectSlug }))
    );

    const tuitionRequestDemandPages: MetadataRoute.Sitemap = TARGET_DEMAND_SLUGS.map(({ citySlug, subjectSlug }) => ({
      url: `${SITE_URL}/tuition-requests/pk/${citySlug}/${subjectSlug}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
    
    return tuitionRequestDemandPages;
  }

  if (id === 'tutors') {
    // Note: We might want to segment this further in the future as tutor count grows > 50k
    const { tutors } = await fetchTutors({}, 500);
    const profiles: MetadataRoute.Sitemap = tutors.map((tutor) => ({
      url: `${SITE_URL}/tutors/${tutorProfileSlug(tutor)}`,
      lastModified: tutor.updatedAt ? new Date(tutor.updatedAt) : lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    
    return profiles;
  }

  return [];
}
