import { expect, test } from "@playwright/test";

test("reference subjects have reachable pages and a prefilled student request", async ({ page, request }) => {
  test.setTimeout(90_000);
  await page.goto("/subjects", { waitUntil: "domcontentloaded" });
  const links = page.locator('a[href^="/subjects/"]');
  await expect(links).toHaveCount(23);
  const hrefs = await links.evaluateAll((elements) => elements.map((element) => element.getAttribute("href")!));
  expect(new Set(hrefs).size).toBe(23);
  for (let offset = 0; offset < hrefs.length; offset += 5) {
    const responses = await Promise.all(hrefs.slice(offset, offset + 5).map((href) => request.get(href)));
    expect(responses.map((response) => response.status())).toEqual(responses.map(() => 200));
  }
  await page.getByRole("link", { name: /mathematics.*explore subject/i }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mathematics tutoring");
  await page.getByRole("link", { name: /request mathematics tuition/i }).click();
  await expect(page.getByLabel("Select Subject *")).toHaveValue("Mathematics", { timeout: 30_000 });
});

test("subject page remains usable on a narrow screen and invalid slugs return 404", async ({ page, request }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/subjects/quran-arabic", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Quran & Arabic tutoring");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await request.get("/subjects/unknown-subject-fixture")).status()).toBe(404);
});
