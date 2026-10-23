import type { Browser, BrowserContext, Page } from "@playwright/test";

// Every phone we open is closed after the test, so cameras and pose loops from one test never steal CPU from the next.
// Each page also records console errors and uncaught errors: a test that opened a page fails if it logged any.
const open: BrowserContext[] = [];
const errors: string[] = [];
export async function newPhone(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext();
  open.push(ctx);
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  return page;
}
export async function closePhones() {
  await Promise.all(open.splice(0).map((c) => c.close().catch(() => {})));
  const seen = errors.splice(0);
  if (seen.length) throw new Error(`browser logged errors:\n${seen.join("\n")}`);
}
