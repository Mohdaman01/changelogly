import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[var(--accent)] text-white',
        secondary:
          'border-transparent bg-[var(--bg-muted)] text-[var(--text-muted)]',
        outline:
          'border-[var(--border-strong)] text-[var(--text-muted)]',
        success:
          'border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
        warning:
          'border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
        danger:
          'border-transparent bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
        accent:
          'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
