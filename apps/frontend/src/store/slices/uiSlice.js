export const createUiSlice = (set) => ({
    // Selected month/year for Dashboard and Records pages
    selectedMonth: new Date().getMonth() + 1,
    selectedYear: new Date().getFullYear(),

    setSelectedMonth: (month) => set({ selectedMonth: month }),
    setSelectedYear: (year) => set({ selectedYear: year }),
    setSelectedMonthYear: (month, year) => set({ selectedMonth: month, selectedYear: year }),

    // Reset to current month/year (called on logout)
    resetSelectedMonthYear: () => set({
        selectedMonth: new Date().getMonth() + 1,
        selectedYear: new Date().getFullYear(),
    }),
})
