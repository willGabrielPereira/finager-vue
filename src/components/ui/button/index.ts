import { cva, type VariantProps } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-bg hover:opacity-90 active:scale-[0.99] shadow-lg shadow-accent/15',
        destructive:
          'bg-rose-500/15 text-rose-400 border border-rose-500/25 hover:bg-rose-500/25 active:scale-[0.99]',
        outline:
          'border border-white/10 bg-transparent text-white hover:bg-white/5 hover:border-white/20 active:scale-[0.99]',
        secondary:
          'bg-surface-2 text-white border border-white/5 hover:bg-surface-2/80 active:scale-[0.99]',
        ghost:
          'text-slate-300 hover:bg-white/5 hover:text-white',
        link:
          'text-accent underline-offset-4 hover:underline p-0 h-auto font-normal',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm',
        sm: 'h-8 px-3 text-xs rounded-lg',
        lg: 'h-12 px-6 text-base rounded-xl font-bold',
        icon: 'h-9 w-9 rounded-lg',
        'icon-sm': 'h-7 w-7 rounded-md p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
