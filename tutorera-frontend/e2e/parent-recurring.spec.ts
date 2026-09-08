import { expect, test } from "@playwright/test";

test("parent selects a consent-linked child and manages only that plan", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("token", "e2e-token"));
  let selectedChild = "";
  await page.route("https://tutorera-backend.onrender.com/api/v1/**", async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/auth/me")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { _id: "parent-1", name: "Parent", email: "parent@test.com", role: "parent", isVerified: true, isApproved: true, plan: "free" } }) });
    if (url.pathname.endsWith("/parent/profile")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ profile: { children: [{ studentUser: "child-1", name: "Ayesha", level: "O-Level" }, { studentUser: "child-2", name: "Hamza", level: "Matric" }] } }) });
    if (url.pathname.endsWith("/recurring/plans")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ plans: [], subscription: { enabled: false, message: "Recurring checkout is not available." } }) });
    if (url.pathname.endsWith("/recurring/my-bookings")) {
      selectedChild = url.searchParams.get("childId") || "";
      const subject = selectedChild === "child-2" ? "Physics" : "Mathematics";
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ bookings: [{ _id: `plan-${selectedChild}`, subject, sessionsRemaining: 3, sessionsCompleted: 1, sessionsUsed: [1], startDate: "2026-09-01", status: "active", paymentStatus: "confirmed", totalPaid: 4000, tutor: { name: "Test Tutor" } }] }) });
    }
    if (url.pathname.includes("/recurring/plan-") && url.pathname.endsWith("/pause")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  await page.goto("/recurring");
  const picker = page.getByLabel("Manage plans for");
  await expect(picker).toHaveValue("child-1");
  await expect(page.getByRole("heading", { name: "Mathematics" })).toBeVisible();
  await picker.selectOption("child-2");
  await expect(page.getByRole("heading", { name: "Physics" })).toBeVisible();
  expect(selectedChild).toBe("child-2");
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText("Recurring plan paused.")).toBeVisible();
});
