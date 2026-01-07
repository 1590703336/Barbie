import { motion } from 'framer-motion'
import useStore from '../../store/store'
import { useEffect } from 'react'

const ThemeToggle = () => {
    const theme = useStore((state) => state.theme)
    const toggleTheme = useStore((state) => state.toggleTheme)
    const initializeTheme = useStore((state) => state.initializeTheme)

    useEffect(() => {
        initializeTheme()
    }, [initializeTheme])

    return (
        <button
            onClick={toggleTheme}
            className="p-2 bg-gray-200 rounded"
        >
            {theme === 'dark' ? 'Dark' : 'Light'}
        </button>
    )
}

export default ThemeToggle
