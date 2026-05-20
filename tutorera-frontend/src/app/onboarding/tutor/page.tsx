"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle, BookOpen } from "lucide-react";
import api from "@/lib/axios";

const C = {
  primary: '#1a1a2e',
  accent: '#2563eb',
  gray500: '#6b7280',
  gray50: '#f9fafb',
  accentLight: '#eff6ff',
};

const STEPS = [
  { number: 1, title: "Personal Info" },
  { number: 2, title: "Education" },
  { number: 3, title: "Experience" },
  { number: 4, title: "Profile Setup" },
  { number: 5, title: "Verification" },
];

const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "Computer Science", "Economics", "Statistics", "Islamiyat", "Pakistan Studies", "Other"];
const levels = ["Primary", "Middle", "Matric", "Intermediate", "O-Level", "A-Level", "University", "Other"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"];

export default function TutorOnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [step1, setStep1] = useState({ fullName: "", phone: "", city: "", gender: "male", dateOfBirth: "" });

  // Step 2
  const [step2, setStep2] = useState({ degree: "", institution: "", year: "" });
  const [degreeDoc, setDegreeDoc] = useState<File | null>(null);

  // Step 3
  const [step3, setStep3] = useState({ experience: "", previousInstitutions: "" });
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  // Step 4
  const [step4, setStep4] = useState({ bio: "", hourlyRate: "", teachingMode: "both" as "online" | "in-person" | "both" });
  const [availability, setAvailability] = useState<{ day: string; slots: string[] }[]>([]);

  // Step 5
  const [cnicFront, setCnicFront] = useState<File | null>(null);
  const [cnicBack, setCnicBack] = useState<File | null>(null);
  const [videoIntro, setVideoIntro] = useState<File | null>(null);

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
        if (selectedSubjects.length === 0 || selectedLevels.length === 0) {
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
          availability,
        }));
      }

      else if (currentStep === 5) {
        if (!cnicFront || !cnicBack) {
          setError("Please upload both CNIC front and back."); setSaving(false); return;
        }
        formData.append("data", JSON.stringify({}));
        formData.append("cnicFront", cnicFront);
        formData.append("cnicBack", cnicBack);
        if (videoIntro) formData.append("videoIntro", videoIntro);
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
          <span style={{ color: 'white', fontWeight: '800', fontSize: '1.2rem' }}>TUTORERA<span style={{ color: '#e94560' }}>®</span></span>
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

          {/* ── STEP 1 — Personal Info ── */}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Phone *</label>
                    <input value={step1.phone} onChange={e => setStep1({ ...step1, phone: e.target.value })} placeholder="03001234567"
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>City *</label>
                    <select value={step1.city} onChange={e => setStep1({ ...step1, city: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary, backgroundColor: 'white' }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                      <option value="">Select city</option>
                      {["Islamabad", "Rawalpindi", "Lahore", "Karachi", "Peshawar", "Quetta", "Multan", "Faisalabad", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Gender</label>
                    <select value={step1.gender} onChange={e => setStep1({ ...step1, gender: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary, backgroundColor: 'white' }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Date of Birth</label>
                    <input type="date" aria-label="date" value={step1.dateOfBirth} onChange={e => setStep1({ ...step1, dateOfBirth: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 — Education ── */}
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

          {/* ── STEP 3 — Experience ── */}
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

          {/* ── STEP 4 — Profile Setup ── */}
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
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Hourly Rate (Rs.) *</label>
                    <input type="number" value={step4.hourlyRate} onChange={e => setStep4({ ...step4, hourlyRate: e.target.value })} placeholder="e.g. 2000"
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>Teaching Mode</label>
                    <select value={step4.teachingMode} onChange={e => setStep4({ ...step4, teachingMode: e.target.value as "online" | "in-person" | "both" })}
                      style={{ width: '100%', padding: '0.75rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: C.primary, backgroundColor: 'white' }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                      <option value="online">Online Only</option>
                      <option value="in-person">In-Person Only</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>

                {/* Availability */}
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
              <p style={{ color: C.gray500, fontSize: '0.875rem', marginBottom: '1.75rem' }}>Upload your documents for verification. This keeps our platform safe and trusted.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* CNIC Front */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>CNIC Front *</label>
                  <div style={{ border: '2px dashed #e5e7eb', borderRadius: '0.5rem', padding: '1.25rem', textAlign: 'center', cursor: 'pointer', backgroundColor: C.gray50 }}
                    onClick={() => document.getElementById('cnicFront')?.click()}>
                    {cnicFront ? <p style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.875rem' }}>✅ {cnicFront.name}</p> : <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Click to upload CNIC Front</p>}
                  </div>
                  <input id="cnicFront" type="file" accept="image/*" onChange={e => setCnicFront(e.target.files?.[0] || null)} aria-label="upload" style={{ display: 'none' }} />
                </div>

                {/* CNIC Back */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>CNIC Back *</label>
                  <div style={{ border: '2px dashed #e5e7eb', borderRadius: '0.5rem', padding: '1.25rem', textAlign: 'center', cursor: 'pointer', backgroundColor: C.gray50 }}
                    onClick={() => document.getElementById('cnicBack')?.click()}>
                    {cnicBack ? <p style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.875rem' }}>✅ {cnicBack.name}</p> : <p style={{ color: C.gray500, fontSize: '0.875rem' }}>Click to upload CNIC Back</p>}
                  </div>
                  <input id="cnicBack" type="file" accept="image/*" onChange={e => setCnicBack(e.target.files?.[0] || null)} aria-label="image" style={{ display: 'none' }} />
                </div>

                {/* Video Intro */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: C.primary, marginBottom: '0.4rem' }}>
                    Introduction Video <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>
                  </label>
                  <div style={{ border: '2px dashed #e5e7eb', borderRadius: '0.5rem', padding: '1.25rem', textAlign: 'center', cursor: 'pointer', backgroundColor: C.gray50 }}
                    onClick={() => document.getElementById('videoIntro')?.click()}>
                    {videoIntro ? <p style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.875rem' }}>✅ {videoIntro.name}</p> : (
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
                  <p style={{ color: '#a16207', fontSize: '0.8rem', lineHeight: '1.5' }}>After submission, our team will review your documents within 24-48 hours. You'll receive an email notification once approved.</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
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