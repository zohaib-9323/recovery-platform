import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[04px] text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rp-accent focus-visible:ring-offset-2 focus-visible:ring-offset-rp-bg disabled:pointer-events-none disabled:text-rp-disabled [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-rp-accent text-white shadow-sm disabled:bg-rp-disabled disabled:text-white',
        secondary: 'border border-rp-border bg-rp-bg text-rp-fg shadow-sm disabled:bg-rp-bg',
        outline: 'border border-rp-border bg-transparent text-rp-fg disabled:border-rp-border',
        ghost: 'text-rp-fg',
        destructive: 'bg-red-600 text-white disabled:bg-red-300 disabled:text-white',
        /** Full-width login CTA — same primary fill as default */
        login: 'bg-rp-accent text-white shadow-sm disabled:bg-rp-disabled disabled:text-white',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
