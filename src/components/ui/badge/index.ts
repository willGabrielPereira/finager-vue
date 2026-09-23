import { cva, type VariantProps } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50',
  {
    variants: {
      variant: {
        default: 'bg-accent/15 text-accent border border-accent/30',
        secondary: 'bg-surface-2 text-white/80 border border-white/10',
        destructive: 'bg-rose-500/15 text-rose-400 border border-rose-500/25',
        outline: 'border border-white/10 text-white/70',
        success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
        warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
        info: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
