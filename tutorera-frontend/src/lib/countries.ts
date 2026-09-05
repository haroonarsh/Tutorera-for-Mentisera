// src/lib/countries.ts
// Shared Global Location, Currency, and Curriculum Master Dataset for Frontend

export interface CityData {
  id: string;
  name: string;
  region?: string;
  areas?: string[];
}

export interface CountryData {
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
    code: "AE",
    name: "United Arab Emirates",
    currency: "AED",
    currencySymbol: "AED",
    phoneCode: "+971",
    defaultTimezone: "Asia/Dubai",
    flag: "🇦🇪",
    curricula: ["British Curriculum (GCSE/A-Level)", "American Curriculum / AP", "IB (International Baccalaureate)", "CBSE", "ICSE", "MOE UAE Curriculum", "SABIS"],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "ae-dxb", name: "Dubai", region: "Dubai", areas: ["Downtown", "Dubai Marina", "Jumeirah", "Business Bay", "Arabian Ranches", "Mirdif", "JLT", "Al Barsha", "Silicon Oasis"] },
      { id: "ae-auh", name: "Abu Dhabi", region: "Abu Dhabi", areas: ["Al Reem Island", "Khalidiya", "Yas Island", "Saadiyat Island", "Al Raha Beach", "Mohammed Bin Zayed City"] },
      { id: "ae-shj", name: "Sharjah", region: "Sharjah", areas: ["Al Majaz", "Al Nahda", "Al Taawun", "Muwaileh", "University City"] },
      { id: "ae-ajm", name: "Ajman", region: "Ajman", areas: ["Al Nuaimia", "Al Rashidiya", "Al Jurf"] },
      { id: "ae-ain", name: "Al Ain", region: "Abu Dhabi", areas: ["Al Jimi", "Al Maqam", "Al Towayya"] },
      { id: "ae-rak", name: "Ras Al Khaimah", region: "RAK", areas: ["Al Hamra Village", "Mina Al Arab", "Khuzam"] },
      { id: "ae-fuj", name: "Fujairah", region: "Fujairah", areas: ["Al Faseel", "Mirbah", "Qidfa"] },
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    currencySymbol: "£",
    phoneCode: "+44",
    defaultTimezone: "Europe/London",
    flag: "🇬🇧",
    curricula: ["National Curriculum England", "GCSE", "IGCSE", "A-Level", "Scottish Highers", "IB (International Baccalaureate)", "11 Plus (11+)", "University / Degree"],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "gb-lon", name: "London", region: "Greater London", areas: ["Central London", "Canary Wharf", "Kensington", "Camden", "Greenwich", "Croydon", "Barnet", "Ealing"] },
      { id: "gb-bir", name: "Birmingham", region: "West Midlands", areas: ["City Centre", "Edgbaston", "Solihull", "Harborne", "Moseley"] },
      { id: "gb-man", name: "Manchester", region: "Greater Manchester", areas: ["City Centre", "Salford", "Didsbury", "Altrincham", "Stockport"] },
      { id: "gb-lds", name: "Leeds", region: "Yorkshire", areas: ["City Centre", "Headingley", "Horsforth", "Roundhay"] },
      { id: "gb-gla", name: "Glasgow", region: "Scotland", areas: ["City Centre", "West End", "Southside", "Bearsden"] },
      { id: "gb-edi", name: "Edinburgh", region: "Scotland", areas: ["Old Town", "New Town", "Leith", "Stockbridge"] },
      { id: "gb-liv", name: "Liverpool", region: "North West", areas: ["City Centre", "Allerton", "Crosby", "Woolton"] },
      { id: "gb-brs", name: "Bristol", region: "South West", areas: ["Clifton", "Redland", "City Centre", "Harbourside"] },
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
    curricula: ["Common Core (K-12)", "AP (Advanced Placement)", "SAT / ACT Prep", "IB (International Baccalaureate)", "College & University", "Honors / Gifted"],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "us-nyc", name: "New York", region: "NY", areas: ["Manhattan", "Brooklyn", "Queens", "Staten Island", "Bronx", "Long Island"] },
      { id: "us-lax", name: "Los Angeles", region: "CA", areas: ["Downtown", "Santa Monica", "Pasadena", "Beverly Hills", "Irvine", "San Fernando Valley"] },
      { id: "us-chi", name: "Chicago", region: "IL", areas: ["Loop", "Lincoln Park", "Naperville", "Evanston", "Hyde Park"] },
      { id: "us-hou", name: "Houston", region: "TX", areas: ["Downtown", "Katy", "Sugar Land", "The Woodlands", "Memorial"] },
      { id: "us-dfw", name: "Dallas", region: "TX", areas: ["Uptown", "Plano", "Frisco", "Irving", "Arlington"] },
      { id: "us-sfo", name: "San Francisco / Bay Area", region: "CA", areas: ["SF Downtown", "San Jose", "Palo Alto", "Berkeley", "Fremont", "Sunnyvale"] },
      { id: "us-mia", name: "Miami", region: "FL", areas: ["Brickell", "Coral Gables", "Miami Beach", "Doral", "Fort Lauderdale"] },
      { id: "us-was", name: "Washington D.C.", region: "DC", areas: ["Capitol Hill", "Georgetown", "Arlington", "Bethesda", "Alexandria"] },
    ],
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    currency: "SAR",
    currencySymbol: "SAR",
    phoneCode: "+966",
    defaultTimezone: "Asia/Riyadh",
    flag: "🇸🇦",
    curricula: ["Saudi National Curriculum", "British Curriculum (Cambridge/Edexcel)", "American Curriculum", "IB", "CBSE", "Qudurat / Tahsili"],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "sa-ruh", name: "Riyadh", region: "Riyadh", areas: ["Al Olaya", "Al Malqa", "Al Yasmin", "Al Nakheel", "Diplomatic Quarter"] },
      { id: "sa-jed", name: "Jeddah", region: "Makkah", areas: ["Al Rawdah", "Al Andalus", "Al Shatie", "Al Hamra", "Obhur"] },
      { id: "sa-dmm", name: "Dammam & Khobar", region: "Eastern Province", areas: ["Al Khobar", "Dammam Corniche", "Dhahran", "Al Faisaliyah"] },
      { id: "sa-med", name: "Medina", region: "Medina", areas: ["Al Khalidiyyah", "Al Uyun", "Al Aziriyyah"] },
      { id: "sa-mak", name: "Makkah", region: "Makkah", areas: ["Al Shawqiyyah", "Al Awali", "Al Rusayfah"] },
    ],
  },
  {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    currencySymbol: "CA$",
    phoneCode: "+1",
    defaultTimezone: "America/Toronto",
    flag: "🇨🇦",
    curricula: ["Ontario Curriculum (OSSD)", "BC Curriculum", "Alberta Curriculum", "AP", "IB", "University / College Prep"],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "ca-tor", name: "Toronto", region: "ON", areas: ["Downtown", "North York", "Mississauga", "Brampton", "Markham", "Scarborough", "Oakville"] },
      { id: "ca-van", name: "Vancouver", region: "BC", areas: ["Downtown", "Richmond", "Burnaby", "Surrey", "West Vancouver"] },
      { id: "ca-cgy", name: "Calgary", region: "AB", areas: ["Downtown", "NW Calgary", "SW Calgary", "Airdrie"] },
      { id: "ca-mtl", name: "Montreal", region: "QC", areas: ["Downtown", "Westmount", "Plateau", "Laval"] },
      { id: "ca-ott", name: "Ottawa", region: "ON", areas: ["Downtown", "Kanata", "Nepean", "Orleans"] },
    ],
  },
  {
    code: "AU",
    name: "Australia",
    currency: "AUD",
    currencySymbol: "AU$",
    phoneCode: "+61",
    defaultTimezone: "Australia/Sydney",
    flag: "🇦🇺",
    curricula: ["Australian National Curriculum", "HSC (NSW)", "VCE (Victoria)", "QCE (Queensland)", "IB", "Selective School Prep", "ATAR Prep"],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "au-syd", name: "Sydney", region: "NSW", areas: ["CBD", "Parramatta", "Chatswood", "Blacktown", "Epping", "Bondi"] },
      { id: "au-mel", name: "Melbourne", region: "VIC", areas: ["CBD", "Carlton", "Clayton", "Box Hill", "Glen Waverley"] },
      { id: "au-bne", name: "Brisbane", region: "QLD", areas: ["CBD", "South Bank", "Sunnybank", "Indooroopilly"] },
      { id: "au-per", name: "Perth", region: "WA", areas: ["CBD", "Fremantle", "Joondalup", "Cannington"] },
    ],
  },
  {
    code: "QA",
    name: "Qatar",
    currency: "QAR",
    currencySymbol: "QAR",
    phoneCode: "+974",
    defaultTimezone: "Asia/Qatar",
    flag: "🇶🇦",
    curricula: ["British Curriculum", "American Curriculum", "IB", "CBSE", "Qatar National Curriculum"],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "qa-doh", name: "Doha", region: "Doha", areas: ["The Pearl", "West Bay", "Al Sadd", "Al Waab", "Lusail", "Al Hilal"] },
      { id: "qa-ray", name: "Al Rayyan", region: "Al Rayyan", areas: ["Education City", "Al Gharrafa", "Al Luqta"] },
      { id: "qa-wak", name: "Al Wakrah", region: "Al Wakrah", areas: ["Al Wukair", "Ezdan"] },
    ],
  },
  {
    code: "OM",
    name: "Oman",
    currency: "OMR",
    currencySymbol: "OMR",
    phoneCode: "+968",
    defaultTimezone: "Asia/Muscat",
    flag: "🇴🇲",
    curricula: ["British Curriculum", "American Curriculum", "CBSE", "Oman Ministry of Education Curriculum"],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "om-mct", name: "Muscat", region: "Muscat", areas: ["Al Qurum", "Al Khuwair", "Azaiba", "Madinat Sultan Qaboos", "Al Mouj", "Seeb"] },
      { id: "om-sll", name: "Salalah", region: "Dhofar", areas: ["Al Haffa", "Al Dahariz", "New Salalah"] },
      { id: "om-soh", name: "Sohar", region: "Al Batinah", areas: ["Falaj Al Qabail", "Al Humbar"] },
    ],
  },
  {
    code: "KW",
    name: "Kuwait",
    currency: "KWD",
    currencySymbol: "KWD",
    phoneCode: "+965",
    defaultTimezone: "Asia/Kuwait",
    flag: "🇰🇼",
    curricula: ["British Curriculum", "American Curriculum", "Bilingual / Kuwait National", "CBSE", "IB"],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "kw-kwt", name: "Kuwait City", region: "Capital", areas: ["Salmiya", "Hawally", "Jabriya", "Mishref", "Sabah Al Salem", "Bayan"] },
      { id: "kw-ahm", name: "Al Ahmadi", region: "Ahmadi", areas: ["Fahaheel", "Mangaf", "Egaila"] },
      { id: "kw-far", name: "Al Farwaniyah", region: "Farwaniyah", areas: ["Khaitan", "Ishbilya", "Rehab"] },
    ],
  },
  {
    code: "BH",
    name: "Bahrain",
    currency: "BHD",
    currencySymbol: "BHD",
    phoneCode: "+973",
    defaultTimezone: "Asia/Bahrain",
    flag: "🇧🇭",
    curricula: ["British Curriculum (Edexcel/Cambridge)", "American Curriculum", "CBSE", "Bahrain Ministry Curriculum", "IB"],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "bh-man", name: "Manama", region: "Capital", areas: ["Juffair", "Seef", "Amwaj Islands", "Adliya", "Sanabis"] },
      { id: "bh-muh", name: "Muharraq", region: "Muharraq", areas: ["Busaiteen", "Hidd", "Galali"] },
      { id: "bh-rif", name: "Riffa", region: "Southern", areas: ["East Riffa", "West Riffa", "Bukuwara"] },
    ],
  },
  {
    code: "IN",
    name: "India",
    currency: "INR",
    currencySymbol: "₹",
    phoneCode: "+91",
    defaultTimezone: "Asia/Kolkata",
    flag: "🇮🇳",
    curricula: ["CBSE", "ICSE / ISC", "State Boards", "Cambridge (IGCSE/A-Levels)", "IB", "JEE / NEET Prep"],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "in-del", name: "Delhi NCR", region: "Delhi", areas: ["South Delhi", "Dwarka", "Gurgaon", "Noida", "Rohini"] },
      { id: "in-bom", name: "Mumbai", region: "Maharashtra", areas: ["Andheri", "Bandra", "Powai", "Juhu", "Navi Mumbai", "Thane"] },
      { id: "in-blr", name: "Bengaluru", region: "Karnataka", areas: ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Jayanagar"] },
      { id: "in-hyd", name: "Hyderabad", region: "Telangana", areas: ["Gachibowli", "Hitec City", "Banjara Hills", "Jubilee Hills", "Kukatpally"] },
    ],
  },
  {
    code: "MY",
    name: "Malaysia",
    currency: "MYR",
    currencySymbol: "RM",
    phoneCode: "+60",
    defaultTimezone: "Asia/Kuala_Lumpur",
    flag: "🇲🇾",
    curricula: ["IGCSE / Cambridge", "SPM / Malaysian National", "IB", "Australian Matriculation", "A-Levels"],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "my-kul", name: "Kuala Lumpur", region: "KL", areas: ["Mont Kiara", "Bangsar", "KLCC", "Cheras", "Bukit Jalil"] },
      { id: "my-pj", name: "Petaling Jaya / Selangor", region: "Selangor", areas: ["Damansara", "Subang Jaya", "Sunway", "Shah Alam", "Puchong"] },
      { id: "my-pen", name: "Penang", region: "Penang", areas: ["George Town", "Bayan Lepas", "Tanjung Tokong"] },
    ],
  },
  {
    code: "SG",
    name: "Singapore",
    currency: "SGD",
    currencySymbol: "SG$",
    phoneCode: "+65",
    defaultTimezone: "Asia/Singapore",
    flag: "🇸🇬",
    curricula: ["Singapore-Cambridge GCE O-Level", "GCE A-Level", "PSLE", "IB (International Baccalaureate)", "IGCSE"],
    homeTuitionEnabled: true,
    onlineEnabled: true,
    cities: [
      { id: "sg-main", name: "Singapore", region: "Singapore", areas: ["Central", "Jurong", "Tampines", "Woodlands", "Bedok", "Ang Mo Kio", "Bishan", "Bukit Timah"] },
    ],
  },
];

export function getCountryByCode(code?: string): CountryData {
  if (!code) return COUNTRIES.find(c => c.code === "PK") || COUNTRIES[0];
  const upper = code.toUpperCase();
  return COUNTRIES.find(c => c.code === upper) || COUNTRIES.find(c => c.code === "PK") || COUNTRIES[0];
}

export function getCitiesForCountry(countryCode?: string): CityData[] {
  const country = getCountryByCode(countryCode);
  return country ? country.cities : [];
}

export function formatCurrencyAmount(amount: number, currencyCode = "PKR", pricingUnit?: string): string {
  const code = (currencyCode || "PKR").toUpperCase();
  const meta = SUPPORTED_CURRENCIES[code] || { symbol: code, code };
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
  const fromMeta = SUPPORTED_CURRENCIES[fromCurrency?.toUpperCase()] || { rateToUSD: pkrUSD };
  const rateToPKR = fromMeta.rateToUSD / pkrUSD;
  const amountPKR = Math.round(amount * rateToPKR);
  return { amountPKR, rateToPKR: Number(rateToPKR.toFixed(4)) };
}
