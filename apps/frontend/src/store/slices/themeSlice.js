export const createThemeSlice = (set, get) => ({
    theme: localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    toggleTheme: () => {
        const { theme } = get()
        const newTheme = theme === 'light' ? 'dark' : 'light'

        // Update local state
        set({ theme: newTheme })

        // Update persistance
        localStorage.setItem('theme', newTheme)

        // Update document attribute
        document.documentElement.setAttribute('data-theme', newTheme)
    },
    initializeTheme: () => {
        const savedTheme = localStorage.getItem('theme')
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        const theme = savedTheme || systemTheme

        set({ theme })

        document.documentElement.setAttribute('data-theme', theme)
    }
})
