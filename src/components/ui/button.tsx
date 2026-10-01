import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Service Hall keys: solid ink or quiet paper, squared 8px, nothing moves on press.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-[8px] border border-transparent font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-ink text-paper hover:bg-board",
        outline: "border-ink/25 bg-paper text-ink hover:border-ink",
        secondary: "bg-secondary text-ink hover:bg-rule",
        ghost: "text-ink-2 hover:bg-secondary hover:text-ink",
        destructive: "border-officer/35 bg-paper text-officer hover:border-officer hover:bg-officer-bg",
        board: "border-board-rule bg-board-2 text-paper hover:border-led-amber hover:text-led-amber",
        link: "text-ink-2 underline-offset-[0.2em] hover:text-ink hover:underline",
      },
      size: {
        default: "h-10 px-4 text-[14px]",
        sm: "h-8 rounded-[6px] px-3 text-[13px]",
        lg: "h-12 px-6 text-[15px]",
        icon: "size-9 rounded-[6px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
