import { UI_COLORS } from "@/lib/brand";
import { MapPin,Wifi } from "lucide-react";
import Link from "next/link";
import { fetchTutors } from "@/lib/tutor-directory";

const C = UI_COLORS;

const cities = ["Islamabad", "Rawalpindi", "Lahore", "Karachi", "Peshawar", "Quetta", "Multan", "Faisalabad"];

export default async function CoveragePage() {
  const inventory = await Promise.all(cities.map(async (name) => ({ name, total: (await fetchTutors({ countryCode: "PK", city: name }, 1)).total })));
  const supportedCities = inventory.filter((city) => city.total > 0);
  return (
    <div style={{ backgroundColor: 'white' }}>
      <section style={{ backgroundColor: C.primary, padding: '5rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>
          Global Learning, Local Choice
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto' }}>
          Learn online with educators worldwide. Local home tuition is available only in enabled markets and locations.
        </p>
      </section>

      {/* Online Banner */}
      <section style={{ padding: '3rem 1.5rem', backgroundColor: '#EEF5FF', borderBottom: '1px solid #bfdbfe' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ width: '56px', height: '56px', backgroundColor: '#0329B2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wifi size={24} color="white" />
          </div>
          <div>
            <h2 style={{ fontWeight: '800', color: C.primary, fontSize: '1.2rem', marginBottom: '0.3rem' }}>Online Tutoring — Available Worldwide</h2>
            <p style={{ color: C.gray500, fontSize: '0.9rem' }}>Choose online learning across timezones, subjects, and curricula. Availability, offers, and checkout follow your selected market configuration.</p>
          </div>
          <Link href="/tutors?teachingMode=online" style={{ backgroundColor: '#0329B2', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '700', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Find Online Tutors
          </Link>
        </div>
      </section>

      {/* Cities */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: C.gray50 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: C.primary, textAlign: 'center', marginBottom: '3rem' }}>
            Pakistan Home-Tuition Coverage
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {supportedCities.map(city => (
              <div key={city.name} style={{ backgroundColor: 'white', borderRadius: '0.875rem', padding: '1.75rem', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <MapPin size={20} color={C.accent} />
                  <h3 style={{ fontWeight: '700', color: C.primary, fontSize: '1.05rem' }}>{city.name}</h3>
                </div>
                <p style={{ color: C.gray500, fontSize: '0.85rem', lineHeight: 1.5 }}>{city.total} verified public {city.total === 1 ? 'tutor profile is' : 'tutor profiles are'} currently available. Locality-level availability is shown only after a match is confirmed.</p>
                <Link href={`/tutors?city=${city.name}`} style={{ display: 'inline-block', marginTop: '1rem', color: C.accent, fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none' }}>
                  Find tutors in {city.name} →
                </Link>
              </div>
            ))}
            {!supportedCities.length && <p style={{ color: C.gray500, gridColumn: '1 / -1', textAlign: 'center' }}>No city currently has public tutor inventory. Post a tuition requirement to receive relevant offers.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
