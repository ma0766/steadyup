import type { Browser, BrowserContext, Page } from "@playwright/test";

// Every phone we open is closed after the test, so cameras and pose loops from one test never steal CPU from the next.
const open: BrowserContext[] = [];
export async function newPhone(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext();
  open.push(ctx);
  return ctx.newPage();
}
export async function closePhones() {
  await Promise.all(open.splice(0).map((c) => c.close().catch(() => {})));
}
