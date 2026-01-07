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
                    bg-white w-6 h-6 rounded-full shadow-md flex items-center justify-center
                    ${theme === 'dark' ? 'ml-6' : 'ml-0'}
                `}
            >
                {theme === 'dark' ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4 text-slate-700"
                    >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4 text-yellow-500"
                    >
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                )}
            </motion.div>
        </div>
    )
}

export default ThemeToggle
