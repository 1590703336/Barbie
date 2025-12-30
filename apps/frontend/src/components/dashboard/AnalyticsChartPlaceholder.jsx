function AnalyticsChartPlaceholder({ title, description, data = [] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 px-3 py-2"
          >
            <span className="text-sm text-slate-600">{item.label}</span>
            <span className="text-base font-semibold text-slate-900">
              {item.value}
            </span>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-sm text-slate-500">No data yet</p>
        )}
      </div>
    </div>
  )
}

export default AnalyticsChartPlaceholder

