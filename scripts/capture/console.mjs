// Review captures of the operator console on the local dev server.
//   node --env-file=.env scripts/capture/console.mjs [outDir] [route …]
// Signs in with OFFICER_PASSCODE from .env (typed into the local page only; never printed), then
// captures each route at 1440×900. A route may name a case by applicant: "case:Ahmed Rashid".
// Defaults to the desk, call records, evidence and Ahmed's case (full page).
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer-core";

const BASE = "http://localhost:3006"; // local dev server only
const [, , OUT = ".impeccable/review/console", ...ROUTES] = process.argv;
const routes = ROUTES.length ? ROUTES : ["/console", "/console/records", "/console/evidence", "case:Ahmed Rashid"];
if (!process.env.OFFICER_PASSCODE) throw new Error("OFFICER_PASSCODE not loaded — run with node --env-file=.env");
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
page.on("console", (m) => m.type() === "error" && console.log("CONSOLE ERROR", m.text().slice(0, 300)));

const settle = async (ms = 600) => {
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }); // dev-tools badge
  await new Promise((r) => setTimeout(r, ms));
};
const go = async (path) => {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0" });
  await settle();
};
const name = (route) => route.replace(/^\/console\/?/, "").replace(/^case:/, "case-").replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "desk";

await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await go("/console/signin");
await page.type("#passcode", process.env.OFFICER_PASSCODE);
await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), page.locator("::-p-text(Open the console)").click()]);

for (const route of routes) {
  if (route.startsWith("case:")) {
    await go("/console");
    const who = route.slice(5);
    const href = await page.evaluate((n) => [...document.querySelectorAll('a[href^="/console/cases/"]')].find((a) => a.textContent.includes(n))?.getAttribute("href"), who);
    if (!href) throw new Error(`no queue row for ${who}`);
    await go(href);
    await page.screenshot({ path: `${OUT}/console-${name(route)}-full.png`, fullPage: true });
  } else {
    await go(route);
    await page.screenshot({ path: `${OUT}/console-${name(route)}.png` });
  }
  console.log("captured", name(route));
}
await browser.close();
