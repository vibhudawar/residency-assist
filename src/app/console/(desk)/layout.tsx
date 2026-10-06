import type { Metadata } from "next";
import { CallKeeper, LiveCallBar } from "@/components/console/call-keeper";
import { ConsoleBar } from "@/components/console/console-bar";
import { AutoRefresh, ConsoleTabs } from "@/components/console/live";
import { getAutoCall } from "@/lib/calls/auto";
import { requireOfficer } from "@/lib/officer";
import { db } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Operator console — Residency Assist (prototype)" };

export default async function DeskLayout({ children }: LayoutProps<"/console">) {
  const officer = await requireOfficer();
  const [pending, pendingUploads, handoffs, sms, blockedTools, blockedCalls, autoCall] = await Promise.all([
    db().from("corrections").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    db().from("uploads").select("id", { count: "exact", head: true }).eq("review_status", "pending_review"),
    db().from("handoffs").select("id", { count: "exact", head: true }).eq("status", "open"),
    db().from("sms_outbox").select("id", { count: "exact", head: true }),
    db().from("blocked_actions").select("id", { count: "exact", head: true }),
    db().from("call_attempts").select("id", { count: "exact", head: true }).eq("status", "blocked"),
    getAutoCall(),
  ]);

  return (
    // The console is English-only; keep it left-to-right even if the portal language cookie is Arabic.
    <div dir="ltr" lang="en" className="flex min-h-full flex-1 flex-col">
      {/* The call keeper holds a browser call for the whole console, so it survives moving between pages. */}
      <CallKeeper>
        <ConsoleBar officer={officer.name} autoCall={autoCall.enabled} />
        <ConsoleTabs
          counts={{
            "/console": (pending.count ?? 0) + (pendingUploads.count ?? 0),
            "/console/handoffs": handoffs.count ?? 0,
            "/console/sms": sms.count ?? 0,
            "/console/blocked": (blockedTools.count ?? 0) + (blockedCalls.count ?? 0),
          }}
        />
        <LiveCallBar />
        <AutoRefresh />
        <main id="console-main" tabIndex={-1} className="mx-auto w-full max-w-[1440px] flex-1 px-4 pt-6 pb-16 outline-none sm:px-6">{children}</main>
      </CallKeeper>
    </div>
  );
}
