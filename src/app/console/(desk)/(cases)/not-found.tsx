import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/** A case number that doesn't exist (often one removed by a demo reset). The queue stays beside it. */
export default function CaseNotFound() {
  return (
    <section className="max-w-[60ch] pt-4">
      <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.015em]">No case with that number</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
        It may have been removed by a demo reset. Pick a case from the queue, or open the one at the top.
      </p>
      <Link href="/console" className={buttonVariants({ size: "lg", className: "mt-6" })}>
        Open the first case
      </Link>
    </section>
  );
}
