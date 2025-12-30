export const createAnalyticsSlice = (set) => ({
  summary: null,
  funnels: [],
  trends: [],
  setSummary: (summary) => set({ summary }),
  setFunnels: (funnels) => set({ funnels }),
  setTrends: (trends) => set({ trends }),
})

