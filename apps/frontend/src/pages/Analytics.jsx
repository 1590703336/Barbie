import AnalyticsChartPlaceholder from '../components/dashboard/AnalyticsChartPlaceholder'

const kpi = [
  { label: 'DAU', value: '12,430' },
  { label: '7-day retention', value: '68%' },
  { label: 'ARPU', value: '¥36.4' },
  { label: 'Refund rate', value: '1.2%' },
  { label: 'Active teams', value: '842' },
  { label: 'Peak concurrency', value: '3,418' },
]

const funnels = [
  { label: 'Visit -> Sign up', value: '18.3%' },
  { label: 'Sign up -> Activation', value: '42.7%' },
  { label: 'Activation -> Paid', value: '12.4%' },
  { label: 'Paid -> Retained', value: '93.1%' },
]

function Analytics() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-600">Analytics</p>
        <h1 className="text-3xl font-bold text-slate-900">Business metrics overview</h1>
        <p className="text-sm text-slate-600">
          Replace with live backend metrics and chart data; this page currently shows layout placeholders.
        </p>
      </div>

      <AnalyticsChartPlaceholder
        title="Key metrics"
        description="Core retention, conversion, and revenue KPIs"
        data={kpi}
      />

      <AnalyticsChartPlaceholder
        title="Funnel conversion"
        description="Full conversion path from visit to retention"
        data={funnels}
      />
    </div>
  )
}

export default Analytics

