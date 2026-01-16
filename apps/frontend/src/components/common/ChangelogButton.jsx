import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { changelog } from '../../data/changelogData'
import useStore from '../../store/store'

const ChangelogButton = () => {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef(null)
    const buttonRef = useRef(null)
    const theme = useStore((state) => state.theme)

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen])

    return (
        <div className="relative">
            <motion.button
                ref={buttonRef}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-8 h-8 flex items-center justify-center rounded-full cursor-pointer
                    transition-colors duration-300
                    ${theme === 'dark'
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }
                `}
                title="Changelog"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                </svg>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`
                            absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto
                            rounded-xl shadow-xl border z-50
                            ${theme === 'dark'
                                ? 'bg-slate-800 border-slate-700'
                                : 'bg-white border-slate-200'
                            }
                        `}
                    >
                        {/* Header */}
                        <div className={`
                            sticky top-0 px-4 py-3 border-b
                            ${theme === 'dark'
                                ? 'bg-slate-800 border-slate-700'
                                : 'bg-white border-slate-200'
                            }
                        `}>
                            <div className="flex items-center justify-between">
                                <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    Changelog
                                </h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className={`
                                        p-1 rounded-lg transition-colors
                                        ${theme === 'dark'
                                            ? 'hover:bg-slate-700 text-slate-400'
                                            : 'hover:bg-slate-100 text-slate-500'
                                        }
                                    `}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Changelog entries */}
                        <div className="p-2">
                            {changelog.map((entry, index) => (
                                <div
                                    key={entry.version}
                                    className={`
                                        p-3 rounded-lg mb-2 last:mb-0
                                        ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-50'}
                                    `}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`
                                            px-2 py-0.5 text-xs font-semibold rounded-full
                                            ${index === 0
                                                ? 'bg-green-500 text-white'
                                                : theme === 'dark'
                                                    ? 'bg-slate-600 text-slate-200'
                                                    : 'bg-slate-200 text-slate-700'
                                            }
                                        `}>
                                            v{entry.version}
                                        </span>
                                        <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {entry.date}
                                        </span>
                                        {index === 0 && (
                                            <span className="text-xs text-green-500 font-medium">
                                                Latest
                                            </span>
                                        )}
                                    </div>
                                    <ul className="space-y-1">
                                        {entry.changes.map((change, changeIndex) => (
                                            <li
                                                key={changeIndex}
                                                className={`
                                                    text-sm flex items-start gap-2
                                                    ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}
                                                `}
                                            >
                                                <span className="text-green-500 mt-1">•</span>
                                                <span>{change}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ChangelogButton
