import { clsx } from 'clsx'

export default function Button({ children, variant = 'primary', size = 'md', loading, className, ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    success: 'btn-success',
    ghost: 'text-surface-400 hover:text-surface-100 hover:bg-surface-800 px-4 py-2 rounded-md text-sm font-medium transition-colors',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  return (
    <button
      className={clsx(variants[variant], size !== 'md' && sizes[size], 'inline-flex items-center gap-2', className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
}
