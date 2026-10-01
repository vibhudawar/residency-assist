// Review captures of the upload link, driven through the real flow on the local dev server:
// officer finds the SMS link → applicant uploads on a phone (Arabic fail, English fail, pass)
// → officer approves the photo → the link shows the approved state.
// Run after `pnpm smoke:tools` (which sends Fatima an upload link):
//   node --env-file=.env scripts/capture/upload.mjs .impeccable/review/upload
// The officer passcode comes from .env and is only typed into the local page; it is never printed.
import { mkdir, writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import sharp from "sharp";

const BASE = "http://localhost:3006"; // local dev server only
const OUT = process.argv[2] ?? ".impeccable/review/upload";
if (!process.env.OFFICER_PASSCODE) throw new Error("OFFICER_PASSCODE not loaded — run with node --env-file=.env");
await mkdir(OUT, { recursive: true });

// Test photos: a portrait head-and-shoulders shape on white (passes) and on blue (fails).
async function photo(bg, file) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1160"><rect width="100%" height="100%" fill="${bg}"/><ellipse cx="450" cy="470" rx="190" ry="240" fill="#6b4f3a"/><path d="M110 1160 C140 860 300 780 450 780 C600 780 760 860 790 1160 Z" fill="#2d3540"/></svg>`;
  await writeFile(file, await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer());
  return file;
}
const white = await photo("#fbfbfb", `${OUT}/test-white.jpg`);
const blue = await photo("#7fa7d9", `${OUT}/test-blue.jpg`);

const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
page.on("console", (m) => m.type() === "error" && console.log("CONSOLE ERROR", m.text().slice(0, 300)));

const settle = async (ms = 600) => {
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }); // dev-tools badge
  await new Promise((r) => setTimeout(r, ms));
};
const go = async (url) => {
  await page.goto(url.startsWith("http") ? url : `${BASE}${url}`, { waitUntil: "networkidle0" });
  await settle();
};
const shot = async (file, full = false) => {
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: full });
  console.log("captured", file);
};
const clickText = (text) => page.locator(`::-p-text(${text})`).click();
const lang = (value) => page.setCookie({ name: "ra_lang", value, url: BASE });
const desktop = () => page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const phone = () => page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const pickFile = async (file) => (await page.$('input[type="file"]:not([capture])')).uploadFile(file);
async function send(sendLabel, resultText) {
  await page.waitForSelector(`::-p-text(${sendLabel})`);
  await clickText(sendLabel);
  await page.waitForSelector(`::-p-text(${resultText})`, { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2200)); // let the lamps settle and the board scroll into view
}

// Officer: sign in, find Fatima's upload link in the SMS outbox.
await desktop();
await go("/console/signin");
await page.type("#passcode", process.env.OFFICER_PASSCODE);
await Promise.all([page.waitForNavigation({ waitUntil: "networkidle0" }), clickText("Open the console")]);
await go("/console/sms");
const link = await page.evaluate(() => document.body.innerText.match(/https?:\/\/\S+\/u\/[A-Za-z0-9_-]+/)?.[0]);
if (!link) throw new Error("no upload link in the SMS outbox — run pnpm smoke:tools first");
const path = new URL(link).pathname;

// Applicant on a phone. Fatima's call language is Arabic, so with no cookie the page opens in Arabic.
await page.deleteCookie({ name: "ra_lang", url: BASE });
await phone();
await go(path);
await shot("upload-ar-empty.png");
await pickFile(blue);
await send("أرسل للتحقق", "لم تُقبل بعد");
await shot("upload-ar-failed.png");

await lang("en");
await go(path);
await shot("upload-empty.png");
await pickFile(blue);
await page.waitForSelector("::-p-text(Send for checking)");
await settle(300);
await shot("upload-selected.png");
await send("Send for checking", "Not accepted yet");
await shot("upload-failed.png");

await pickFile(white);
await send("Send for checking", "Photo received");
await shot("upload-passed.png");
await shot("upload-passed-full.png", true);

// Reload in Arabic: the link now says the photo was received.
await lang("ar");
await go(path);
await shot("upload-ar-passed.png");
await lang("en");

await desktop();
await go(path);
await shot("upload-desktop.png");

// Officer approves the new photo.
await go("/console");
const href = await page.evaluate(() => [...document.querySelectorAll('a[href^="/console/cases/"]')].find((a) => a.textContent.includes("Fatima"))?.getAttribute("href"));
await go(href);
const slip = await page.$('article[aria-label="New photo"]');
await slip.screenshot({ path: `${OUT}/console-photo-slip.png` });
console.log("captured console-photo-slip.png");
await clickText("Approve photo");
await page.waitForSelector("::-p-text(The new photo is now on the application)", { timeout: 30000 });
await settle(1200);
await shot("console-photo-approved.png");

// The link now shows it's done.
await phone();
await go(path);
await shot("upload-approved.png");

await browser.close();
