function SubscriptionCard({ title, price, description, features = [], cta }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-3xl font-bold text-slate-900">
          {price}
          <span className="text-sm font-medium text-slate-500"> / month</span>
        </p>
      </div>
      <p className="mb-4 text-sm text-slate-600">{description}</p>
      <ul className="mb-6 space-y-2 text-sm text-slate-700">
        {features.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {item}
          </li>
        ))}
      </ul>
      <button className="mt-auto rounded-lg bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800">
        {cta ?? 'Subscribe now'}
      </button>
    </div>
  )
}

export default SubscriptionCard

