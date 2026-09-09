// backend/src/config/geo/location.ts
// Global location hierarchy — authoritative source of truth.
// Populated with launch markets; extended via GeoNames import script.

export interface Region {
  code: string; // ISO 3166-2 region code
  name: string;
}

export interface City extends Region {
  id?: string;
  region?: string; // parent region code (ISO 3166-2)
  coordinates?: [number, number]; // [lat, lng]
  areas?: string[];
}

export interface Country {
  code: string;         // ISO 3166-1 alpha-2
  name: string;
  currency: string;     // ISO 4217
  currencySymbol: string;
  phoneCode: string;
  timezone: string;     // IANA
  flag: string;
  curricula: string[];
  regions: Region[];
  cities: City[];
  homeTuitionEnabled: boolean;
  onlineEnabled: boolean;
  regulatory?: Record<string, unknown>;
}

// ─── Launch Market Dataset ────────────────────────────────────────────────────

const LAUNCH_COUNTRIES: Country[] = [
  {
    code: "PK",
    name: "Pakistan",
    currency: "PKR",
    currencySymbol: "Rs.",
    phoneCode: "+92",
    timezone: "Asia/Karachi",
    flag: "🇵🇰",
    curricula: [
      "Matric", "Intermediate / FSc", "Federal Board", "Punjab Board",
      "Sindh Board", "Cambridge O/A Levels", "Edexcel", "MDCAT / ECAT",
    ],
    regions: [
      { code: "PK-PB", name: "Punjab" },
      { code: "PK-SD", name: "Sindh" },
      { code: "PK-KP", name: "Khyber Pakhtunkhwa" },
      { code: "PK-BA", name: "Balochistan" },
      { code: "PK-IS", name: "Islamabad Capital Territory" },
    ],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "pk-lhe", code: "LHE", name: "Lahore", region: "PK-PB", areas: ["DHA", "Gulberg", "Model Town", "Johar Town", "Bahria Town", "Cantt", "Faisal Town", "WAPDA Town"] },
      { id: "pk-isb", code: "ISB", name: "Islamabad", region: "PK-IS", areas: ["F-6", "F-7", "F-8", "F-10", "F-11", "G-10", "G-11", "E-7", "E-11", "Bahria Town", "DHA Phase 2"] },
      { id: "pk-rwp", code: "RWP", name: "Rawalpindi", region: "PK-PB", areas: ["Saddar", "Bahria Town", "DHA", "Westridge", "Satellite Town", "Chaklala Scheme 3"] },
      { id: "pk-khi", code: "KHI", name: "Karachi", region: "PK-SD", areas: ["DHA", "Clifton", "Gulshan-e-Iqbal", "PECHS", "North Nazimabad", "Malir Cantt"] },
      { id: "pk-fsd", code: "FSD", name: "Faisalabad", region: "PK-PB", areas: ["Peoples Colony", "Madina Town", "Kohinoor City", "Civil Lines"] },
      { id: "pk-mul", code: "MUL", name: "Multan", region: "PK-PB", areas: ["Cantt", "Gulgasht Colony", "Bosan Road", "Model Town"] },
      { id: "pk-pew", code: "PEW", name: "Peshawar", region: "PK-KP", areas: ["Hayatabad", "University Town", "Cantt", "Warsak Road"] },
      { id: "pk-qta", code: "QTA", name: "Quetta", region: "PK-BA", areas: ["Cantt", "Jinnah Town", "Samungli Road", "Model Town"] },
      { id: "pk-skt", code: "SKT", name: "Sialkot", region: "PK-PB", areas: ["Cantt", "Model Town", "Sambrial", "Daska Road"] },
      { id: "pk-grw", code: "GRW", name: "Gujranwala", region: "PK-PB", areas: ["DC Colony", "Citi Housing", "Model Town", "Wapda Town"] },
      { id: "pk-hyd", code: "HYD", name: "Hyderabad", region: "PK-SD", areas: ["Latifabad", "Qasimabad", "Saddar", "Auto Bahn"] },
    ],
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    currency: "AED",
    currencySymbol: "AED",
    phoneCode: "+971",
    timezone: "Asia/Dubai",
    flag: "🇦🇪",
    curricula: ["British Curriculum", "American Curriculum", "IB", "MOE UAE Curriculum", "CBSE", "SABIS"],
    regions: [
      { code: "AE-DU", name: "Dubai" },
      { code: "AE-AZ", name: "Abu Dhabi" },
      { code: "AE-SH", name: "Sharjah" },
    ],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "ae-dxb", code: "DXB", name: "Dubai", region: "AE-DU", areas: ["Downtown", "JBR", "DIFC", "Silicon Oasis", "Mirdif", "Deira", "Bur Dubai", "Arabian Ranches"] },
      { id: "ae-auh", code: "AUH", name: "Abu Dhabi", region: "AE-AZ", areas: ["Al Reem Island", "Khalidiyah", "Al Mushrif", "Yas Island", "Saadiyat Island"] },
      { id: "ae-shj", code: "SHJ", name: "Sharjah", region: "AE-SH", areas: ["Al Nahda", "Al Khan", "Al Majaz", "Muwaileh"] },
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    currencySymbol: "£",
    phoneCode: "+44",
    timezone: "Europe/London",
    flag: "🇬🇧",
    curricula: ["GCSE", "A-Level", "IB", "Scottish Highers", "IGCSE", "Edexcel"],
    regions: [
      { code: "GB-ENG", name: "England" },
      { code: "GB-SCT", name: "Scotland" },
      { code: "GB-WLS", name: "Wales" },
    ],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "gb-lon", code: "LON", name: "London", region: "GB-ENG", areas: ["Central London", "East London", "West London", "North London", "South London"] },
      { id: "gb-mnc", code: "MAN", name: "Manchester", region: "GB-ENG", areas: ["City Centre", "Didsbury", "Salford", "Trafford"] },
      { id: "gb-brm", code: "BHX", name: "Birmingham", region: "GB-ENG", areas: ["City Centre", "Edgbaston", "Solihull", "Moseley"] },
    ],
  },
  {
    code: "US",
    name: "United States",
    currency: "USD",
    currencySymbol: "$",
    phoneCode: "+1",
    timezone: "America/New_York",
    flag: "🇺🇸",
    curricula: ["Common Core", "AP", "SAT Prep", "ACT Prep", "IB"],
    regions: [],
    homeTuitionEnabled: false,
    onlineEnabled: true,
    cities: [
      { id: "us-nyc", code: "NYC", name: "New York", areas: ["Manhattan", "Brooklyn", "Queens", "Bronx"] },
      { id: "us-lax", code: "LAX", name: "Los Angeles", areas: ["Downtown", "Hollywood", "Santa Monica", "Pasadena"] },
      { id: "us-chi", code: "CHI", name: "Chicago", areas: ["Downtown", "Lincoln Park", "Hyde Park", "Evanston"] },
    ],
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    currency: "SAR",
    currencySymbol: "SAR",
    phoneCode: "+966",
    timezone: "Asia/Riyadh",
    flag: "🇸🇦",
    curricula: ["Saudi MOE Curriculum", "IGCSE", "IB", "American Curriculum"],
    regions: [],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "sa-riy", code: "RIY", name: "Riyadh", areas: ["Al Olaya", "Al Malqa", "Al Nakheel", "Diplomatic Quarter"] },
      { id: "sa-jed", code: "JED", name: "Jeddah", areas: ["Al Rawdah", "Al Hamra", "Obhur", "Al Zahra"] },
    ],
  },
  {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    currencySymbol: "CA$",
    phoneCode: "+1",
    timezone: "America/Toronto",
    flag: "🇨🇦",
    curricula: ["Ontario Curriculum", "BC Curriculum", "IB", "AP"],
    regions: [],
    homeTuitionEnabled: false,
    onlineEnabled: true,
    cities: [
      { id: "ca-tor", code: "YYZ", name: "Toronto", areas: ["Downtown", "Scarborough", "North York", "Etobicoke", "Mississauga"] },
      { id: "ca-van", code: "YVR", name: "Vancouver", areas: ["Downtown", "Burnaby", "Richmond", "Surrey"] },
    ],
  },
  {
    code: "AU",
    name: "Australia",
    currency: "AUD",
    currencySymbol: "AU$",
    phoneCode: "+61",
    timezone: "Australia/Sydney",
    flag: "🇦🇺",
    curricula: ["ATAR", "HSC", "VCE", "IB"],
    regions: [],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "au-syd", code: "SYD", name: "Sydney", areas: ["CBD", "Inner West", "North Shore", "Eastern Suburbs", "Western Sydney"] },
      { id: "au-mel", code: "MEL", name: "Melbourne", areas: ["CBD", "Inner North", "South Yarra", "Brunswick", "Box Hill"] },
    ],
  },
  {
    code: "IN",
    name: "India",
    currency: "INR",
    currencySymbol: "₹",
    phoneCode: "+91",
    timezone: "Asia/Kolkata",
    flag: "🇮🇳",
    curricula: ["CBSE", "ICSE", "State Board", "IB", "JEE Prep", "NEET Prep"],
    regions: [],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "in-del", code: "DEL", name: "Delhi / NCR", areas: ["South Delhi", "Gurgaon", "Noida", "Dwarka"] },
      { id: "in-mum", code: "BOM", name: "Mumbai", areas: ["Bandra", "Andheri", "Dadar", "Thane", "Navi Mumbai"] },
      { id: "in-blr", code: "BLR", name: "Bengaluru", areas: ["Koramangala", "Indiranagar", "Whitefield", "Electronic City"] },
    ],
  },
];

// ─── Export ───────────────────────────────────────────────────────────────────

/** Map of ISO-3166-1 alpha-2 code → Country */
export const COUNTRIES: Record<string, Country> = Object.fromEntries(
  LAUNCH_COUNTRIES.map((c) => [c.code, c])
);

export function getCountryByCode(code?: string): Country | undefined {
  if (!code) return undefined;
  return COUNTRIES[code.toUpperCase()];
}

export function getCitiesForCountry(code?: string): City[] {
  const country = getCountryByCode(code);
  return country ? country.cities : [];
}

export function listAllCountries(): Country[] {
  return LAUNCH_COUNTRIES;
}

/** Supported currencies with static fallback rates (refreshed at runtime by exchangeRate.service) */
export const SUPPORTED_CURRENCIES: Record<string, { code: string; symbol: string; name: string; rateToUSD: number }> = {
  USD: { code: "USD", symbol: "$",     name: "US Dollar",          rateToUSD: 1.0    },
  PKR: { code: "PKR", symbol: "Rs.",   name: "Pakistani Rupee",    rateToUSD: 0.0036 },
  AED: { code: "AED", symbol: "AED",   name: "UAE Dirham",         rateToUSD: 0.272  },
  GBP: { code: "GBP", symbol: "£",     name: "British Pound",      rateToUSD: 1.31   },
  EUR: { code: "EUR", symbol: "€",     name: "Euro",               rateToUSD: 1.09   },
  SAR: { code: "SAR", symbol: "SAR",   name: "Saudi Riyal",        rateToUSD: 0.266  },
  CAD: { code: "CAD", symbol: "CA$",   name: "Canadian Dollar",    rateToUSD: 0.74   },
  AUD: { code: "AUD", symbol: "AU$",   name: "Australian Dollar",  rateToUSD: 0.67   },
  QAR: { code: "QAR", symbol: "QAR",   name: "Qatari Riyal",       rateToUSD: 0.274  },
  KWD: { code: "KWD", symbol: "KWD",   name: "Kuwaiti Dinar",      rateToUSD: 3.27   },
  OMR: { code: "OMR", symbol: "OMR",   name: "Omani Rial",         rateToUSD: 2.60   },
  BHD: { code: "BHD", symbol: "BHD",   name: "Bahraini Dinar",     rateToUSD: 2.65   },
  INR: { code: "INR", symbol: "₹",     name: "Indian Rupee",       rateToUSD: 0.012  },
  SGD: { code: "SGD", symbol: "SG$",   name: "Singapore Dollar",   rateToUSD: 0.77   },
  MYR: { code: "MYR", symbol: "RM",    name: "Malaysian Ringgit",  rateToUSD: 0.23   },
};

export const MASTER_SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English",
  "Computer Science", "Economics", "Accounting", "Business Studies",
  "Urdu", "Islamiyat", "Pakistan Studies", "Statistics", "Sociology",
  "Psychology", "History", "Geography", "MDCAT", "ECAT", "SAT",
  "IELTS", "Quran & Arabic", "General Science",
];

export const MASTER_LEVELS = [
  "Primary (Grades 1-5)", "Middle (Grades 6-8)", "Matric (9th & 10th)",
  "Intermediate / FSc", "O-Level (Cambridge / Edexcel)", "A-Level (Cambridge / Edexcel)",
  "IB (Middle Years / Diploma)", "University / Degree", "Test Preparation",
];
