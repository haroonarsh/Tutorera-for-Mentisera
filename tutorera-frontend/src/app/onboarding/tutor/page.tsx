"use client";
import { UI_COLORS } from "@/lib/brand";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BookOpen } from "lucide-react";
import api from "@/lib/axios";
import CountryCitySelector from "@/components/marketplace/CountryCitySelector";
import { Country } from "@/lib/countries";
import { useGeoData, convertToPKR } from "@/lib/geoService";

const C = UI_COLORS;

const STEPS = [
  { number: 1, title: "Personal & Location" },
  { number: 2, title: "Education" },
  { number: 3, title: "Experience" },
  { number: 4, title: "Profile & Pricing" },
  { number: 5, title: "Verification" },
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"];

export default function TutorOnboardingPage() {
  const { user, loading } = useAuth();
  const geo = useGeoData();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const subjects = geo.subjects && geo.subjects.length > 0 ? geo.subjects : [
    "Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "Computer Science", "Economics", "Statistics", "Islamiyat", "Pakistan Studies", "Quran & Arabic", "IELTS", "SAT / ACT", "Other"
  ];
  const levels = geo.levels && geo.levels.length > 0 ? geo.levels : [
    "Primary (Grades 1-5)", "Middle (Grades 6-8)", "Matric (9th & 10th)", "Intermediate / FSc", "O-Level (Cambridge / Edexcel)", "A-Level (Cambridge / Edexcel)", "IB (Middle Years / Diploma)", "University / Dergee", "Test Preparation", "Other"
  ];

  // Step 1
  const [step1, setStep1] = useState({
    fullName: "",
    phone: "",
    countryCode: "PK",
    countryName: "Pakistan",
    city: "Lahore",
    timezone: "Asia/Karachi",
    currency: "PKR",
    gender: "male",
    dateOfBirth: "",
  });

  // Step 2
  const [step2, setStep2] = useState({ degree: "", institution: "", year: "" });
  const [degreeDoc, setDegreeDoc] = useState<File | null>(null);

  // Step 3
  const [step3, setStep3] = useState({ experience: "", previousInstitutions: "" });
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  // Step 4
  const [step4, setStep4] = useState({
    bio: "",
    hourlyRate: "",
    currency: "PKR",
    serviceAreas: "",
    travelRadiusKm: "10",
    teachingMode: "both" as "online" | "in-person" | "both",
  });
  const [availability, setAvailability] = useState<{ day: string; slots: string[] }[]>([]);

  // Step 5
  const [cnicFront, setCnicFront] = useState<File | null>(null);
  const [cnicBack, setCnicBack] = useState<File | null>(null);
  const [videoIntro, setVideoIntro] = useState<File | null>(null);
  const [policeCertificate, setPoliceCertificate] = useState<File | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && user.role !== "tutor") router.push("/dashboard");
  }, [user, loading, router]);

  const toggleItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    arr.includes(item) ? setter(arr.filter(i => i !== item)) : setter([...arr, item]);
  };

  const toggleAvailability = (day: string, slot: string) => {
    setAvailability(prev => {
      const existing = prev.find(a => a.day === day);
      if (existing) {
        const newSlots = existing.slots.includes(slot)
          ? existing.slots.filter(s => s !== slot)
          : [...existing.slots, slot];
        if (newSlots.length === 0) return prev.filter(a => a.day !== day);
        return prev.map(a => a.day === day ? { ...a, slots: newSlots } : a);
      }
      return [...prev, { day, slots: [slot] }];
    });
  };

  const isSlotSelected = (day: string, slot: string) => {
    return availability.find(a => a.day === day)?.slots.includes(slot) || false;
  };

  // Whether teaching mode mandates police verification report
  const isHomeTuitionMandatory = step4.teachingMode === "in-person";
  const isHybridTeaching = step4.teachingMode === "both";
  const isOnlineOnly = step4.teachingMode === "online";
  const requiresPoliceCert = isHomeTuitionMandatory;

  const handleNext = async () => {
    setError(""); setSaving(true);
    try {
      const formData = new FormData();
      formData.append("step", currentStep.toString());

      if (currentStep === 1) {
        if (!step1.fullName || !step1.phone || !step1.city) {
          setError("Please fill all required fields."); setSaving(false); return;
        }
        formData.append("data", JSON.stringify(step1));
      }

      else if (currentStep === 2) {
        if (!step2.degree || !step2.institution || !step2.year) {
          setError("Please fill all required fields."); setSaving(false); return;
        }
        formData.append("data", JSON.stringify(step2));
        if (degreeDoc) formData.append("degreeDoc", degreeDoc);
      }

      else if (currentStep === 3) {
        if (!step3.experience || selectedSubjects.length === 0 || selectedLevels.length === 0) {
          setError("Please select at least one subject and level."); setSaving(false); return;
        }
        formData.append("data", JSON.stringify({
          experience: step3.experience,
          previousInstitutions: step3.previousInstitutions.split(",").map(s => s.trim()).filter(Boolean),
          subjects: selectedSubjects,
          levels: selectedLevels,
        }));
      }

      else if (currentStep === 4) {
        if (!step4.bio || !step4.hourlyRate) {
          setError("Please fill all required fields."); setSaving(false); return;
        }
        formData.append("data", JSON.stringify({
          ...step4,
          currency: step1.currency || step4.currency || "PKR",
          availability,
        }));
      }

      else if (currentStep === 5) {
        if (!cnicFront || !cnicBack) {
          setError("Please upload both CNIC front and back."); setSaving(false); return;
        }
        // Online Tuition: No Police Verification required.
        // Home Tuition (In-Person): Police Verification Report is strictly mandatory.
        if (isHomeTuitionMandatory && !policeCertificate) {
          setError("Police Verification Report is mandatory to offer Home Tuition. Please upload your Police Character Certificate.");
          setSaving(false);
          return;
        }
        formData.append("data", JSON.stringify({}));
        formData.append("cnicFront", cnicFront);
        formData.append("cnicBack", cnicBack);
        if (videoIntro) formData.append("videoIntro", videoIntro);
        if (policeCertificate) formData.append("policeCertificate", policeCertificate);
      }

      await api.post("/tutors/onboarding/step", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (currentStep === 5) {
        router.push("/onboarding/tutor/complete");
      } else {
        setCurrentStep(prev => prev + 1);
      }
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: `3px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.gray50 }}>

      {/* Header */}
      <div style={{ backgroundColor: C.primary, padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <BookOpen size={24} color="#60a5fa" />
          <span style={{ color: 'white', fontWeight: '800', fontSize: '1.2rem' }}>TUTORERA<span style={{ color: '#C81B7F' }}>®</span></span>
        </div>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.3rem' }}>Tutor Registration</p>
      </div>

      {/* Progress Steps */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 1rem', overflowX: 'auto' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 'fit-content', padding: '0 0.5rem' }}>
          {STEPS.map((step, idx) => (
            <div key={step.number} style={{ display: 'flex', alignItems: 'center', flex: idx < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700', backgroundColor: step.number < currentStep ? '#16a34a' : step.number === currentStep ? C.accent : '#e5e7eb', color: step.number <= currentStep ? 'white' : '#9ca3af', transition: 'all 0.3s', flexShrink: 0 }}>
                  {step.number < currentStep ? '✓' : step.number}
                </div>
                <span style={{ fontSize: '0.62rem', fontWeight: '600', color: step.number === currentStep ? C.accent : step.number < currentStep ? '#16a34a' : '#9ca3af', whiteSpace: 'nowrap' }}>
                  {step.title}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div style={{ flex: 1, height: '2px', backgroundColor: step.number < currentStep ? '#16a34a' : '#e5e7eb', margin: '0 0.25rem', marginBottom: '1rem', minWidth: '20px', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div style={{ maxWidth: '600px', margin: '1.5rem auto', padding: '0 1rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>

          {/* Error */}
          {error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#ef4444', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {/* ── STEP 1 ── */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: C.primary, marginBottom: '0.4rem' }}>Personal Information</h2>
              <p style={{ color: C.gray500, fontSize: '0.875rem', marginBottom: '1.75rem' }}>Tell us about yourself.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Full Name *</label>
                  <input value={step1.fullName} onChange={e => setStep1({ ...step1, fullName: e.target.value })} placeholder="Muhammad Ahmad"
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
                </div>
                <div>
                  <CountryCitySelector
                    countryCode={step1.countryCode}
                    city={step1.city}
                    onCountryChange={(c: Country) => {
                      setStep1(prev => ({
                        ...prev,
                        countryCode: c.code,
                        countryName: c.name,
                        currency: c.currency,
                        timezone: c.defaultTimezone,
                      }));
                      setStep4(prev => ({ ...prev, currency: c.currency }));
                    }}
                    onCityChange={(cityName: string) => {
                      setStep1(prev => ({ ...prev, city: cityName }));
                    }}
                    showCurrency={true}
                    showTimezone={true}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Phone *</label>
                    <input value={step1.phone} onChange={e => setStep1({ ...step1, phone: e.target.value })} placeholder="e.g. +92 300 1234567"
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Gender</label>
                    <select title="gender" value={step1.gender} onChange={e => setStep1({ ...step1, gender: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary, backgroundColor: 'white' }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: C.primary, marginBottom: '0.4rem' }}>Educational Background</h2>
              <p style={{ color: C.gray500, fontSize: '0.875rem', marginBottom: '1.75rem' }}>Tell us about your highest qualification.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Degree / Qualification *</label>
                  <input value={step2.degree} onChange={e => setStep2({ ...step2, degree: e.target.value })} placeholder="e.g. BS Mathematics"
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Institution *</label>
                  <input value={step2.institution} onChange={e => setStep2({ ...step2, institution: e.target.value })} placeholder="e.g. COMSATS University Islamabad"
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Graduation Year *</label>
                  <input type="number" value={step2.year} onChange={e => setStep2({ ...step2, year: e.target.value })} placeholder="e.g. 2022" min="1990" max="2030"
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Upload Degree Certificate</label>
                  <div style={{ border: '2px dashed #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', backgroundColor: C.gray50 }}
                    onClick={() => document.getElementById('degreeDoc')?.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.accent; }}
                    onDragLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                    {degreeDoc ? (
                      <p style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.875rem' }}>✅ {degreeDoc.name}</p>
                    ) : (
                      <>
                        <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Click to upload or drag & drop</p>
                        <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>PDF, JPG, PNG (max 5MB)</p>
                      </>
                    )}
                  </div>
                  <input id="degreeDoc" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setDegreeDoc(e.target.files?.[0] || null)} aria-label="degreeDoc" style={{ display: 'none' }} />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: C.primary, marginBottom: '0.4rem' }}>Teaching Experience</h2>
              <p style={{ color: C.gray500, fontSize: '0.875rem', marginBottom: '1.75rem' }}>Tell us about your teaching background.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Years of Experience</label>
                  <input type="number" value={step3.experience} onChange={e => setStep3({ ...step3, experience: e.target.value })} placeholder="e.g. 3" min="0" max="50"
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Previous Institutions (comma separated)</label>
                  <input value={step3.previousInstitutions} onChange={e => setStep3({ ...step3, previousInstitutions: e.target.value })} placeholder="e.g. Beaconhouse, City School, Private"
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.6rem' }}>Subjects You Teach *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {subjects.map(s => (
                      <button key={s} type="button" onClick={() => toggleItem(selectedSubjects, s, setSelectedSubjects)}
                        style={{ padding: '0.4rem 0.9rem', borderRadius: '999px', border: `1.5px solid ${selectedSubjects.includes(s) ? C.accent : '#e5e7eb'}`, backgroundColor: selectedSubjects.includes(s) ? C.accentLight : 'white', color: selectedSubjects.includes(s) ? C.accent : C.gray500, fontWeight: '500', fontSize: '0.8rem', cursor: 'pointer' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.6rem' }}>Levels You Teach *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {levels.map(l => (
                      <button key={l} type="button" onClick={() => toggleItem(selectedLevels, l, setSelectedLevels)}
                        style={{ padding: '0.4rem 0.9rem', borderRadius: '999px', border: `1.5px solid ${selectedLevels.includes(l) ? C.accent : '#e5e7eb'}`, backgroundColor: selectedLevels.includes(l) ? C.accentLight : 'white', color: selectedLevels.includes(l) ? C.accent : C.gray500, fontWeight: '500', fontSize: '0.8rem', cursor: 'pointer' }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4 ── */}
          {currentStep === 4 && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: C.primary, marginBottom: '0.4rem' }}>Profile Setup</h2>
              <p style={{ color: C.gray500, fontSize: '0.875rem', marginBottom: '1.75rem' }}>Set up your public tutor profile.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Bio / Introduction *</label>
                  <textarea value={step4.bio} onChange={e => setStep4({ ...step4, bio: e.target.value })} rows={4}
                    placeholder="Tell students about yourself, your teaching style, and what makes you a great tutor..."
                    style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary, resize: 'vertical', fontFamily: 'inherit' }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>
                      Hourly Rate ({step1.currency || "PKR"}) *
                    </label>
                    <input type="number" value={step4.hourlyRate} onChange={e => setStep4({ ...step4, hourlyRate: e.target.value })} placeholder={step1.currency === "PKR" ? "e.g. 2000" : "e.g. 50"}
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
                    {step1.currency !== "PKR" && Number(step4.hourlyRate) > 0 && (
                      <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "#0329b2", fontWeight: 600 }}>
                        ≈ Rs. {convertToPKR(Number(step4.hourlyRate), step1.currency).amountPKR.toLocaleString()} PKR/hr (Settled in PKR)
                      </p>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Teaching Mode *</label>
                    <select title="teachingMode" value={step4.teachingMode} onChange={e => setStep4({ ...step4, teachingMode: e.target.value as "online" | "in-person" | "both" })}
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary, backgroundColor: 'white' }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                      <option value="online">🌐 Online Tuition Only (No Police Check Required)</option>
                      <option value="in-person">🏠 Home Tuition (In-Person — Police Report Mandatory)</option>
                      <option value="both">🌐 + 🏠 Both (Online & Home Tuition)</option>
                    </select>
                  </div>
                </div>

                {/* Mode distinction guidance banner */}
                <div style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "0.5rem",
                  border: isOnlineOnly ? "1.5px solid #86efac" : "1.5px solid #fcd34d",
                  backgroundColor: isOnlineOnly ? "#f0fdf4" : "#fffbeb",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.6rem"
                }}>
                  <span style={{ fontSize: "1.2rem" }}>{isOnlineOnly ? "🌐" : "🛡️"}</span>
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: isOnlineOnly ? "#166534" : "#92400e" }}>
                      {isOnlineOnly
                        ? "Online Tuition: No Police Verification Required"
                        : isHomeTuitionMandatory
                        ? "Home Tuition: Police Verification Report Strictly Mandatory"
                        : "Hybrid (Online & Home): Immediate Online Tutoring + Police Report for Home Tuition"}
                    </strong>
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: isOnlineOnly ? "#15803d" : "#b45309", lineHeight: "1.4" }}>
                      {isOnlineOnly
                        ? "You can teach students borderless/worldwide upon standard ID and Degree verification. No police character check is required for online sessions."
                        : isHomeTuitionMandatory
                        ? "To safeguard families in home tuition environments, an official Police Character Certificate / Police Verification Report (issued within the last 6 months) is required in Step 5 before you can accept home tuition requests."
                        : "You can start tutoring online as soon as your ID is verified. Home Tuition remains locked until your Police Verification Report is submitted and verified."}
                    </p>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.6rem' }}>Availability Schedule</label>
                  <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '0.75rem' }}>Click on time slots to mark your availability</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {days.map(day => (
                      <div key={day}>
                        <p style={{ fontSize: '0.8rem', fontWeight: '700', color: C.primary, marginBottom: '0.3rem' }}>{day}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {timeSlots.map(slot => (
                            <button key={slot} type="button" onClick={() => toggleAvailability(day, slot)}
                              style={{ padding: '0.25rem 0.6rem', borderRadius: '0.3rem', border: `1px solid ${isSlotSelected(day, slot) ? C.accent : '#e5e7eb'}`, backgroundColor: isSlotSelected(day, slot) ? C.accentLight : 'white', color: isSlotSelected(day, slot) ? C.accent : '#9ca3af', fontSize: '0.7rem', cursor: 'pointer', fontWeight: isSlotSelected(day, slot) ? '700' : '400' }}>
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5 — Verification ── */}
          {currentStep === 5 && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: C.primary, marginBottom: '0.4rem' }}>Verification Documents</h2>
              <p style={{ color: C.gray500, fontSize: '0.875rem', marginBottom: '1.75rem' }}>
                Upload your documents for verification. This keeps our platform safe and trusted.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* CNIC Front */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>CNIC Front *</label>
                  <div style={{ border: '2px dashed #e5e7eb', borderRadius: '0.5rem', padding: '1.25rem', textAlign: 'center', cursor: 'pointer', backgroundColor: C.gray50 }}
                    onClick={() => document.getElementById('cnicFront')?.click()}>
                    {cnicFront
                      ? <p style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.875rem' }}>✅ {cnicFront.name}</p>
                      : <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Click to upload CNIC Front</p>}
                  </div>
                  <input id="cnicFront" type="file" accept="image/*" onChange={e => setCnicFront(e.target.files?.[0] || null)} aria-label="upload" style={{ display: 'none' }} />
                </div>

                {/* CNIC Back */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>CNIC Back *</label>
                  <div style={{ border: '2px dashed #e5e7eb', borderRadius: '0.5rem', padding: '1.25rem', textAlign: 'center', cursor: 'pointer', backgroundColor: C.gray50 }}
                    onClick={() => document.getElementById('cnicBack')?.click()}>
                    {cnicBack
                      ? <p style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.875rem' }}>✅ {cnicBack.name}</p>
                      : <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Click to upload CNIC Back</p>}
                  </div>
                  <input id="cnicBack" type="file" accept="image/*" onChange={e => setCnicBack(e.target.files?.[0] || null)} aria-label="image" style={{ display: 'none' }} />
                </div>

                {/* Mode distinction banner in Step 5 */}
                {isOnlineOnly ? (
                  <div style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "0.5rem",
                    border: "1.5px solid #86efac",
                    backgroundColor: "#f0fdf4",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.6rem",
                  }}>
                    <span style={{ fontSize: "1.2rem" }}>🟢</span>
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "#166534" }}>Online Tuition Selected: No Police Verification Required</strong>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "#15803d", lineHeight: "1.4" }}>
                        As an online tutor, you only need to submit your CNIC / National ID and Degree credentials. A police character report is not required.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: "0.85rem 1rem",
                    borderRadius: "0.5rem",
                    border: "1.5px solid #fdba74",
                    backgroundColor: "#fff7ed",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.6rem",
                  }}>
                    <span style={{ fontSize: "1.2rem" }}>🛡️</span>
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "#9a3412" }}>
                        {isHomeTuitionMandatory ? "Home Tuition: Police Verification Report Mandatory" : "Home Tuition Requirement: Police Verification Report Needed"}
                      </strong>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "#c2410c", lineHeight: "1.4" }}>
                        {isHomeTuitionMandatory
                          ? "In-person home tutoring mandates an official Police Character Certificate (PKM / local police) issued within the last 6 months."
                          : "You may submit your Police Verification Report now to unlock Home Tuition, or skip it to be approved for Online Tuition only."}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Police Certificate — NEW ── */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>
                    Police Verification Report / Character Certificate
                    {isHomeTuitionMandatory
                      ? <span style={{ color: '#ef4444', marginLeft: '4px' }}>* (Mandatory for Home Tuition)</span>
                      : isOnlineOnly
                      ? <span style={{ color: '#16a34a', fontWeight: '500', marginLeft: '6px' }}>(Not Required for Online Tuition)</span>
                      : <span style={{ color: '#d97706', fontWeight: '500', marginLeft: '6px' }}>(Required to unlock Home Tuition)</span>}
                  </label>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.6rem', lineHeight: '1.5' }}>
                    {isHomeTuitionMandatory
                      ? "Mandatory for in-person home tutoring. Must be issued within the last 6 months by a relevant authority (e.g. Police Khidmat Markaz, PKM, or local police station)."
                      : isOnlineOnly
                      ? "No police verification is required for online tuition. If you upload one, it remains on file in case you later opt into home tuition."
                      : "Optional if you only wish to teach online for now. Required before you can offer or accept home tuition bookings."}
                  </p>
                  <div
                    style={{
                      border: `2px dashed ${isHomeTuitionMandatory && !policeCertificate ? '#fca5a5' : '#e5e7eb'}`,
                      borderRadius: '0.5rem', padding: '1.25rem', textAlign: 'center',
                      cursor: 'pointer', backgroundColor: isHomeTuitionMandatory && !policeCertificate ? '#fff5f5' : C.gray50
                    }}
                    onClick={() => document.getElementById('policeCertificate')?.click()}>
                    {policeCertificate
                      ? <p style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.875rem' }}>✅ {policeCertificate.name}</p>
                      : (
                        <>
                          <p style={{ color: C.gray500, fontSize: '0.875rem' }}>
                            {isOnlineOnly ? "Click to upload Police Certificate (Optional)" : "Click to upload Police Verification Report"}
                          </p>
                          <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.25rem' }}>PDF, JPG, PNG (max 5MB)</p>
                        </>
                      )}
                  </div>
                  <input
                    id="policeCertificate"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setPoliceCertificate(e.target.files?.[0] || null)}
                    aria-label="Police Certificate"
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Video Intro */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>
                    Introduction Video <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>
                  </label>
                  <div style={{ border: '2px dashed #e5e7eb', borderRadius: '0.5rem', padding: '1.25rem', textAlign: 'center', cursor: 'pointer', backgroundColor: C.gray50 }}
                    onClick={() => document.getElementById('videoIntro')?.click()}>
                    {videoIntro
                      ? <p style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.875rem' }}>✅ {videoIntro.name}</p>
                      : (
                        <>
                          <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Upload a short intro video (max 2 min)</p>
                          <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>MP4, MOV (max 50MB)</p>
                        </>
                      )}
                  </div>
                  <input id="videoIntro" type="file" accept="video/*" onChange={e => setVideoIntro(e.target.files?.[0] || null)} aria-label="Introduction Video" style={{ display: 'none' }} />
                </div>

                {/* Info box */}
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem', padding: '1rem' }}>
                  <p style={{ color: '#92400e', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.3rem' }}>⏳ Review Process</p>
                  <p style={{ color: '#a16207', fontSize: '0.8rem', lineHeight: '1.5' }}>
                    After submission, our team will review your documents within 24–48 hours. You&apos;ll receive an email notification once approved.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f3f4f6', gap: '1rem' }}>
            {currentStep > 1 ? (
              <button onClick={() => { setError(""); setCurrentStep(prev => prev - 1); }}
                style={{ flex: 1, padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: C.primary }}>
                ← Back
              </button>
            ) : <div style={{ flex: 1 }} />}

            <button onClick={handleNext} disabled={saving}
              style={{ flex: 1, padding: '0.75rem 1rem', backgroundColor: saving ? '#93c5fd' : C.accent, color: 'white', border: 'none', borderRadius: '0.5rem', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: '700' }}>
              {saving ? "Saving..." : currentStep === 5 ? "Submit 🚀" : "Continue →"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
} 