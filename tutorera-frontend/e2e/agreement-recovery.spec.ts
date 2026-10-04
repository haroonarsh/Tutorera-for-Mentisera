import { expect, test } from "@playwright/test";

for (const failedRefresh of [false, true]) {
test(`stale agreement recovery (${failedRefresh ? "failed refresh" : "updated terms"})`, async ({ page }) => {
  let currentReads = 0;
  let attempts = 0;
  await page.addInitScript(() => localStorage.setItem("token", "agreement-test-token"));
  await page.route("**/api/v1/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = {};
    if (path.endsWith("/auth/me")) body = { user: { _id: "tutor-1", name: "Fixture Tutor", role: "tutor", email: "fixture@example.test", isActive: true } };
    if (path.endsWith("/tracking/application-status")) body = { payload: { marketplaceEligibility: { eligible: false } } };
    if (path.endsWith("/tutor/agreements/current")) {
      currentReads++;
      if (failedRefresh && attempts > 0) {
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Refresh unavailable" }) });
        return;
      }
      const revision = attempts > 0 ? 2 : 1;
      body = { agreement: { _id: "agreement-1", title: "Tutor Agreement", version: `v${revision}`,
        content: `Terms revision ${revision}`, contentHash: `hash-${revision}`, country: "GLOBAL",
        effectiveDate: "2026-10-04", companyDetails: { legalName: "Fixture Company", tradingName: "TUTORERA" } },
        verifiedLegalName: "Fixture Tutor", alreadyAccepted: false,
        feeSchedule: { marketplaceFeePercent: 20, taxRatePercent: 15, currency: "USD", summary: "Tutor fee" } };
    }
    if (path.endsWith("/tutor/agreements/accept")) {
      attempts++;
      expect(route.request().postDataJSON().agreementHash).toBe("hash-1");
      await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ code: "AGREEMENT_CONTENT_CHANGED", message: "Reload terms" }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/tutor/accept-agreement");
  const signature = page.locator("#electronicSignature");
  await expect(signature).toBeVisible();
  const checkboxes = page.getByRole("checkbox");
  for (let index = 0; index < await checkboxes.count(); index++) await checkboxes.nth(index).check();
  await signature.fill("Fixture Tutor");
  const submit = page.getByRole("button", { name: "I Have Read, Understood, and Electronically Execute This Agreement" });
  await expect(submit).toBeEnabled();
  await submit.click();
  if (failedRefresh) {
    await expect(page.getByRole("heading", { name: "The agreement could not be opened" })).toBeVisible();
    await expect(submit).toHaveCount(0);
    await expect(signature).toHaveCount(0);
    expect(attempts).toBe(1);
    return;
  }
  await expect(signature).toHaveValue("");
  await expect(submit).toBeDisabled();
  await expect(page.getByText("Terms revision 2", { exact: true })).toBeVisible();
  for (let index = 0; index < await checkboxes.count(); index++) await expect(checkboxes.nth(index)).not.toBeChecked();
  expect(attempts).toBe(1);
  expect(currentReads).toBeGreaterThan(1);
});
}
