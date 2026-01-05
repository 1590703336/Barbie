import React from 'react'

const icons = {
    Food: (props) => (
        <svg fill="currentColor" viewBox="0 0 20 20" {...props}>
            {/* Solid Burger Icon */}
            <path d="M4 8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2H4V8Zm0 3h12v2H4v-2Zm0 3h12v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2Z" />
        </svg>
    ),
    Transport: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            {/* Modern Car Side View */}
            <path d="M5 11l1.5-4.5h11L19 11h2v7h-2v1.5a1.5 1.5 0 01-3 0V18H8v1.5a1.5 1.5 0 01-3 0V18H3v-7h2zm1.5-3l-1 3h13l-1-3H6.5zM6 14a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm12 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
        </svg>
    ),
    Entertainment: (props) => (
        <svg fill="currentColor" viewBox="0 0 20 20" {...props}>
            {/* Solid Ticket Icon */}
            <path fillRule="evenodd" d="M2.5 7A2.5 2.5 0 0 1 5 4.5h10A2.5 2.5 0 0 1 17.5 7a.5.5 0 0 0 .5.5 1.5 1.5 0 0 1 0 3 .5.5 0 0 0-.5.5 2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 11a.5.5 0 0 0-.5-.5 1.5 1.5 0 0 1 0-3 .5.5 0 0 0 .5-.5ZM5 8.5a.5.5 0 0 1-.5.5 1 1 0 0 0 0 2 .5.5 0 0 1 .5.5h10a.5.5 0 0 1 .5-.5 1 1 0 0 0 0-2 .5.5 0 0 1-.5-.5H5Z" clipRule="evenodd" />
            <path d="M6 7.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5Zm0 3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5Z" />
        </svg>
    ),
    Utilities: (props) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            {/* Solid Lightning Bolt */}
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
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
    Netflix: (props) => (
        <svg fill="currentColor" viewBox="0 0 16 16" {...props}>
            <path d="M5.522 1.938a.5.5 0 0 1 .478.528v10.966a.5.5 0 0 1-.94.135L.918 3.567V13.5a.5.5 0 0 1-1 0V2.466a.5.5 0 0 1 .94-.135l4.182 10.003V2.466a.5.5 0 0 1 .482-.528Z" transform="translate(4 0)" />
        </svg>
    ),
    Spotify: (props) => (
        <svg fill="currentColor" viewBox="0 0 16 16" {...props}>
            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.669 11.538a.498.498 0 0 1-.686.165c-1.879-1.147-4.243-1.407-7.028-.77a.499.499 0 0 1-.222-.973c3.048-.696 5.662-.397 7.77.892a.5.5 0 0 1 .166.686zm.979-2.178a.624.624 0 0 1-.858.205c-2.15-1.321-5.428-1.704-7.972-.932a.625.625 0 0 1-.362-1.194c2.905-.881 6.517-.454 8.986 1.063a.624.624 0 0 1 .206.858zm.084-2.268C10.154 5.56 5.9 5.419 3.438 6.166a.748.748 0 1 1-.434-1.432c2.825-.857 7.523-.692 10.492 1.07a.747.747 0 1 1-.764 1.288z" />
        </svg>
    ),
    Apple: (props) => (
        <svg fill="currentColor" viewBox="0 0 16 16" {...props}>
            <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43Zm3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422.212-2.189 1.675-2.789 1.698-2.854.023-.065-.597-.79-1.254-1.157a3.692 3.692 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56.244.729.625 1.924 1.273 2.796.576.984 1.34 1.667 1.659 1.899.319.232 1.219.386 1.843.067.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758.347-.79.505-1.217.473-1.282Z" />
        </svg>
    ),

    Google: (props) => (
        <svg fill="currentColor" viewBox="0 0 16 16" {...props}>
            <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" />
        </svg>
    ),
    Youtube: (props) => (
        <svg fill="currentColor" viewBox="0 0 16 16" {...props}>
            <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.007 2.007 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.007 2.007 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.007 2.007 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.788 99.788 0 0 1 7.858 2h.193zM6.4 5.209v4.818l4.157-2.408L6.4 5.209z" />
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
    Netflix: 'from-red-600 to-red-900 shadow-red-400',
    Spotify: 'from-green-400 to-green-600 shadow-green-200',
    Apple: 'from-gray-500 to-gray-800 shadow-gray-400',

    Google: 'from-blue-400 to-green-400 shadow-blue-200',
    Youtube: 'from-red-500 to-red-700 shadow-red-300',
}

export const CategoryIcon = ({ category, name, className = 'w-10 h-10' }) => {
    // Derive brand from name if provided
    let brand = null
    if (name) {
        const lowerName = name.toLowerCase()
        if (lowerName.includes('netflix')) brand = 'Netflix'
        else if (lowerName.includes('spotify')) brand = 'Spotify'
        else if (lowerName.includes('apple')) brand = 'Apple'

        else if (lowerName.includes('google')) brand = 'Google'
        else if (lowerName.includes('youtube')) brand = 'Youtube'
    }

    const Icon = brand ? icons[brand] : (icons[category] || icons.Others)
    const gradientClass = brand ? gradients[brand] : (gradients[category] || gradients.Others)

    return (
        <div
            className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ${gradientClass} ${className}`}
        >
            <Icon className="h-3/5 w-3/5 text-white drop-shadow-sm" />
        </div>
    )
}
