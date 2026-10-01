import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ConsoleBar } from "@/components/console/console-bar";
import { getOfficerSession } from "@/lib/officer";
import { SignInForm } from "./signin-form";

export const metadata: Metadata = { title: "Officer sign-in — Residency Assist (prototype)" };

export default async function OfficerSignInPage() {
  if (await getOfficerSession()) redirect("/console");
  return (
    <div dir="ltr" lang="en" className="flex min-h-full flex-1 flex-col">
      <ConsoleBar />
      <main className="mx-auto grid w-full max-w-[1240px] flex-1 items-center gap-12 px-6 py-16 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h1 className="max-w-[16ch] text-[44px] leading-[1.05] font-semibold tracking-[-0.02em] lg:text-[52px]">The officer&apos;s side of the counter</h1>
          <p className="mt-5 max-w-[48ch] text-[18px] leading-relaxed text-ink-2">
            Work the queue, start the assistant&apos;s call, and decide every correction it captures. Nothing reaches an application without your approval.
          </p>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <div className="rounded-[12px] border border-rule bg-paper p-7 shadow-[0_24px_40px_-28px_rgb(22_24_26/0.5)]">
            <h2 className="text-[22px] font-semibold">Officer sign-in</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
              Prototype: one shared passcode stands in for the authority&apos;s staff sign-in.
            </p>
            <SignInForm />
          </div>
        </div>
      </main>
    </div>
  );
}
