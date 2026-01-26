/**
 * Analytics API Service
 * 
 * Frontend service for calling analytics backend APIs.
 */

import api from './api'

/**
 * Get trend data (income/expense over time)
 * @param {Object} params - { granularity, count }
 */
export const getTrendData = async ({ granularity = 'monthly', count = 12 } = {}) => {
  const response = await api.get('/analytics/trend', {
    params: { granularity, count }
  })
  return response.data.data
}

/**
 * Get category breakdown for a specific month
 * @param {Object} params - { type, month, year, limit }
 */
export const getCategoryBreakdown = async ({ type = 'expense', month, year, limit = 10 } = {}) => {
  const response = await api.get('/analytics/category-breakdown', {
    params: { type, month, year, limit }
  })
  return response.data.data
}

/**
 * Get monthly comparison data
 * @param {Object} params - { months }
 */
export const getMonthlyComparison = async ({ months = 6 } = {}) => {
  const response = await api.get('/analytics/monthly-comparison', {
    params: { months }
  })
  return response.data.data
}

/**
 * Get budget usage for a specific month
 * @param {Object} params - { month, year, sortBy, sortOrder }
 */
export const getBudgetUsage = async ({ month, year, sortBy = 'usage', sortOrder = 'desc' } = {}) => {
  const response = await api.get('/analytics/budget-usage', {
    params: { month, year, sortBy, sortOrder }
  })
  return response.data.data
}

// Legacy exports for backward compatibility
export async function fetchSummary() {
  const response = await api.get('/analytics/summary')
  return response.data ?? {}
}

export async function fetchFunnels() {
  const response = await api.get('/analytics/funnels')
  return response.data ?? []
}

export async function fetchTrends() {
  const response = await api.get('/analytics/trends')
  return response.data ?? []
}
