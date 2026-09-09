// backend/src/scripts/geonamesImport.ts
// Simple script to import GeoNames data (countries, regions, cities) into the location config.
// This example reads a TSV file (e.g., countryInfo.txt) and generates JSON that can be merged into `location.ts`.

import * as fs from "fs";
import * as path from "path";
import { Country, Region, City } from "../config/location";

// Expected columns in GeoNames countryInfo.txt (see http://download.geonames.org/export/dump/):
// iso2, iso3, isoNumeric, fips, country, capital, area, population, continent, tld, currencyCode, currencyName, phone, postalCodeFormat, postalCodeRegex, languages, geonameId, neighbours, equivalentFipsCode
interface GeoCountryRow {
  iso2: string;
  iso3: string;
  isoNumeric: string;
  fips: string;
  name: string;
  capital: string;
  area: string;
  population: string;
  continent: string;
  tld: string;
  currencyCode: string;
  currencyName: string;
  phone: string;
  postalCodeFormat: string;
  postalCodeRegex: string;
  languages: string;
  geonameId: string;
  neighbours: string;
  equivalentFipsCode: string;
}

function parseCountryLine(line: string): GeoCountryRow | null {
  const parts = line.split("\t");
  if (parts.length < 19) return null;
  const [iso2, iso3, isoNumeric, fips, name, capital, area, population, continent, tld,
    currencyCode, currencyName, phone, postalCodeFormat, postalCodeRegex, languages,
    geonameId, neighbours, equivalentFipsCode] = parts;
  return {
    iso2,
    iso3,
    isoNumeric,
    fips,
    name,
    capital,
    area,
    population,
    continent,
    tld,
    currencyCode,
    currencyName,
    phone,
    postalCodeFormat,
    postalCodeRegex,
    languages,
    geonameId,
    neighbours,
    equivalentFipsCode,
  };
}

function loadCountries(filePath: string): Record<string, Country> {
  const raw = fs.readFileSync(filePath, { encoding: "utf8" });
  const lines = raw.split("\n").filter(l => l && !l.startsWith("#"));
  const result: Record<string, Country> = {};
  for (const line of lines) {
    const row = parseCountryLine(line);
    if (!row) continue;
    const code = row.iso2.toUpperCase();
    result[code] = {
      code,
      name: row.name,
      currency: row.currencyCode || "",
      currencySymbol: row.currencyCode || "",
      phoneCode: row.phone ? `+${row.phone}` : "",
      timezone: "",
      flag: "",
      curricula: [],
      regions: [],
      cities: [],
      homeTuitionEnabled: true,
      onlineEnabled: true,
    };
  }
  return result;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: ts-node geonamesImport.ts <path-to-countryInfo.txt>");
    process.exit(1);
  }
  const countryFile = path.resolve(args[0]);
  const countries = loadCountries(countryFile);
  const outPath = path.resolve(__dirname, "../config/generatedCountries.json");
  fs.writeFileSync(outPath, JSON.stringify(countries, null, 2), { encoding: "utf8" });
  console.log(`Generated ${Object.keys(countries).length} country entries to ${outPath}`);
}

if (require.main === module) {
  main();
}
