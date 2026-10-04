import { notFound } from "next/navigation";
import { CallReplay, type Replay } from "@/components/console/replay/call-replay";
import recorded from "@/components/console/replay/test-call-rahul.json";
import { requireOfficer } from "@/lib/officer";

/**
 * Local only: a recorded test call replayed on the live call board, beside the real queue, for design
 * review without spending call credits. `?speed=4` plays faster; `?at=70` opens at that second.
 */
export default async function ReplayPage({ searchParams }: PageProps<"/console/replay">) {
  if (process.env.NODE_ENV === "production") notFound();
  await requireOfficer();
  const { speed, at } = await searchParams;
  const pace = Math.min(8, Math.max(0.5, Number(speed) || 1));
  const seek = at === undefined ? undefined : Math.max(0, Number(at) || 0);
  return (
    <section aria-label="Call" className="pt-1">
      <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.015em]">Call replay</h1>
      <p className="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-ink-2">
        A real test call (Rahul, name correction), replayed on the live call board so its design can be reviewed without placing a call.
      </p>
      <CallReplay replay={recorded as Replay} speed={pace} seekTo={seek} />
    </section>
  );
}
