"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * When a screen fails: say what happened in plain words, offer the one way forward (try again,
 * which re-fetches), and an exit. No error text from the server is ever shown, only Next's digest,
 * a hash that matches the server log.
 */
export function ErrorNotice({
  title,
  body,
  retry,
  retryLabel,
  retryingLabel,
  exit,
  digest,
  refLabel,
  size = "page",
}: {
  title: string;
  body: string;
  retry: () => void;
  retryLabel: string;
  retryingLabel: string;
  exit?: { href: string; label: string };
  digest?: string;
  refLabel: string;
  /** `page` heads a whole screen; `panel` stands in for one part of a screen (a case file). */
  size?: "page" | "panel";
}) {
  const [pending, start] = useTransition();
  return (
    <section role="alert" className="max-w-[60ch]">
      <h1 className={cn("font-semibold tracking-[-0.015em]", size === "page" ? "text-[28px] leading-[1.12] sm:text-[36px]" : "text-[28px] leading-tight")}>{title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{body}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="button" size="lg" disabled={pending} onClick={() => start(() => retry())}>
          {pending ? retryingLabel : retryLabel}
        </Button>
        {exit && (
          <Link href={exit.href} className={buttonVariants({ variant: "ghost", size: "lg" })}>
            {exit.label}
          </Link>
        )}
      </div>
      {digest && (
        <p className="mt-8 text-[12.5px] text-ink-2">
          {refLabel} <span dir="ltr" className="font-mono text-ink">{digest}</span>
        </p>
      )}
    </section>
  );
}
