import "server-only";
import { createApplication } from "@/lib/applications/create";
import { env } from "@/lib/env";
import { clearDocuments } from "@/lib/storage";
import { db } from "@/lib/supabase/server";
import { addDays, uaeDateTime, uaeToday } from "@/lib/time";
import { AMER_CENTRES, SLOT_TIMES, demoPeople } from "./fixtures";
import { silhouettePhoto } from "./photos";

const FALLBACK_DEMO_PHONE = "+971500000000";

async function wipe(table: string, column: string) {
  // supabase-js requires a filter on delete; this matches every row.
  const { error } = await db().from(table).delete().not(column, "is", null);
  if (error) throw new Error(`Reset: clearing ${table} failed: ${error.message}`);
}

function must(result: { error: { message: string } | null }, table: string) {
  if (result.error) throw new Error(`Reset: seeding ${table} failed: ${result.error.message}`);
}

/** Next `count` UAE working days (Mon–Fri) after `from`. */
function workingDays(from: string, count: number): string[] {
  const days: string[] = [];
  for (let d = addDays(from, 1); days.length < count; d = addDays(d, 1)) {
    const weekday = new Date(`${d}T00:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6) days.push(d);
  }
  return days;
}

/** Puts the whole demo back to a known starting state. */
export async function resetDemo() {
  const today = uaeToday();
  const people = demoPeople(today);
  const phone = env().DEMO_PHONE_NUMBER ?? FALLBACK_DEMO_PHONE;

  // 1. Clear everything (children cascade from applications).
  await wipe("applications", "id");
  await wipe("call_records", "conversation_id");
  await wipe("appointment_slots", "id");
  await wipe("opt_outs", "phone");
  await wipe("person_status", "passport_number");
  await wipe("passport_records", "passport_number");
  await clearDocuments("applications");

  // 2. Mock registry.
  must(await db().from("passport_records").insert(people.map((p) => p.passport)), "passport_records");
  must(
    await db().from("person_status").insert(people.map((p) => ({ passport_number: p.passport.passport_number, ...p.status }))),
    "person_status",
  );

  // 3. Amer appointment slots for the next five working days.
  const slots = workingDays(today, 5).flatMap((day) =>
    AMER_CENTRES.flatMap((centre) =>
      SLOT_TIMES.flatMap((time) =>
        (["biometrics", "medical"] as const).map((purpose) => ({
          centre,
          purpose,
          starts_at: uaeDateTime(day, time).toISOString(),
        })),
      ),
    ),
  );
  must(await db().from("appointment_slots").insert(slots), "appointment_slots");

  // 4. Pre-seeded inbox applications (Rahul applies live on the portal instead).
  const seeded = [];
  for (const person of people) {
    if (!person.application) continue;
    const { photo_background, ...form } = person.application;
    seeded.push(
      await createApplication(
        { ...form, phone, is_demo_seed: true },
        { body: await silhouettePhoto(photo_background), contentType: "image/jpeg" },
      ),
    );
  }

  await db().from("audit_log").insert({ actor: "system", event: "demo_reset", detail: { seeded: seeded.length } });

  return seeded.map((s) => ({ reference: s.reference, status: s.status, failed: s.results.filter((r) => !r.passed).map((r) => r.code) }));
}
