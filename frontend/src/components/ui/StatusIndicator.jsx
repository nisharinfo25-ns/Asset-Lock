export default function StatusIndicator({ status, label }) {
  const configs = {
    active: { dot: 'bg-success', text: 'text-success', label: label || 'Active' },
    inactive: { dot: 'bg-surface-500', text: 'text-surface-500', label: label || 'Inactive' },
    pending: { dot: 'bg-warning animate-pulse', text: 'text-warning', label: label || 'Pending' },
    error: { dot: 'bg-danger', text: 'text-danger', label: label || 'Error' },
    verified: { dot: 'bg-success', text: 'text-success', label: label || 'Verified' },
    mismatch: { dot: 'bg-danger animate-pulse', text: 'text-danger', label: label || 'Mismatch' },
  }
  const config = configs[status] || configs.inactive
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
    </span>
  )
}
