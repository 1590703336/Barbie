
export default function ChartSkeleton({ height = 300 }) {
    return (
        <div
            className="glass-card rounded-2xl p-6 animate-pulse"
            style={{ height: `${height}px` }}
        >
            {/* Title placeholder */}
            <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-8" />

            {/* Chart area placeholder */}
            <div className="h-[calc(100%-4rem)] w-full flex items-end justify-between gap-2">
                {/* Bar-like shapes to mimic data */}
                <div className="h-1/3 w-full bg-slate-200 dark:bg-slate-700/50 rounded-t" />
                <div className="h-2/3 w-full bg-slate-200 dark:bg-slate-700/50 rounded-t" />
                <div className="h-1/2 w-full bg-slate-200 dark:bg-slate-700/50 rounded-t" />
                <div className="h-3/4 w-full bg-slate-200 dark:bg-slate-700/50 rounded-t" />
                <div className="h-2/5 w-full bg-slate-200 dark:bg-slate-700/50 rounded-t" />
            </div>
        </div>
    )
}
