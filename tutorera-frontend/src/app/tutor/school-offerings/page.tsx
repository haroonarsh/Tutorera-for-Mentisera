"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";

type Offering = {
  _id: string;
  boardName: string;
  boardCode: string;
  qualificationName: string;
  classLevel?: string;
  subjectDisplay: string;
  subject: string;
};

export default function SchoolPreferences() {
  const [items, setItems] = useState<Offering[]>([]);
  const [ids, setIds] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [board, setBoard] = useState("");
  const [qualification, setQualification] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/geo/school-offerings"),
      api.get("/tutors/school-offerings/me"),
    ])
      .then(([catalogue, profile]) => {
        setItems(catalogue.data.offerings || []);
        setIds(profile.data.schoolOfferingIds || []);
        setSubjects(profile.data.subjects || []);
      })
      .catch(() => setMessage("Could not load teaching preferences. Complete your tutor profile and try again."));
  }, []);

  const boards = useMemo(() => [...new Set(items.map((o) => o.boardName))].sort(), [items]);
  const qualifications = useMemo(() => [...new Set(items.filter((o) => o.boardName === board).map((o) => o.qualificationName))].sort(), [items, board]);
  const classes = useMemo(() => [...new Set(items.filter((o) => o.boardName === board && o.qualificationName === qualification && o.classLevel).map((o) => o.classLevel!))].sort(), [items, board, qualification]);
  const subjectOptions = useMemo(() => [...new Set(items.filter((o) => o.boardName === board && o.qualificationName === qualification && (!o.classLevel || o.classLevel === classLevel)).map((o) => o.subjectDisplay))].sort(), [items, board, qualification, classLevel]);

  const selected = useMemo(() => items.find((o) =>
    o.boardName === board &&
    o.qualificationName === qualification &&
    (!o.classLevel || o.classLevel === classLevel) &&
    o.subjectDisplay === subject
  ), [items, board, qualification, classLevel, subject]);

  function addSelected() {
    if (!selected || ids.includes(selected._id)) return;
    setIds([...ids, selected._id]);
    setSubject("");
  }

  const save = async () => {
    setBusy(true); setMessage("");
    try {
      await api.put("/tutors/school-offerings/me", { schoolOfferingIds: ids });
      setMessage("Saved. Each subject and level still requires admin approval before you can receive matching requests.");
    } catch {
      setMessage("Could not save. Check that each selected subject is on your tutor profile, then try again.");
    } finally { setBusy(false); }
  };

  const labelCls = "block text-sm font-semibold text-[#021550] mb-1";
  const selectCls = "block w-full rounded-lg border border-gray-300 p-2 text-sm";

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link href="/dashboard" className="text-blue-700 underline text-sm">← Back to dashboard</Link>
      <h1 className="text-3xl font-bold text-[#021550]">School teaching preferences</h1>
      <p className="text-gray-600">Choose every board, qualification, class and subject you teach. Add subjects to your tutor profile first — preferences do not replace eligibility approval.</p>
      <p className="text-sm text-gray-500">Subjects on your profile: <strong>{subjects.join(", ") || "None yet"}</strong></p>

      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h2 className="font-bold text-[#021550]">Add a teaching offering</h2>

        <div>
          <label className={labelCls}>Board</label>
          <select className={selectCls} value={board} onChange={(e) => { setBoard(e.target.value); setQualification(""); setClassLevel(""); setSubject(""); }}>
            <option value="">Select board…</option>
            {boards.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {board && (
          <div>
            <label className={labelCls}>Qualification</label>
            <select className={selectCls} value={qualification} onChange={(e) => { setQualification(e.target.value); setClassLevel(""); setSubject(""); }}>
              <option value="">Select qualification…</option>
              {qualifications.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
        )}

        {qualification && classes.length > 0 && (
          <div>
            <label className={labelCls}>Class / Year</label>
            <select className={selectCls} value={classLevel} onChange={(e) => { setClassLevel(e.target.value); setSubject(""); }}>
              <option value="">Select class…</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {qualification && (classes.length === 0 || classLevel) && (
          <div>
            <label className={labelCls}>Subject</label>
            <select className={selectCls} value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">Select subject…</option>
              {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        <button
          type="button"
          disabled={!selected || ids.includes(selected._id)}
          onClick={addSelected}
          className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-50 text-sm"
        >
          Add to my list
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-[#021550]">Selected offerings</h2>
        {ids.length ? (
          <ul className="space-y-2">
            {ids.map((id) => {
              const x = items.find((o) => o._id === id);
              return (
                <li key={id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 bg-white">
                  <span className="text-sm">{x ? `${x.boardName} · ${x.qualificationName}${x.classLevel ? ` · ${x.classLevel}` : ""} · ${x.subjectDisplay}` : "Unavailable offering"}</span>
                  <button type="button" onClick={() => setIds(ids.filter((i) => i !== id))} className="text-red-700 underline text-sm">Remove</button>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-gray-500">No offerings selected yet.</p>}
      </div>

      {message && <p role="status" className="text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">{message}</p>}

      <button
        type="button"
        disabled={busy || ids.length === 0}
        onClick={save}
        className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save preferences"}
      </button>
    </main>
  );
}
