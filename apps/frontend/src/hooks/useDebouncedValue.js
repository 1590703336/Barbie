import { useState, useEffect, useRef } from 'react'

/**
 * Custom hook that returns a debounced version of the provided value.
 * 
 * Unlike setTimeout-based debouncing at component level, this hook:
 * - Returns the value immediately on initial mount (no delay)
 * - Only debounces subsequent changes to the value
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 500)
 * @returns {any} The debounced value
 */
export function useDebouncedValue(value, delay = 500) {
    // Track if this is the first render - if so, use value directly as initial state
    const isFirstRender = useRef(true)

    // Initialize with current value so first render shows data immediately
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        // Skip debouncing on first render - we already have the correct initial value
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }

        // For subsequent changes, debounce
        const timerId = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(timerId)
        }
    }, [value, delay])

    return debouncedValue
}
