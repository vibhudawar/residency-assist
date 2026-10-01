import { signOutOfficer } from "@/app/console/actions";
import { BarFrame } from "@/components/hall/bar-frame";
import { HALL_WORDS } from "@/lib/hall-words";
import { ResetDemo } from "./reset-demo";

/** The hall bar, staff side: prototype banner, product mark, who is signed in, demo reset. */
export function ConsoleBar({ officer }: { officer?: string }) {
  return (
    <BarFrame
      variant="console"
      banner={HALL_WORDS.en.banner}
      product="Residency Assist"
      subtitle="Operator console"
      right={
        officer && (
          <div className="flex items-center gap-3 sm:gap-5">
            <ResetDemo />
            <span aria-hidden className="h-6 w-px bg-board-rule max-sm:hidden" />
            <span className="text-[13px] text-led-text/80 max-sm:hidden">{officer}</span>
            <form action={signOutOfficer}>
              <button type="submit" className="text-[13px] whitespace-nowrap text-paper underline-offset-[0.2em] hover:text-led-amber hover:underline">
                Sign out
              </button>
            </form>
          </div>
        )
      }
    />
  );
}
