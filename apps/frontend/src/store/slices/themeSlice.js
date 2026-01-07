export const createThemeSlice = (set, get) => ({
    theme: localStorage.getItem('theme') || 'light',
    toggleTheme: () => {
        const { theme } = get()
        const newTheme = theme === 'light' ? 'dark' : 'light'

        // Update local state
        set({ theme: newTheme })

        // Update persistance
        localStorage.setItem('theme', newTheme)

        // Update document class
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(newTheme)
    },
    initializeTheme: () => {
        const savedTheme = localStorage.getItem('theme')
        const theme = savedTheme || 'light'

        set({ theme })

        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(theme)
    }
})
