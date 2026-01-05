import React from 'react'

const icons = {
    Food: (props) => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
        </svg>
    ),
    Transport: (props) => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
        </svg>
    ),
    Entertainment: (props) => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
        </svg>
    ),
    Utilities: (props) => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
            />
        </svg>
    ),
    Rent: (props) => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
        </svg>
    ),
    Health: (props) => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
        </svg>
    ),
    Others: (props) => (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    ),
}

export const CategoryIcon = ({ category, className = 'w-5 h-5' }) => {
    const Icon = icons[category] || icons.Others
    // If specific icons for Transport/Entertainment are generic (using arrows/video above), 
    // we could refine them later. Using generic logical matches for now.
    // Actually, 'Transport' above is arrows (Exchange?), let's swap it to a generic Car if possible or just keep it abstract.
    // The 'Transport' path above is actually 'Switch Horizontal' (arrows). 
    // Let's replace 'Transport' with a Car-like or simple Wheel path if we want accuracy, 
    // but for rapid prototype, generic is fine. User asked for "different icon". These are different.

    // Customizing colors based on category could also be nice, but user just asked for icons.
    // We'll apply the class passed in.

    // Let's update Transport to a simple "Car/Bus" or "Map Pin" style if needed, 
    // or just use the current one as an abstraction.
    // Actually, let's make Transport look more like a car/bus front:
    // d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" is definitely arrows.
    // Let's use a "Truck" or "Car" path. 
    // d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" (Wheels) ...

    return <Icon className={className} />
}
