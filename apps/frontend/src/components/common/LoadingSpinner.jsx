export default function LoadingSpinner({ className = "h-12 w-12" }) {
    return (
        <div className="flex items-center justify-center py-12">
            <div
                className={`rounded-full border-4 border-gray-200 border-t-blue-600 ${className}`}
                style={{ animation: 'spin 1s linear infinite' }}
            />
        </div>
    )
}
