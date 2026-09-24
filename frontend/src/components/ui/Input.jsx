import { clsx } from 'clsx'

export default function Input({ label, error, className, ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">{label}</label>}
      <input className={clsx('input-field', error && 'border-danger focus:ring-danger', className)} {...props} />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
