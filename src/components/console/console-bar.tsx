import { signOutOfficer } from "@/app/console/actions";
import { dictionaries } from "@/lib/i18n";
import { ResetDemo } from "./reset-demo";

/** The hall bar, staff side: prototype banner, product mark, who is signed in, demo reset. */
export function ConsoleBar({ officer }: { officer?: string }) {
  return (
    <header className="bg-board text-led-text">
      <div className="border-b border-board-rule bg-led-amber px-4 py-1.5 text-center text-[12.5px] font-medium text-board">
        {dictionaries.en.banner}
      </div>
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-8 place-items-center rounded-[6px] bg-board-2 font-led text-[18px] font-black text-led-amber led-glow">
            R
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold whitespace-nowrap text-paper">Residency Assist</span>
            <span className="text-[12px] text-led-text/70">Operator console</span>
          </span>
        </div>
        {officer && (
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
        )}
      </div>
    </header>
  );
}
