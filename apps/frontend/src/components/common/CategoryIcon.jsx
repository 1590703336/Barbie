import React from 'react'

const icons = {
    Food: (props) => (
        <svg fill="currentColor" viewBox="0 0 20 20" {...props}>
            <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
                className="opacity-0" // Hidden spacer if needed, or just replace with Burger path 
            />
            {/* Burger / Fast Food Icon */}
            <path
                fillRule="evenodd"
                d="M10 2a6 6 0 00-6 6v1h12V8a6 6 0 00-6-6zM4 11a1 1 0 00-1 1v1a3 3 0 003 3h8a3 3 0 003-3v-1a1 1 0 00-1-1H4z"
            />
            <path d="M4 17a1 1 0 011-1h10a1 1 0 011 1v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1z" />
        </svg>
    ),
    Transport: (props) => (
        <svg fill="currentColor" viewBox="0 0 20 20" {...props}>
            {/* Car Icon */}
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path
                fillRule="evenodd"
                d="M2 9.75A2.75 2.75 0 014.75 7h.653c.66 0 1.258-.337 1.6-1.02L7.29 4.39a3.256 3.256 0 012.898-1.89h.095c.983 0 1.956.36 2.73.99l1.761 1.488c.618.52 1.396.822 2.203.822h.273A2.75 2.75 0 0120 8.5v3.25a.75.75 0 01-1.5 0v-1h-17v1a.75.75 0 01-1.5 0V9.75z"
                clipRule="evenodd"
            />
        </svg>
    ),
    Entertainment: (props) => (
        <svg fill="currentColor" viewBox="0 0 20 20" {...props}>
            {/* Ticket Icon */}
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path
                fillRule="evenodd"
                d="M5 2a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7.414A2 2 0 0016.414 6L13 2.586A2 2 0 0011.586 2H5zm5 6a1 1 0 10-2 0 1 1 0 002 0zm-5 4a1 1 0 011-1h2a1 1 0 110 2H6a1 1 0 01-1-1zm6-1a1 1 0 100 2 1 1 0 000-2z"
                clipRule="evenodd"
            />
        </svg>
    ),
    Utilities: (props) => (
        <svg fill="currentColor" viewBox="0 0 20 20" {...props}>
            {/* Lightning Icon */}
            <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
            />
        </svg>
    ),
    Rent: (props) => (
        <svg fill="currentColor" viewBox="0 0 20 20" {...props}>
            {/* House Icon */}
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
    ),
    Health: (props) => (
        <svg fill="currentColor" viewBox="0 0 20 20" {...props}>
            {/* Heart Icon */}
            <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
            />
        </svg>
    ),
    Others: (props) => (
        <svg fill="currentColor" viewBox="0 0 20 20" {...props}>
            {/* Dots/Star Icon */}
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    ),
}

const gradients = {
    Food: 'from-orange-400 to-red-500 shadow-orange-200',
    Transport: 'from-blue-400 to-indigo-600 shadow-blue-200',
    Entertainment: 'from-purple-400 to-pink-500 shadow-pink-200',
    Utilities: 'from-amber-300 to-yellow-500 shadow-yellow-200',
    Rent: 'from-emerald-400 to-teal-500 shadow-emerald-200',
    Health: 'from-rose-400 to-red-600 shadow-rose-200',
    Others: 'from-slate-400 to-slate-600 shadow-slate-200',
}

export const CategoryIcon = ({ category, className = 'w-10 h-10' }) => {
    const Icon = icons[category] || icons.Others
    const gradientClass = gradients[category] || gradients.Others

    return (
        <div
            className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ${gradientClass} ${className}`}
        >
            <Icon className="h-3/5 w-3/5 text-white drop-shadow-sm" />
        </div>
    )
}
