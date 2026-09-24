import { clsx } from 'clsx'

const variants = {
  success: 'bg-success/10 text-success border border-success/20',
  danger: 'bg-danger/10 text-danger border border-danger/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  info: 'bg-info/10 text-info border border-info/20',
  accent: 'bg-accent-500/10 text-accent-400 border border-accent-500/20',
  neutral: 'bg-surface-800 text-surface-400 border border-surface-700',
}

export default function Badge({ children, variant = 'neutral', className }) {
  return (
    <span className={clsx('status-badge', variants[variant], className)}>
      {children}
    </span>
  )
}
