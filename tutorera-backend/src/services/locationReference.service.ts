import Country from "../models/Country.model";
import Region from "../models/Region.model";
import City from "../models/City.model";
import Locality from "../models/Locality.model";

type LocationInput = {
  country?: string;
  region?: string;
  cityRef?: string;
  locality?: string;
  city?: string;
};

/** Validates optional normalized IDs and returns trusted display snapshots. */
export async function resolveLocationReferences(input: LocationInput, countryCode: string) {
  const code = countryCode.toUpperCase();
  const [country, region, city, locality] = await Promise.all([
    input.country ? Country.findById(input.country).lean() : null,
    input.region ? Region.findById(input.region).lean() : null,
    input.cityRef ? City.findById(input.cityRef).lean() : null,
    input.locality ? Locality.findById(input.locality).lean() : null,
  ]);

  if (input.country && (!country || country.iso2 !== code)) throw new Error("The selected country does not match the active market.");
  if (input.region && (!region || region.countryCode !== code)) throw new Error("The selected region does not belong to the active market.");
  if (input.cityRef && (!city || city.countryCode !== code || (region && city.region?.toString() !== region._id.toString()))) {
    throw new Error("The selected city does not belong to the selected country or region.");
  }
  if (input.locality && (!locality || locality.countryCode !== code || (city && locality.city.toString() !== city._id.toString()))) {
    throw new Error("The selected locality does not belong to the selected city.");
  }

  return {
    ...(country ? { country: country._id } : {}),
    ...(region ? { region: region._id } : {}),
    ...(city ? { cityRef: city._id, city: city.name, timezone: city.timezone } : {}),
    ...(locality ? { locality: locality._id } : {}),
  };
}
