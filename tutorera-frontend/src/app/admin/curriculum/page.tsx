import { redirect } from "next/navigation";

/** Legacy bookmark compatibility. This was always a subject list, not a curriculum editor. */
export default function LegacyCurriculumPage() {
  redirect("/admin/academic-framework/subjects");
}
