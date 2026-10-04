"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, Layers3, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
import api from "@/lib/axios";
import { showError } from "@/lib/toast";

type Overview = { categories: number; disciplines: number; subjects: number; directRules: number; conditionalRules: number; pendingReviews: number };
const cards = [
  { key: "categories", label: "Subject categories", icon: Layers3, href: "/admin/curriculum", copy: "Organise the catalogue without changing historic records." },
  { key: "disciplines", label: "Academic disciplines", icon: GraduationCap, href: "/admin/discipline-subject-maps", copy: "Record verified education disciplines used in eligibility decisions." },
  { key: "subjects", label: "Active subjects", icon: BookOpen, href: "/admin/curriculum", copy: "Subjects tutors and students can discover in the marketplace." },
  { key: "pendingReviews", label: "Eligibility reviews", icon: ShieldCheck, href: "/admin/academic-framework/tutor-approvals", copy: "Subject requests awaiting review or supporting evidence." },
] as const;

export default function AcademicFrameworkPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try { const { data } = await api.get("/admin/academic-framework/overview"); setOverview(data.overview); }
    catch (error) { showError(error, "Could not load the academic framework"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-[#021550] to-[#0329B2] p-6 text-white shadow-sm sm:p-8">
      <p className="text-sm font-bold uppercase tracking-[0.15em] text-cyan-200">Academic governance</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Academic framework</h1>
      <p className="mt-2 max-w-3xl text-blue-100">A single source of truth for categories, subjects, education disciplines, and the rules that decide what a tutor may teach.</p>
    </div>

    {loading ? <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading academic framework">{[1, 2, 3, 4].map((item) => <div key={item} className="h-40 animate-pulse rounded-xl bg-slate-100" />)}</div> : <>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Academic framework summary">
        {cards.map(({ key, label, icon: Icon, href, copy }) => <Link key={key} href={href} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-200">
          <Icon className="h-6 w-6 text-[#016EF8]" aria-hidden />
          <p className="mt-4 text-3xl font-extrabold text-slate-900">{overview?.[key] ?? 0}</p>
          <h2 className="mt-1 font-bold text-slate-800">{label}</h2><p className="mt-2 text-sm leading-5 text-slate-600">{copy}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#0329B2]">Manage <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
        </Link>)}
      </section>
      <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-slate-800" aria-labelledby="eligibility-note">
        <div className="flex gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden /><div><h2 id="eligibility-note" className="font-bold">Teaching is never approved by a selected subject alone.</h2>
          <p className="mt-1 text-sm leading-6">Direct rules allow teaching within a verified discipline. Conditional rules require supporting evidence and an administrator’s decision. The older category and discipline-map screens remain available while their stored records are reconciled.</p>
        </div></div>
      </section>
      <Link href="/admin/academic-framework/import-export" className="mt-6 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-[#0329B2] shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-200">Manage code-based CSV imports and exports <ArrowRight className="h-4 w-4" aria-hidden /></Link>
    </>}
  </main>;
}
