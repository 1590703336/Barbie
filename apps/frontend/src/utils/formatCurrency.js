export function formatCurrency(value, currency = 'CNY') {
  try {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch (error) {
    console.error('formatCurrency error', error)
    return value
  }
}

