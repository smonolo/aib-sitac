import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border border-transparent text-sm font-semibold whitespace-nowrap transition-opacity outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default:
          'bg-aib-surface-muted text-aib-fg hover:opacity-90 dark:bg-aib-surface-muted-dark dark:text-aib-fg-inverse',
        secondary:
          'bg-aib-surface text-aib-fg ring-1 ring-inset ring-aib-border hover:opacity-90 dark:bg-aib-surface-dark dark:text-aib-fg-inverse dark:ring-aib-border-dark',
        ghost:
          'bg-transparent text-aib-muted hover:opacity-70 dark:text-aib-muted-dark',
        destructive:
          'bg-aib-surface-muted text-aib-brand hover:opacity-90 dark:bg-aib-surface-muted-dark',
        link: 'bg-transparent text-aib-fg underline underline-offset-2 hover:opacity-70 dark:text-aib-fg-inverse',
      },
      size: {
        default: 'min-h-[52px] rounded-aib px-3',
        sm: 'min-h-9 rounded-aib-sm px-2.5 text-[13px]',
        xs: 'min-h-7 rounded-md px-2 text-[12px] font-medium',
        lg: 'min-h-[52px] rounded-aib px-4',
        icon: 'size-10 rounded-full',
        'icon-sm': 'size-9 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant = 'default',
  size = 'default',
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

export { Button }
