import { useState, useEffect, useRef } from 'react'

/**
 * Custom hook that returns a debounced version of the provided value.
 * 
 * Unlike setTimeout-based debouncing at component level, this hook:
 * - Returns the value immediately on initial mount (no delay)
 * - Only debounces subsequent changes to the value
 * - Works correctly with React StrictMode (double render in dev)
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 500)
 * @returns {any} The debounced value
 */
export function useDebouncedValue(value, delay = 500) {
    // Initialize with current value so first render shows data immediately
    const [debouncedValue, setDebouncedValue] = useState(value)

    // Track the previous value to detect actual changes
    const previousValueRef = useRef(value)

    useEffect(() => {
        // If value hasn't changed, don't do anything
        // This handles StrictMode double-render correctly
        if (previousValueRef.current === value) {
            return
        }

        // Update previous value ref
        previousValueRef.current = value

        // For value changes, debounce
        const timerId = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(timerId)
        }
    }, [value, delay])

    return debouncedValue
}
