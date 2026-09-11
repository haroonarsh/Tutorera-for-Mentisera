// src/lib/location.ts
// Shared Global Location, Currency, and Curriculum Master Dataset for Frontend

export interface CityData {
  id: string;
  name: string;
  region?: string;
  areas?: string[];
}

export interface CountryData {
  /** MongoDB Country id when supplied by the runtime GeoNames API. */
  id?: string;
  code: string; // ISO 3166-1 alpha-2
  name: string;
  currency: string; // ISO 4217
  currencySymbol: string;
  phoneCode: string;
  defaultTimezone: string; // IANA
  flag: string;
  curricula: string[];
  cities: CityData[];
  homeTuitionEnabled: boolean;
  onlineEnabled: boolean;
}

export type Country = CountryData;
export type City = CityData;

export const SUPPORTED_CURRENCIES: Record<string, { code: string; symbol: string; name: string; rateToUSD: number }> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", rateToUSD: 1.0 },
  PKR: { code: "PKR", symbol: "Rs.", name: "Pakistani Rupee", rateToUSD: 0.0036 },
  AED: { code: "AED", symbol: "AED", name: "UAE Dirham", rateToUSD: 0.272 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", rateToUSD: 1.31 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", rateToUSD: 1.09 },
  SAR: { code: "SAR", symbol: "SAR", name: "Saudi Riyal", rateToUSD: 0.266 },
  CAD: { code: "CAD", symbol: "CA$", name: "Canadian Dollar", rateToUSD: 0.74 },
  AUD: { code: "AUD", symbol: "AU$", name: "Australian Dollar", rateToUSD: 0.67 },
  QAR: { code: "QAR", symbol: "QAR", name: "Qatari Riyal", rateToUSD: 0.274 },
  KWD: { code: "KWD", symbol: "KWD", name: "Kuwaiti Dinar", rateToUSD: 3.27 },
  OMR: { code: "OMR", symbol: "OMR", name: "Omani Rial", rateToUSD: 2.60 },
  BHD: { code: "BHD", symbol: "BHD", name: "Bahraini Dinar", rateToUSD: 2.65 },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", rateToUSD: 0.012 },
  SGD: { code: "SGD", symbol: "SG$", name: "Singapore Dollar", rateToUSD: 0.77 },
  MYR: { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", rateToUSD: 0.23 },
};

export const COUNTRIES: CountryData[] = [
  {
    code: "PK",
    name: "Pakistan",
    currency: "PKR",
    currencySymbol: "Rs.",
    phoneCode: "+92",
    defaultTimezone: "Asia/Karachi",
    flag: "🇵🇰",
    curricula: ["Matric", "Intermediate / FSc", "Federal Board", "Punjab Board", "Sindh Board", "Cambridge O/A Levels", "Edexcel", "MDCAT / ECAT"],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "pk-lhe", name: "Lahore", region: "Punjab", areas: ["DHA", "Gulberg", "Model Town", "Johar Town", "Bahria Town", "Cantt", "Faisal Town", "WAPDA Town"] },
      { id: "pk-isb", name: "Islamabad", region: "ICT", areas: ["F-6", "F-7", "F-8", "F-10", "F-11", "G-10", "G-11", "E-7", "E-11", "Bahria Town", "DHA Phase 2"] },
      { id: "pk-rwp", name: "Rawalpindi", region: "Punjab", areas: ["Saddar", "Bahria Town", "DHA", "Westridge", "Satellite Town", "Chaklala Scheme 3"] },
      { id: "pk-khi", name: "Karachi", region: "Sindh", areas: ["DHA", "Clifton", "Gulshan-e-Iqbal", "PECHS", "North Nazimabad", "Malir Cantt", "KDA Scheme 1"] },
      { id: "pk-fsd", name: "Faisalabad", region: "Punjab", areas: ["Peoples Colony", "Madina Town", "Kohinoor City", "Civil Lines", "Canal Road"] },
      { id: "pk-mul", name: "Multan", region: "Punjab", areas: ["Cantt", "Gulgasht Colony", "Bosan Road", "Model Town", "Officers Colony"] },
      { id: "pk-pew", name: "Peshawar", region: "KPK", areas: ["Hayatabad", "University Town", "Cantt", "Warsak Road", "Gulbahar"] },
      { id: "pk-qta", name: "Quetta", region: "Balochistan", areas: ["Cantt", "Jinnah Town", "Samungli Road", "Model Town"] },
      { id: "pk-skt", name: "Sialkot", region: "Punjab", areas: ["Cantt", "Model Town", "Sambrial", "Daska Road"] },
      { id: "pk-grw", name: "Gujranwala", region: "Punjab", areas: ["DC Colony", "Citi Housing", "Model Town", "Wapda Town"] },
      { id: "pk-hyd", name: "Hyderabad", region: "Sindh", areas: ["Latifabad", "Qasimabad", "Saddar", "Auto Bahn"] },
    ],
  },
  {
    code: "US",
    name: "United States",
    currency: "USD",
    currencySymbol: "$",
    phoneCode: "+1",
    defaultTimezone: "America/New_York",
    flag: "🇺🇸",
    curricula: ["AP", "Common Core", "SAT/ACT", "IB", "University", "Elementary", "Middle School", "High School"],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "us-nyc", name: "New York City", region: "New York", areas: ["Manhattan", "Brooklyn", "Queens"] },
      { id: "us-la", name: "Los Angeles", region: "California", areas: ["Downtown", "Hollywood", "Santa Monica"] },
      { id: "us-chi", name: "Chicago", region: "Illinois", areas: ["Loop", "Lincoln Park", "Hyde Park"] },
      { id: "us-hou", name: "Houston", region: "Texas", areas: ["Downtown", "Midtown", "Katy"] },
      { id: "us-dal", name: "Dallas", region: "Texas", areas: ["Uptown", "Downtown", "Plano"] },
      { id: "us-sfo", name: "San Francisco", region: "California", areas: ["SoMa", "Mission", "Marina"] },
      { id: "us-mia", name: "Miami", region: "Florida", areas: ["Brickell", "South Beach", "Coral Gables"] },
      { id: "us-atl", name: "Atlanta", region: "Georgia", areas: ["Midtown", "Buckhead", "Downtown"] },
      { id: "us-sea", name: "Seattle", region: "Washington", areas: ["Capitol Hill", "Downtown", "Bellevue"] },
      { id: "us-bos", name: "Boston", region: "Massachusetts", areas: ["Cambridge", "Downtown", "Back Bay"] },
    ],
  },
  // Additional countries will be added by the GeoNames import script
];

export function getCountryByCode(code?: string): Country | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  return COUNTRIES.find(c => c.code === upper) || undefined;
}

export function getCitiesForCountry(code?: string): City[] {
  const country = getCountryByCode(code);
  return country ? country.cities : [];
}

export function formatCurrencyAmount(amount: number, currencyCode = "PKR", pricingUnit?: string): string {
  const code = (currencyCode || "PKR").toUpperCase();
  const meta = SUPPORTED_CURRENCIES[code] || { symbol: code, code } as any;
  const formatted = `${meta.symbol} ${Math.round(amount).toLocaleString()}`;
  return pricingUnit ? `${formatted}/${pricingUnit}` : formatted;
}

export const MASTER_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Computer Science",
  "Economics",
  "Accounting",
  "Business Studies",
  "Urdu",
  "Islamiyat",
  "Pakistan Studies",
  "Statistics",
  "Sociology",
  "Psychology",
  "History",
  "Geography",
  "MDCAT",
  "ECAT",
  "SAT",
  "IELTS",
  "Quran & Arabic",
  "General Science",
];

export const MASTER_LEVELS = [
  "Primary (Grades 1-5)",
  "Middle (Grades 6-8)",
  "Matric (9th & 10th)",
  "Intermediate / FSc",
  "O-Level (Cambridge / Edexcel)",
  "A-Level (Cambridge / Edexcel)",
  "IB (Middle Years / Diploma)",
  "University / Degree",
  "Test Preparation",
];

export function convertToPKR(amount: number, fromCurrency = "PKR"): { amountPKR: number; rateToPKR: number } {
  const pkrUSD = SUPPORTED_CURRENCIES.PKR?.rateToUSD || 0.0036;
  const fromMeta = SUPPORTED_CURRENCIES[fromCurrency?.toUpperCase()] || { rateToUSD: pkrUSD } as any;
  const rateToPKR = fromMeta.rateToUSD / pkrUSD;
  const amountPKR = Math.round(amount * rateToPKR);
  return { amountPKR, rateToPKR: Number(rateToPKR.toFixed(4)) };
}
