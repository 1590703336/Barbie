function StatCard({ label, value, change }) {
  const isUp = (change ?? 0) >= 0
  const changeColor = isUp ? 'text-emerald-600' : 'text-rose-600'
  const changeLabel = isUp ? '↑' : '↓'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <span className={`text-sm font-medium ${changeColor}`}>
          {changeLabel} {Math.abs(change ?? 0)}%
        </span>
      </div>
    </div>
  )
}

export default StatCard

