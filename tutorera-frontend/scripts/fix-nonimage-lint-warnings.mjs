import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const p = (file) => path.join(root, file);

function read(file) { return fs.readFileSync(p(file), "utf8"); }
function write(file, text) { fs.writeFileSync(p(file), text); }
function replace(file, before, after) {
  const text = read(file);
  if (!text.includes(before)) throw new Error(`Expected text not found in ${file}: ${before.slice(0, 120)}`);
  write(file, text.replace(before, after));
}
function removeFunction(file, name) {
  const text = read(file);
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const node = sf.statements.find((s) => ts.isFunctionDeclaration(s) && s.name?.text === name);
  if (!node) throw new Error(`Function ${name} not found in ${file}`);
  write(file, text.slice(0, node.getFullStart()) + text.slice(node.getEnd()));
}
function removeVariableStatement(file, name) {
  const text = read(file);
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const node = sf.statements.find((s) => ts.isVariableStatement(s) && s.declarationList.declarations.some((d) => ts.isIdentifier(d.name) && d.name.text === name));
  if (!node) throw new Error(`Variable ${name} not found in ${file}`);
  write(file, text.slice(0, node.getFullStart()) + text.slice(node.getEnd()));
}

// React hook dependency correctness.
replace("src/app/admin/contacts/page.tsx", 'import { useEffect,useState } from "react";', 'import { useCallback,useEffect,useState } from "react";');
replace("src/app/admin/contacts/page.tsx", '  const fetchContacts = (page: number = 1, type: string = filter) => {', '  const fetchContacts = useCallback((page: number = 1, type: string = filter) => {');
replace("src/app/admin/contacts/page.tsx", '      .finally(() => setLoading(false));\n  };\n\n  useEffect(() => { fetchContacts(1, filter); }, [filter]);', '      .finally(() => setLoading(false));\n  }, [filter]);\n\n  useEffect(() => { fetchContacts(1, filter); }, [fetchContacts, filter]);');

replace("src/app/admin/reconciliation/page.tsx", 'import { useEffect,useState } from "react";', 'import { useCallback,useEffect,useState } from "react";');
replace("src/app/admin/reconciliation/page.tsx", '  const fetchData = async () => {', '  const fetchData = useCallback(async () => {');
replace("src/app/admin/reconciliation/page.tsx", '  };\n\n  useEffect(() => {\n    fetchData();\n  }, [filter]);', '  }, [filter]);\n\n  useEffect(() => {\n    fetchData();\n  }, [fetchData]);');

replace("src/app/admin/safety-cases/page.tsx", 'import { useEffect,useState } from "react";', 'import { useCallback,useEffect,useState } from "react";');
replace("src/app/admin/safety-cases/page.tsx", '  const fetchCases = async () => {', '  const fetchCases = useCallback(async () => {');
replace("src/app/admin/safety-cases/page.tsx", '  };\n\n  useEffect(() => {\n    fetchCases();\n  }, [filterStatus]);', '  }, [filterStatus]);\n\n  useEffect(() => {\n    fetchCases();\n  }, [fetchCases]);');

replace("src/app/admin/users/page.tsx", 'import { useEffect,useState } from "react";', 'import { useCallback,useEffect,useState } from "react";');
replace("src/app/admin/users/page.tsx", '  const fetchUsers = (page: number = 1, searchTerm: string = search, role: string = roleFilter) => {', '  const fetchUsers = useCallback((page: number = 1, searchTerm: string = "", role: string = "all") => {');
replace("src/app/admin/users/page.tsx", '      .finally(() => setLoading(false));\n  };\n\n  useEffect(() => { fetchUsers(1); }, []);\n\n  // Debounced search\n  useEffect(() => {\n    const timer = setTimeout(() => fetchUsers(1, search, roleFilter), 400);\n    return () => clearTimeout(timer);\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [search]);\n\n  // Immediate refetch on role filter change\n  useEffect(() => {\n    fetchUsers(1, search, roleFilter);\n    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [roleFilter]);', '      .finally(() => setLoading(false));\n  }, []);\n\n  useEffect(() => {\n    const delay = search.trim() ? 400 : 0;\n    const timer = setTimeout(() => fetchUsers(1, search, roleFilter), delay);\n    return () => clearTimeout(timer);\n  }, [search, roleFilter, fetchUsers]);');

replace("src/app/admin/verifications/page.tsx", 'import { useEffect,useState } from "react";', 'import { useCallback,useEffect,useState } from "react";');
replace("src/app/admin/verifications/page.tsx", '  const fetchTutors = async (page: number = 1) => {', '  const fetchTutors = useCallback(async (page: number = 1) => {');
replace("src/app/admin/verifications/page.tsx", '  };\n\n  useEffect(() => { fetchTutors(1); }, [filter]);', '  }, [filter]);\n\n  useEffect(() => { fetchTutors(1); }, [fetchTutors]);');
removeVariableStatement("src/app/admin/verifications/page.tsx", "toggleSelectAll");

replace("src/app/profile/page.tsx", 'import { useEffect,useState } from "react";', 'import { useEffect,useMemo,useState } from "react";');
replace("src/app/profile/page.tsx", '  const subjects = geo.subjects && geo.subjects.length > 0 ? geo.subjects : ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "Computer Science", "Islamiyat", "Pakistan Studies", "Economics", "Statistics", "Other"];\n  const levels = geo.levels && geo.levels.length > 0 ? geo.levels : ["Primary (Grades 1-5)", "Middle (Grades 6-8)", "Matric (9th & 10th)", "Intermediate / FSc", "O-Level (Cambridge / Edexcel)", "A-Level (Cambridge / Edexcel)", "IB (Middle Years / Diploma)", "University / Degree", "Test Preparation", "Other"];', '  const subjects = useMemo(() => geo.subjects && geo.subjects.length > 0 ? geo.subjects : ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Urdu", "Computer Science", "Islamiyat", "Pakistan Studies", "Economics", "Statistics", "Other"], [geo.subjects]);\n  const levels = useMemo(() => geo.levels && geo.levels.length > 0 ? geo.levels : ["Primary (Grades 1-5)", "Middle (Grades 6-8)", "Matric (9th & 10th)", "Intermediate / FSc", "O-Level (Cambridge / Edexcel)", "A-Level (Cambridge / Edexcel)", "IB (Middle Years / Diploma)", "University / Degree", "Test Preparation", "Other"], [geo.levels]);');
replace("src/app/profile/page.tsx", '  }, [user, loading, router]);', '  }, [user, loading, router, subjects, levels]);');

replace("src/components/AIChatWidget.tsx", '  }, [hasGreeted, open, user?.name, persistedLoaded]);', '  }, [hasGreeted, open, user?.name, persistedLoaded, messages.length]);');

// Misc correctness and dead declarations.
replace("src/app/onboarding/tutor/page.tsx", '  const toggleItem = (arr: string[], item: string, setter: (v: string[]) => void) => {\n    arr.includes(item) ? setter(arr.filter(i => i !== item)) : setter([...arr, item]);\n  };', '  const toggleItem = (arr: string[], item: string, setter: (v: string[]) => void) => {\n    if (arr.includes(item)) setter(arr.filter(i => i !== item));\n    else setter([...arr, item]);\n  };');

replace("src/app/parents/page.tsx", '  const router = useRouter();\n', '');
removeFunction("src/app/parents/page.tsx", "LinkChildModalStandalone");
replace("src/app/privacy-center/page.tsx", '    } catch (err) {\n      // Handled gracefully\n', '    } catch {\n      // Handled gracefully\n');

replace("src/app/register/page.tsx", '  const [referralApplied, setReferralApplied] = useState(false);\n  const [referralMsg, setReferralMsg] = useState("");\n', '');
replace("src/app/register/page.tsx", '          const res = await api.post("/referral/apply", { code: referralCode.trim() });\n          setReferralMsg(res.data.message);', '          await api.post("/referral/apply", { code: referralCode.trim() });');
replace("src/app/register/page.tsx", "border: `1.5px solid ${referralApplied ? '#bbf7d0' : '#e5e7eb'}`", "border: '1.5px solid #e5e7eb'");
replace("src/app/register/page.tsx", "onBlur={e => (e.currentTarget.style.borderColor = referralApplied ? '#bbf7d0' : '#e5e7eb')}", "onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}");

replace("src/app/tuition-requests/[country]/TuitionRequestsClient.tsx", '  const { user } = useAuth();\n', '');
replace("src/app/tuition-requests/[country]/TuitionRequestsClient.tsx", '  const router = useRouter();\n  const searchParams = useSearchParams();\n', '');
removeFunction("src/app/tuition-requests/[country]/TuitionRequestsClient.tsx", "getPageTitle");

replace("src/components/Dashboard/AvailabilityManager.tsx", '              {daySlots.map((slot, globalIndex) => {\n                const index = slots.findIndex((s, i) => s.day === day && slots.filter((ss, ii) => ss.day === day && ii < i).length === daySlots.indexOf(slot));\n                const realIndex = slots.indexOf(slot);', '              {daySlots.map((slot) => {\n                const realIndex = slots.indexOf(slot);');
removeVariableStatement("src/components/Dashboard/CommissionCalculator.tsx", "quickRates");

removeFunction("src/components/Dashboard/ParentDashboard.tsx", "LinkChildModal");
replace("src/components/Dashboard/ParentDashboard.tsx", 'export default function ParentDashboard({ userId, userName }: ParentDashboardProps) {', 'export default function ParentDashboard({ userId }: ParentDashboardProps) {');
replace("src/components/Dashboard/ParentDashboard.tsx", '  const [parentId, setParentId] = useState<string>("");\n', '');
replace("src/components/Dashboard/ParentDashboard.tsx", '        setData(res.data);\n        setParentId(res.data.profile?._id ?? "");', '        setData(res.data);');

replace("src/components/Dashboard/StudentDashboard.tsx", '  request,\n  onBidAccepted,\n  onRefresh,', '  request,\n  onRefresh,');

replace("src/components/Tutors/TutorVideoPlayer.tsx", '  subjects = [],\n  city = "Pakistan",\n  hourlyRate,\n  currency = "PKR",', '  subjects = [],');
replace("src/components/Tutors/TutorVideoPlayer.tsx", '  const hasEmbed = Boolean(youtubeUrl || vimeoUrl || loomUrl);\n', '');
replace("src/components/marketplace/CounterOfferSheet.tsx", '  tutorName,\n  role = "student",', '  tutorName,');
replace("src/components/marketplace/CountryCitySelector.tsx", '  const availableCities = useMemo(() => {\n    const list = countriesProp || COUNTRIES;\n    const country = list.find((c) => c.code === currentCountry.code);\n    return country ? country.cities.map((ct) => ct.name) : [];\n  }, [currentCountry.code, countriesProp]);\n\n', '');

replace("src/context/SocketContext.tsx", '  const [socket, setSocket] = useState<Socket | null>(null);\n', '');
replace("src/context/SocketContext.tsx", '    setSocket(newSocket);\n\n', '');
replace("src/components/TuitionRequests/TuitionRequestsExplorer.tsx", '  const [showFilters, setShowFilters] = useState(false);\n', '');
replace("src/lib/analytics.ts", '  } catch (err) {\n    // Fail silent to never disrupt user experience\n', '  } catch {\n    // Fail silent to never disrupt user experience\n');
replace("src/components/Footer.tsx", '/* eslint-disable @next/next/no-img-element */\n', '');
replace("src/i18n/messages/ar.ts", '// eslint-disable-next-line @typescript-eslint/no-explicit-any\n', '');

// Remove unused standalone style constants left in offers page.
for (const name of ["primary", "secondary", "overlay", "modal", "label", "input"]) {
  removeVariableStatement("src/app/offers/page.tsx", name);
}

console.log("Applied targeted non-image lint warning cleanup.");
