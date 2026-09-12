import { redirect } from "next/navigation";

// /admin/verifications duplicated /admin/applications (same backend, narrower
// feature set - no suspend, re-verification override, eligibility override,
// or document upload-on-behalf). Retired in favor of the Applications
// directory; this redirect keeps old bookmarks/links working by landing on
// the equivalent filtered view instead of a bare 404.
export default function VerificationsRedirect() {
  redirect("/admin/applications?status=UNDER_REVIEW");
}
