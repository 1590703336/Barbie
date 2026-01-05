import { motion as Motion } from 'framer-motion'

const pageVariants = {
    initial: {
        opacity: 0,
        y: 10,
    },
    in: {
        opacity: 1,
        y: 0,
    },
    out: {
        opacity: 0,
        y: -10,
    },
}

const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4,
}

const PageTransition = ({ children }) => {
    return (
        <Motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="w-full"
        >
            {children}
        </Motion.div>
    )
}

export default PageTransition
