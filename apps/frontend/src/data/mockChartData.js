/**
 * Mock Chart Data Generator
 * Provides realistic mock data for chart development.
 * Data structure matches the API spec in docs/api/Analytics-API.md
 * 
 * When backend APIs are ready, replace these with actual API calls.
 */

// Helper to format date as YYYY-MM
const formatMonth = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
}

// Helper to get month name
const getMonthName = (dateStr) => {
    const [year, month] = dateStr.split('-')
    const date = new Date(year, parseInt(month) - 1, 1)
    return date.toLocaleDateString('en-US', { month: 'short' })
}

/**
 * Generate trend data for line charts
 * @param {number} months - Number of months to generate (default: 6)
 * @returns {Object} Trend data matching API spec
 */
export function generateTrendData(months = 6) {
    const series = []
    const now = new Date()

    // Base values with some randomness
    const baseIncome = 5000
    const baseExpense = 3200

    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStr = formatMonth(date)

        // Add realistic variation
        const incomeVariation = (Math.random() - 0.5) * 1000
        const expenseVariation = (Math.random() - 0.5) * 800

        const income = Math.round((baseIncome + incomeVariation) * 100) / 100
        const expense = Math.round((baseExpense + expenseVariation) * 100) / 100
        const savings = Math.round((income - expense) * 100) / 100

        series.push({
            date: monthStr,
            monthName: getMonthName(monthStr),
            income,
            expense,
            savings
        })
    }

    const totals = series.reduce(
        (acc, item) => ({
            income: acc.income + item.income,
            expense: acc.expense + item.expense,
            savings: acc.savings + item.savings
        }),
        { income: 0, expense: 0, savings: 0 }
    )

    return {
        period: {
            start: series[0]?.date,
            end: series[series.length - 1]?.date,
            granularity: 'monthly'
        },
        currency: 'CAD',
        series,
        totals: {
            income: Math.round(totals.income * 100) / 100,
            expense: Math.round(totals.expense * 100) / 100,
            savings: Math.round(totals.savings * 100) / 100
        }
    }
}

/**
 * Generate category breakdown for pie charts
 * @param {string} type - 'expense' or 'income'
 * @returns {Object} Category breakdown matching API spec
 */
export function generateCategoryBreakdown(type = 'expense') {
    const expenseCategories = [
        { category: 'Food', amount: 850, count: 45 },
        { category: 'Transport', amount: 420, count: 22 },
        { category: 'Entertainment', amount: 380, count: 15 },
        { category: 'Utilities', amount: 350, count: 5 },
        { category: 'Shopping', amount: 520, count: 12 },
        { category: 'Education', amount: 280, count: 3 },
        { category: 'Health', amount: 200, count: 4 },
        { category: 'Others', amount: 200, count: 8 }
    ]

    const incomeCategories = [
        { category: 'Salary', amount: 4500, count: 1 },
        { category: 'Freelance', amount: 800, count: 3 },
        { category: 'Investments', amount: 350, count: 2 },
        { category: 'Others', amount: 150, count: 2 }
    ]

    const categories = type === 'expense' ? expenseCategories : incomeCategories
    const total = categories.reduce((sum, cat) => sum + cat.amount, 0)

    // Add percentage to each category
    const categoriesWithPercentage = categories.map(cat => ({
        ...cat,
        percentage: Math.round((cat.amount / total) * 10000) / 100
    }))

    return {
        period: {
            start: formatMonth(new Date()),
            end: formatMonth(new Date())
        },
        currency: 'CAD',
        type,
        total,
        categories: categoriesWithPercentage
    }
}

/**
 * Generate monthly comparison data for bar charts
 * @param {number} months - Number of months to compare
 * @returns {Object} Monthly comparison matching API spec
 */
export function generateMonthlyComparison(months = 4) {
    const data = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStr = formatMonth(date)

        // Realistic variations
        const income = 4800 + Math.random() * 1500
        const expense = 2800 + Math.random() * 1200
        const savings = income - expense
        const savingsRate = (savings / income) * 100

        data.push({
            month: monthStr,
            monthName: getMonthName(monthStr),
            income: Math.round(income),
            expense: Math.round(expense),
            savings: Math.round(savings),
            savingsRate: Math.round(savingsRate * 100) / 100
        })
    }

    const averages = data.reduce(
        (acc, item, _, arr) => ({
            income: acc.income + item.income / arr.length,
            expense: acc.expense + item.expense / arr.length,
            savings: acc.savings + item.savings / arr.length,
            savingsRate: acc.savingsRate + item.savingsRate / arr.length
        }),
        { income: 0, expense: 0, savings: 0, savingsRate: 0 }
    )

    return {
        period: {
            start: data[0]?.month,
            end: data[data.length - 1]?.month
        },
        currency: 'CAD',
        months: data,
        averages: {
            income: Math.round(averages.income),
            expense: Math.round(averages.expense),
            savings: Math.round(averages.savings),
            savingsRate: Math.round(averages.savingsRate * 100) / 100
        }
    }
}

/**
 * Generate budget usage data for progress bars
 * Uses similar structure to existing budgetSummary but adds usage percentage
 * @param {Object} budgetSummary - Existing budget summary from API (optional)
 * @returns {Object} Budget usage data with status
 */
export function generateBudgetUsage(budgetSummary = null) {
    // If we have real data, transform it
    if (budgetSummary?.categoriesSummary) {
        return {
            summary: {
                totalBudget: budgetSummary.totalBudget,
                totalSpent: budgetSummary.totalExpenses,
                totalRemaining: budgetSummary.remainingBudget,
                overallUsage: budgetSummary.totalBudget > 0
                    ? Math.round((budgetSummary.totalExpenses / budgetSummary.totalBudget) * 10000) / 100
                    : 0
            },
            categories: budgetSummary.categoriesSummary.map(cat => {
                const usage = cat.budget > 0
                    ? Math.round((cat.expenses / cat.budget) * 10000) / 100
                    : 0
                return {
                    category: cat.category,
                    budget: cat.budget,
                    spent: cat.expenses,
                    remaining: cat.remainingBudget,
                    usage,
                    status: getUsageStatus(usage)
                }
            })
        }
    }

    // Generate mock data
    const mockCategories = [
        { category: 'Food', budget: 800, spent: 720 },
        { category: 'Transport', budget: 400, spent: 380 },
        { category: 'Entertainment', budget: 300, spent: 150 },
        { category: 'Utilities', budget: 500, spent: 500 },
        { category: 'Shopping', budget: 600, spent: 450 },
        { category: 'Education', budget: 200, spent: 80 }
    ]

    const categories = mockCategories.map(cat => {
        const remaining = cat.budget - cat.spent
        const usage = Math.round((cat.spent / cat.budget) * 10000) / 100
        return {
            ...cat,
            remaining,
            usage,
            status: getUsageStatus(usage)
        }
    })

    const summary = categories.reduce(
        (acc, cat) => ({
            totalBudget: acc.totalBudget + cat.budget,
            totalSpent: acc.totalSpent + cat.spent,
            totalRemaining: acc.totalRemaining + cat.remaining
        }),
        { totalBudget: 0, totalSpent: 0, totalRemaining: 0 }
    )

    return {
        currency: 'CAD',
        summary: {
            ...summary,
            overallUsage: Math.round((summary.totalSpent / summary.totalBudget) * 10000) / 100
        },
        categories
    }
}

/**
 * Get usage status based on percentage
 */
function getUsageStatus(usage) {
    if (usage >= 100) return 'exceeded'
    if (usage >= 90) return 'critical'
    if (usage >= 70) return 'warning'
    return 'healthy'
}

/**
 * Chart color palettes
 */
export const CHART_COLORS = {
    income: '#10b981',      // emerald-500
    expense: '#f43f5e',     // rose-500
    savings: '#3b82f6',     // blue-500

    // Category colors (vibrant palette)
    categories: [
        '#8b5cf6', // violet-500
        '#ec4899', // pink-500
        '#f59e0b', // amber-500
        '#10b981', // emerald-500
        '#3b82f6', // blue-500
        '#ef4444', // red-500
        '#06b6d4', // cyan-500
        '#84cc16', // lime-500
        '#f97316', // orange-500
        '#6366f1', // indigo-500
    ],

    // Status colors for budget progress
    status: {
        healthy: '#10b981',   // emerald-500
        warning: '#f59e0b',   // amber-500
        critical: '#f97316',  // orange-500
        exceeded: '#ef4444'   // red-500
    }
}
