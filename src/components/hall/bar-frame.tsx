import { cn } from "@/lib/utils";

/**
 * The hall bar's frame, shared by the applicant bar, the console bar and the error screens: the amber
 * prototype banner (never removed), the "R" monogram, the product name and its subtitle. Whatever
 * belongs on the right (language switch, officer, sign out) is passed in.
 */
export function BarFrame({
  banner,
  product,
  subtitle,
  variant,
  right,
}: {
  banner: string;
  product: string;
  subtitle: string;
  variant: "portal" | "console";
  right?: React.ReactNode;
}) {
  const portal = variant === "portal";
  return (
    <header className="bg-board text-led-text">
      <div className="border-b border-board-rule bg-led-amber px-4 py-1.5 text-center text-[12.5px] font-medium text-board">{banner}</div>
      <div
        className={cn(
          "mx-auto flex items-center justify-between",
          portal ? "max-w-[1240px] gap-4 px-6 py-3.5" : "max-w-[1440px] gap-3 px-4 py-3 sm:gap-4 sm:px-6",
        )}
      >
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-8 place-items-center rounded-[6px] bg-board-2 font-led text-[18px] font-black text-led-amber led-glow">
            R
          </span>
          <span className="flex flex-col leading-tight">
            <span className={cn("text-[15px] font-semibold text-paper", !portal && "whitespace-nowrap")}>{product}</span>
            <span className={cn("text-[12px] text-led-text/70", portal && "max-sm:hidden")}>{subtitle}</span>
          </span>
        </div>
        {right}
      </div>
    </header>
  );
}
