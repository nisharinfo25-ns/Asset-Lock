export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-surface-800 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-surface-500" />
        </div>
      )}
      <h3 className="text-base font-medium text-surface-300 mb-2">{title}</h3>
      {description && <p className="text-sm text-surface-500 max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  )
}
