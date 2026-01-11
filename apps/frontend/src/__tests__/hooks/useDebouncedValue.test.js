import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'

describe('useDebouncedValue', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe('initial render (instant load)', () => {
        it('should return the initial value immediately on first render', () => {
            const { result } = renderHook(() => useDebouncedValue('initial', 500))

            // Should be the initial value right away, no delay
            expect(result.current).toBe('initial')
        })

        it('should return number value immediately on first render', () => {
            const { result } = renderHook(() => useDebouncedValue(1, 500))

            expect(result.current).toBe(1)
        })

        it('should return object value immediately on first render', () => {
            const initialObj = { month: 1, year: 2026 }
            const { result } = renderHook(() => useDebouncedValue(initialObj, 500))

            expect(result.current).toEqual({ month: 1, year: 2026 })
        })
    })

    describe('debouncing on value changes', () => {
        it('should debounce value changes after initial render', () => {
            const { result, rerender } = renderHook(
                ({ value }) => useDebouncedValue(value, 500),
                { initialProps: { value: 1 } }
            )

            expect(result.current).toBe(1)

            // Change value
            rerender({ value: 2 })

            // Should still be 1 (debouncing)
            expect(result.current).toBe(1)

            // Advance time but not past delay
            act(() => {
                vi.advanceTimersByTime(300)
            })
            expect(result.current).toBe(1)

            // Advance past the delay
            act(() => {
                vi.advanceTimersByTime(200)
            })
            expect(result.current).toBe(2)
        })

        it('should reset debounce timer on rapid value changes', () => {
            const { result, rerender } = renderHook(
                ({ value }) => useDebouncedValue(value, 500),
                { initialProps: { value: 1 } }
            )

            // Rapid changes: 1 -> 2 -> 3 -> 4
            rerender({ value: 2 })
            act(() => { vi.advanceTimersByTime(200) })

            rerender({ value: 3 })
            act(() => { vi.advanceTimersByTime(200) })

            rerender({ value: 4 })
            act(() => { vi.advanceTimersByTime(200) })

            // Still should be 1 (timer keeps resetting)
            expect(result.current).toBe(1)

            // Wait for full delay after last change
            act(() => { vi.advanceTimersByTime(500) })

            // Should be 4 (skipped 2 and 3)
            expect(result.current).toBe(4)
        })

        it('should only trigger one update for rapid changes (prevents excessive requests)', () => {
            const mockCallback = vi.fn()
            const { result, rerender } = renderHook(
                ({ value }) => {
                    const debouncedValue = useDebouncedValue(value, 500)
                    // This simulates what useEffect would do in a component
                    if (debouncedValue !== 1) {
                        mockCallback(debouncedValue)
                    }
                    return debouncedValue
                },
                { initialProps: { value: 1 } }
            )

            // Simulate rapid typing: 1 -> 2 -> 3
            rerender({ value: 2 })
            rerender({ value: 3 })

            // No callbacks yet
            expect(mockCallback).not.toHaveBeenCalled()

            // Wait for debounce
            act(() => { vi.advanceTimersByTime(500) })

            // Only one callback with final value
            expect(mockCallback).toHaveBeenCalledTimes(1)
            expect(mockCallback).toHaveBeenCalledWith(3)
        })
    })

    describe('cleanup', () => {
        it('should cancel pending debounce on unmount', () => {
            const { result, rerender, unmount } = renderHook(
                ({ value }) => useDebouncedValue(value, 500),
                { initialProps: { value: 1 } }
            )

            rerender({ value: 2 })
            expect(result.current).toBe(1)

            // Unmount before debounce completes
            unmount()

            // Advance time - should not throw or cause issues
            act(() => { vi.advanceTimersByTime(500) })
        })
    })

    describe('custom delay', () => {
        it('should respect custom delay values', () => {
            const { result, rerender } = renderHook(
                ({ value, delay }) => useDebouncedValue(value, delay),
                { initialProps: { value: 1, delay: 1000 } }
            )

            rerender({ value: 2, delay: 1000 })

            // At 500ms - should still be 1
            act(() => { vi.advanceTimersByTime(500) })
            expect(result.current).toBe(1)

            // At 1000ms - should be 2
            act(() => { vi.advanceTimersByTime(500) })
            expect(result.current).toBe(2)
        })

        it('should use default 500ms delay when not specified', () => {
            const { result, rerender } = renderHook(
                ({ value }) => useDebouncedValue(value),
                { initialProps: { value: 1 } }
            )

            rerender({ value: 2 })

            // At 400ms - should still be 1
            act(() => { vi.advanceTimersByTime(400) })
            expect(result.current).toBe(1)

            // At 500ms - should be 2
            act(() => { vi.advanceTimersByTime(100) })
            expect(result.current).toBe(2)
        })
    })

    describe('edge cases', () => {
        it('should handle null values', () => {
            const { result, rerender } = renderHook(
                ({ value }) => useDebouncedValue(value, 500),
                { initialProps: { value: null } }
            )

            expect(result.current).toBe(null)

            rerender({ value: 'not null' })
            act(() => { vi.advanceTimersByTime(500) })

            expect(result.current).toBe('not null')
        })

        it('should handle undefined values', () => {
            const { result } = renderHook(() => useDebouncedValue(undefined, 500))

            expect(result.current).toBe(undefined)
        })

        it('should handle empty string', () => {
            const { result, rerender } = renderHook(
                ({ value }) => useDebouncedValue(value, 500),
                { initialProps: { value: '' } }
            )

            expect(result.current).toBe('')

            rerender({ value: 'text' })
            act(() => { vi.advanceTimersByTime(500) })

            expect(result.current).toBe('text')
        })

        it('should work with 0 as a value', () => {
            const { result, rerender } = renderHook(
                ({ value }) => useDebouncedValue(value, 500),
                { initialProps: { value: 0 } }
            )

            expect(result.current).toBe(0)

            rerender({ value: 5 })
            act(() => { vi.advanceTimersByTime(500) })

            expect(result.current).toBe(5)
        })
    })
})
