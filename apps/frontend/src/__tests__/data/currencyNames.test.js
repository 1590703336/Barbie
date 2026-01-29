/**
 * currencyNames Data Tests
 * 
 * Tests for the currency data module including TOP_CURRENCIES list,
 * CURRENCY_NAMES mapping, and getCurrencyName utility function.
 */

import { describe, it, expect } from 'vitest'
import { TOP_CURRENCIES, CURRENCY_NAMES, getCurrencyName } from '../../data/currencyNames'

describe('TOP_CURRENCIES', () => {
    it('should be an array', () => {
        expect(Array.isArray(TOP_CURRENCIES)).toBe(true)
    })

    it('should contain commonly used currencies', () => {
        const expectedCurrencies = ['USD', 'EUR', 'GBP', 'CNY', 'JPY']
        expectedCurrencies.forEach(currency => {
            expect(TOP_CURRENCIES).toContain(currency)
        })
    })

    it('should only contain 3-letter ISO currency codes', () => {
        TOP_CURRENCIES.forEach(currency => {
            expect(currency).toMatch(/^[A-Z]{3}$/)
        })
    })

    it('should not have duplicate entries', () => {
        const unique = new Set(TOP_CURRENCIES)
        expect(unique.size).toBe(TOP_CURRENCIES.length)
    })
})

describe('CURRENCY_NAMES', () => {
    it('should be an object', () => {
        expect(typeof CURRENCY_NAMES).toBe('object')
        expect(CURRENCY_NAMES).not.toBeNull()
    })

    it('should have at least 100 currencies', () => {
        const count = Object.keys(CURRENCY_NAMES).length
        expect(count).toBeGreaterThanOrEqual(100)
    })

    it('should have all top currencies with names', () => {
        TOP_CURRENCIES.forEach(code => {
            expect(CURRENCY_NAMES[code]).toBeDefined()
            expect(typeof CURRENCY_NAMES[code]).toBe('string')
            expect(CURRENCY_NAMES[code].length).toBeGreaterThan(0)
        })
    })

    it('should have correct names for common currencies', () => {
        expect(CURRENCY_NAMES.USD).toBe('US Dollar')
        expect(CURRENCY_NAMES.EUR).toBe('Euro')
        expect(CURRENCY_NAMES.GBP).toBe('British Pound Sterling')
        expect(CURRENCY_NAMES.JPY).toBe('Japanese Yen')
        expect(CURRENCY_NAMES.CNY).toBe('Chinese Yuan')
    })

    it('should have 3-letter uppercase keys', () => {
        Object.keys(CURRENCY_NAMES).forEach(code => {
            expect(code).toMatch(/^[A-Z]{3}$/)
        })
    })

    it('should have non-empty string values', () => {
        Object.values(CURRENCY_NAMES).forEach(name => {
            expect(typeof name).toBe('string')
            expect(name.trim().length).toBeGreaterThan(0)
        })
    })
})

describe('getCurrencyName', () => {
    it('should return the correct name for a valid currency code', () => {
        expect(getCurrencyName('USD')).toBe('US Dollar')
        expect(getCurrencyName('EUR')).toBe('Euro')
        expect(getCurrencyName('CAD')).toBe('Canadian Dollar')
    })

    it('should return empty string for unknown currency code', () => {
        expect(getCurrencyName('UNKNOWN')).toBe('')
        expect(getCurrencyName('ZZZ')).toBe('')
    })

    it('should return empty string for undefined/null input', () => {
        expect(getCurrencyName(undefined)).toBe('')
        expect(getCurrencyName(null)).toBe('')
    })

    it('should be case-sensitive (uppercase codes only)', () => {
        // Lower case should not match (as per current implementation)
        expect(getCurrencyName('usd')).toBe('')
        expect(getCurrencyName('Eur')).toBe('')
    })
})

describe('Data Integrity', () => {
    it('all TOP_CURRENCIES should exist in CURRENCY_NAMES', () => {
        TOP_CURRENCIES.forEach(code => {
            expect(CURRENCY_NAMES).toHaveProperty(code)
        })
    })

    it('should include major world currencies', () => {
        const majorCurrencies = [
            'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CHF', 'AUD', 'CAD',
            'HKD', 'SGD', 'INR', 'KRW', 'MXN', 'BRL', 'RUB', 'ZAR'
        ]
        majorCurrencies.forEach(code => {
            expect(CURRENCY_NAMES).toHaveProperty(code)
        })
    })

    it('should include cryptocurrency (BTC)', () => {
        expect(CURRENCY_NAMES.BTC).toBe('Bitcoin')
    })

    it('should include precious metals', () => {
        expect(CURRENCY_NAMES.XAU).toBe('Gold (troy ounce)')
        expect(CURRENCY_NAMES.XAG).toBe('Silver (troy ounce)')
    })
})
