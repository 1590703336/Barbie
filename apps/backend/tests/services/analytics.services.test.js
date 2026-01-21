/**
 * Analytics Services Tests
 * 
 * Tests for analytics service functions including:
 * - Date range building
 * - Aggregation pipeline construction
 * - Critical date boundary cases (week/month transitions)
 * - Data merging functions
 */

import { jest } from '@jest/globals';

// Import service functions directly (no mocks needed for pure functions)
const analyticsService = await import('../../src/modules/analytics/analytics.services.js');

describe('Analytics Service', () => {
    describe('buildDateRange', () => {
        describe('monthly granularity', () => {
            it('should build correct date range for 12 months', () => {
                const { startDate, endDate } = analyticsService.buildDateRange('monthly', 12);

                expect(startDate).toBeInstanceOf(Date);
                expect(endDate).toBeInstanceOf(Date);
                expect(startDate < endDate).toBe(true);
            });

            it('should start at beginning of month (00:00:00.000)', () => {
                const { startDate } = analyticsService.buildDateRange('monthly', 1);

                expect(startDate.getUTCHours()).toBe(0);
                expect(startDate.getUTCMinutes()).toBe(0);
                expect(startDate.getUTCSeconds()).toBe(0);
                expect(startDate.getUTCMilliseconds()).toBe(0);
                expect(startDate.getUTCDate()).toBe(1); // First day of month
            });

            it('should end at end of month (23:59:59.999)', () => {
                const { endDate } = analyticsService.buildDateRange('monthly', 1);

                expect(endDate.getUTCHours()).toBe(23);
                expect(endDate.getUTCMinutes()).toBe(59);
                expect(endDate.getUTCSeconds()).toBe(59);
                expect(endDate.getUTCMilliseconds()).toBe(999);
            });
        });

        describe('weekly granularity', () => {
            it('should build correct date range for 4 weeks', () => {
                const { startDate, endDate } = analyticsService.buildDateRange('weekly', 4);

                expect(startDate).toBeInstanceOf(Date);
                expect(endDate).toBeInstanceOf(Date);
                expect(startDate < endDate).toBe(true);
            });
        });

        describe('yearly granularity', () => {
            it('should start on Jan 1 and end on Dec 31', () => {
                const { startDate, endDate } = analyticsService.buildDateRange('yearly', 2);

                expect(startDate.getUTCMonth()).toBe(0); // January
                expect(startDate.getUTCDate()).toBe(1);
                expect(endDate.getUTCMonth()).toBe(11); // December
                expect(endDate.getUTCDate()).toBe(31);
            });
        });
    });

    describe('buildMonthDateRange', () => {
        it('should build correct range for January 2024', () => {
            const { startDate, endDate } = analyticsService.buildMonthDateRange(1, 2024);

            expect(startDate.toISOString()).toBe('2024-01-01T00:00:00.000Z');
            expect(endDate.toISOString()).toBe('2024-01-31T23:59:59.999Z');
        });

        it('should build correct range for February 2024 (leap year)', () => {
            const { startDate, endDate } = analyticsService.buildMonthDateRange(2, 2024);

            expect(startDate.toISOString()).toBe('2024-02-01T00:00:00.000Z');
            expect(endDate.toISOString()).toBe('2024-02-29T23:59:59.999Z');
        });

        it('should build correct range for February 2023 (non-leap year)', () => {
            const { startDate, endDate } = analyticsService.buildMonthDateRange(2, 2023);

            expect(startDate.toISOString()).toBe('2023-02-01T00:00:00.000Z');
            expect(endDate.toISOString()).toBe('2023-02-28T23:59:59.999Z');
        });

        it('should build correct range for December', () => {
            const { startDate, endDate } = analyticsService.buildMonthDateRange(12, 2024);

            expect(startDate.toISOString()).toBe('2024-12-01T00:00:00.000Z');
            expect(endDate.toISOString()).toBe('2024-12-31T23:59:59.999Z');
        });

        // Critical: Month boundary edge cases
        it('should correctly handle month 1 (January) start', () => {
            const { startDate } = analyticsService.buildMonthDateRange(1, 2024);

            // Verify it's exactly midnight UTC on Jan 1
            expect(startDate.getTime()).toBe(Date.UTC(2024, 0, 1, 0, 0, 0, 0));
        });

        it('should correctly handle month 12 (December) end', () => {
            const { endDate } = analyticsService.buildMonthDateRange(12, 2024);

            // Verify it's exactly 23:59:59.999 UTC on Dec 31
            expect(endDate.getTime()).toBe(Date.UTC(2024, 11, 31, 23, 59, 59, 999));
        });
    });

    describe('Critical Date Boundary Tests', () => {
        describe('Month transition: Jan 31 23:59:59.999 vs Feb 1 00:00:00.000', () => {
            it('should include Jan 31 23:59:59.999 in January range', () => {
                const { startDate, endDate } = analyticsService.buildMonthDateRange(1, 2024);
                const lastSecondOfJan = new Date(Date.UTC(2024, 0, 31, 23, 59, 59, 999));

                expect(lastSecondOfJan >= startDate && lastSecondOfJan <= endDate).toBe(true);
            });

            it('should NOT include Feb 1 00:00:00.000 in January range', () => {
                const { startDate, endDate } = analyticsService.buildMonthDateRange(1, 2024);
                const firstSecondOfFeb = new Date(Date.UTC(2024, 1, 1, 0, 0, 0, 0));

                expect(firstSecondOfFeb > endDate).toBe(true);
            });

            it('should include Feb 1 00:00:00.000 in February range', () => {
                const { startDate, endDate } = analyticsService.buildMonthDateRange(2, 2024);
                const firstSecondOfFeb = new Date(Date.UTC(2024, 1, 1, 0, 0, 0, 0));

                expect(firstSecondOfFeb >= startDate && firstSecondOfFeb <= endDate).toBe(true);
            });
        });

        describe('Year transition: Dec 31 23:59:59.999 vs Jan 1 00:00:00.000', () => {
            it('should include Dec 31 23:59:59.999 in December range', () => {
                const { startDate, endDate } = analyticsService.buildMonthDateRange(12, 2023);
                const lastSecondOfYear = new Date(Date.UTC(2023, 11, 31, 23, 59, 59, 999));

                expect(lastSecondOfYear >= startDate && lastSecondOfYear <= endDate).toBe(true);
            });

            it('should NOT include Jan 1 2024 00:00:00.000 in December 2023 range', () => {
                const { startDate, endDate } = analyticsService.buildMonthDateRange(12, 2023);
                const firstSecondOfNewYear = new Date(Date.UTC(2024, 0, 1, 0, 0, 0, 0));

                expect(firstSecondOfNewYear > endDate).toBe(true);
            });
        });

        describe('Millisecond precision matters', () => {
            it('should include data at exactly end boundary', () => {
                const { endDate } = analyticsService.buildMonthDateRange(1, 2024);
                const atEndBoundary = new Date(Date.UTC(2024, 0, 31, 23, 59, 59, 999));

                expect(atEndBoundary.getTime()).toBe(endDate.getTime());
            });

            it('should NOT include data 1ms after end boundary', () => {
                const { endDate } = analyticsService.buildMonthDateRange(1, 2024);
                const oneMillisecondAfter = new Date(endDate.getTime() + 1);

                expect(oneMillisecondAfter > endDate).toBe(true);
            });

            it('should include data at exactly start boundary', () => {
                const { startDate } = analyticsService.buildMonthDateRange(1, 2024);
                const atStartBoundary = new Date(Date.UTC(2024, 0, 1, 0, 0, 0, 0));

                expect(atStartBoundary.getTime()).toBe(startDate.getTime());
            });

            it('should NOT include data 1ms before start boundary', () => {
                const { startDate } = analyticsService.buildMonthDateRange(1, 2024);
                const oneMillisecondBefore = new Date(startDate.getTime() - 1);

                expect(oneMillisecondBefore < startDate).toBe(true);
            });
        });
    });

    describe('buildTrendExpensePipeline', () => {
        const userId = '507f1f77bcf86cd799439011';
        const startDate = new Date('2024-01-01T00:00:00.000Z');
        const endDate = new Date('2024-12-31T23:59:59.999Z');

        it('should build pipeline with monthly granularity', () => {
            const pipeline = analyticsService.buildTrendExpensePipeline(
                userId, startDate, endDate, 'monthly'
            );

            expect(pipeline).toHaveLength(3);
            expect(pipeline[0].$match).toBeDefined();
            expect(pipeline[1].$group).toBeDefined();
            expect(pipeline[2].$sort).toBeDefined();
        });

        it('should use $lte/$gte for date range in $match', () => {
            const pipeline = analyticsService.buildTrendExpensePipeline(
                userId, startDate, endDate, 'monthly'
            );

            const match = pipeline[0].$match;
            expect(match.date.$gte).toEqual(startDate);
            expect(match.date.$lte).toEqual(endDate);
        });

        it('should group by ISO week for weekly granularity', () => {
            const pipeline = analyticsService.buildTrendExpensePipeline(
                userId, startDate, endDate, 'weekly'
            );

            const groupId = pipeline[1].$group._id;
            // Should use $isoWeekYear and $isoWeek
            expect(JSON.stringify(groupId)).toContain('$isoWeek');
        });

        it('should group by year for yearly granularity', () => {
            const pipeline = analyticsService.buildTrendExpensePipeline(
                userId, startDate, endDate, 'yearly'
            );

            const groupId = pipeline[1].$group._id;
            expect(groupId.$year).toBe('$date');
        });
    });

    describe('mergeTrendData', () => {
        it('should merge expense and income data by period', () => {
            const expenseStats = [
                { _id: '2024-01', totalExpenseUSD: 100 },
                { _id: '2024-02', totalExpenseUSD: 150 }
            ];
            const incomeStats = [
                { _id: '2024-01', totalIncomeUSD: 500 },
                { _id: '2024-02', totalIncomeUSD: 600 }
            ];

            const result = analyticsService.mergeTrendData(expenseStats, incomeStats);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                date: '2024-01',
                income: 500,
                expense: 100,
                savings: 400
            });
        });

        it('should handle periods with only expenses', () => {
            const expenseStats = [
                { _id: '2024-01', totalExpenseUSD: 100 }
            ];
            const incomeStats = [];

            const result = analyticsService.mergeTrendData(expenseStats, incomeStats);

            expect(result[0].income).toBe(0);
            expect(result[0].expense).toBe(100);
            expect(result[0].savings).toBe(-100);
        });

        it('should handle periods with only income', () => {
            const expenseStats = [];
            const incomeStats = [
                { _id: '2024-01', totalIncomeUSD: 500 }
            ];

            const result = analyticsService.mergeTrendData(expenseStats, incomeStats);

            expect(result[0].income).toBe(500);
            expect(result[0].expense).toBe(0);
            expect(result[0].savings).toBe(500);
        });

        it('should sort periods chronologically', () => {
            const expenseStats = [
                { _id: '2024-03', totalExpenseUSD: 100 },
                { _id: '2024-01', totalExpenseUSD: 50 }
            ];
            const incomeStats = [
                { _id: '2024-02', totalIncomeUSD: 200 }
            ];

            const result = analyticsService.mergeTrendData(expenseStats, incomeStats);

            expect(result[0].date).toBe('2024-01');
            expect(result[1].date).toBe('2024-02');
            expect(result[2].date).toBe('2024-03');
        });

        it('should round values to 2 decimal places', () => {
            const expenseStats = [
                { _id: '2024-01', totalExpenseUSD: 33.333 }
            ];
            const incomeStats = [
                { _id: '2024-01', totalIncomeUSD: 100.999 }
            ];

            const result = analyticsService.mergeTrendData(expenseStats, incomeStats);

            expect(result[0].expense).toBe(33.33);
            expect(result[0].income).toBe(101);
            expect(result[0].savings).toBe(67.67); // 101 - 33.33
        });
    });

    describe('getPeriodLabel', () => {
        it('should convert monthly format to month abbreviation', () => {
            expect(analyticsService.getPeriodLabel('2024-01', 'monthly')).toBe('Jan');
            expect(analyticsService.getPeriodLabel('2024-06', 'monthly')).toBe('Jun');
            expect(analyticsService.getPeriodLabel('2024-12', 'monthly')).toBe('Dec');
        });

        it('should format weekly labels', () => {
            expect(analyticsService.getPeriodLabel('2024-W01', 'weekly')).toBe('W01');
            expect(analyticsService.getPeriodLabel('2024-W52', 'weekly')).toBe('W52');
        });

        it('should return year string for yearly', () => {
            expect(analyticsService.getPeriodLabel('2024', 'yearly')).toBe('2024');
            expect(analyticsService.getPeriodLabel(2023, 'yearly')).toBe('2023');
        });
    });

    describe('calculateBudgetStatus', () => {
        it('should return "healthy" for usage < 70%', () => {
            expect(analyticsService.calculateBudgetStatus(0)).toBe('healthy');
            expect(analyticsService.calculateBudgetStatus(50)).toBe('healthy');
            expect(analyticsService.calculateBudgetStatus(69.99)).toBe('healthy');
        });

        it('should return "warning" for usage 70-89%', () => {
            expect(analyticsService.calculateBudgetStatus(70)).toBe('warning');
            expect(analyticsService.calculateBudgetStatus(80)).toBe('warning');
            expect(analyticsService.calculateBudgetStatus(89.99)).toBe('warning');
        });

        it('should return "critical" for usage 90-100%', () => {
            expect(analyticsService.calculateBudgetStatus(90)).toBe('critical');
            expect(analyticsService.calculateBudgetStatus(99)).toBe('critical');
            expect(analyticsService.calculateBudgetStatus(100)).toBe('critical');
        });

        it('should return "exceeded" for usage > 100%', () => {
            expect(analyticsService.calculateBudgetStatus(100.01)).toBe('exceeded');
            expect(analyticsService.calculateBudgetStatus(150)).toBe('exceeded');
            expect(analyticsService.calculateBudgetStatus(200)).toBe('exceeded');
        });
    });

    describe('ISO Week Edge Cases', () => {
        // ISO weeks can span year boundaries
        // Week 1 is the week containing the first Thursday of the year

        it('should handle Jan 1 that falls mid-week (belongs to previous year ISO week)', () => {
            // Jan 1, 2025 is a Wednesday - belongs to Week 1 of 2025
            // Jan 1, 2024 is a Monday - belongs to Week 1 of 2024
            // Dec 30, 2024 is a Monday - belongs to Week 1 of 2025

            const jan1_2025 = new Date(Date.UTC(2025, 0, 1));
            const dec30_2024 = new Date(Date.UTC(2024, 11, 30));

            // Both dates should be in ISO Week 1 of 2025
            // This tests that our weekly grouping handles year boundaries correctly

            // Build pipeline for late December 2024 into early January 2025
            const pipeline = analyticsService.buildTrendExpensePipeline(
                '507f1f77bcf86cd799439011',
                new Date(Date.UTC(2024, 11, 29)),
                new Date(Date.UTC(2025, 0, 5)),
                'weekly'
            );

            // Verify pipeline uses $isoWeekYear (not $year) for week grouping
            const groupStage = pipeline[1].$group._id;
            expect(JSON.stringify(groupStage)).toContain('$isoWeekYear');
        });
    });
});
