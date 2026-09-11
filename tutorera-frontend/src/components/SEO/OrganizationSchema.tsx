import Script from "next/script";

export default function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TUTORERA",
    "url": "https://tutorera.ac.pk",
    "logo": "https://tutorera.ac.pk/logo.png",
    "description": "TUTORERA is a global two-sided tutoring marketplace that connects students and parents seeking online tutoring or locally available home tuition with tutors seeking relevant teaching opportunities. Students post learning requirements, suitable tutors respond with offers, and both sides compare, agree and book through TUTORERA.",
    "sameAs": [
      "https://www.facebook.com/tutorerapk",
      "https://www.instagram.com/tutorera.pk",
      "https://www.linkedin.com/company/tutorera"
    ]
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
