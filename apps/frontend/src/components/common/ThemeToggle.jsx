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
        <div
            onClick={toggleTheme}
            className={`
                w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300
                ${theme === 'dark' ? 'bg-green-500' : 'bg-slate-300'}
            `}
        >
            <motion.div
                layout
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                className={`
                    bg-white w-6 h-6 rounded-full shadow-md
                    ${theme === 'dark' ? 'ml-6' : 'ml-0'}
                `}
            />
        </div>
    )
}

export default ThemeToggle
