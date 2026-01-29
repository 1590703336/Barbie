/**
 * NavBar Theming Tests
 * 
 * Verifies that NavBar uses CSS variables instead of dark: modifier classes
 * to ensure correct theming behavior with data-theme attribute.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import NavBar from '../../components/common/NavBar'

// Mock the store
vi.mock('../../store/store', () => ({
    default: vi.fn((selector) => {
        const state = {
            isAuthenticated: false,
            user: null,
            logout: vi.fn(),
        }
        return selector(state)
    }),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: Object.assign(
        // motion() function call handler
        (component) => component,
        // motion.div, motion.button etc. properties
        {
            div: ({ children, ...props }) => <div {...props}>{children}</div>,
            button: ({ children, ...props }) => <button {...props}>{children}</button>,
            svg: ({ children, ...props }) => <svg {...props}>{children}</svg>,
            path: (props) => <path {...props} />,
        }
    ),
    AnimatePresence: ({ children }) => children,
}))

// Mock ThemeToggle
vi.mock('../../components/common/ThemeToggle', () => ({
    default: () => <button data-testid="theme-toggle">Toggle Theme</button>,
}))

// Mock ChangelogButton
vi.mock('../../components/common/ChangelogButton', () => ({
    default: () => <button data-testid="changelog-button">Changelog</button>,
}))

const renderNavBar = () => {
    return render(
        <BrowserRouter>
            <NavBar />
        </BrowserRouter>
    )
}

describe('NavBar - Mobile Menu Theming', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render hamburger button on mobile', () => {
        renderNavBar()
        const hamburger = screen.getByLabelText('Toggle menu')
        expect(hamburger).toBeInTheDocument()
    })

    it('should open mobile menu when hamburger is clicked', async () => {
        renderNavBar()
        const hamburger = screen.getByLabelText('Toggle menu')
        fireEvent.click(hamburger)

        await waitFor(() => {
            // Use getAllByText since Home appears in both desktop and mobile nav
            const homeLinks = screen.getAllByText('Home')
            expect(homeLinks.length).toBeGreaterThanOrEqual(1)
        })
    })

    it('should use CSS variables for mobile menu background (not dark: classes)', async () => {
        renderNavBar()
        const hamburger = screen.getByLabelText('Toggle menu')
        fireEvent.click(hamburger)

        await waitFor(() => {
            // Find the mobile menu container by its specific class pattern
            const mobileMenus = document.querySelectorAll('.md\\:hidden')
            const mobileMenu = Array.from(mobileMenus).find(el => el.className.includes('overflow-hidden'))
            expect(mobileMenu).toBeTruthy()

            // Verify it uses CSS variable classes, not dark: prefixed classes
            const className = mobileMenu.className
            expect(className).toContain('bg-[var(--dropdown-bg)]')
            expect(className).not.toMatch(/dark:bg-/)
        })
    })

    it('should use CSS variables for border color (not dark: classes)', async () => {
        renderNavBar()
        const hamburger = screen.getByLabelText('Toggle menu')
        fireEvent.click(hamburger)

        await waitFor(() => {
            const mobileMenus = document.querySelectorAll('.md\\:hidden')
            const mobileMenu = Array.from(mobileMenus).find(el => el.className.includes('overflow-hidden'))
            expect(mobileMenu).toBeTruthy()
            const className = mobileMenu.className
            expect(className).toContain('border-[var(--glass-border)]')
            expect(className).not.toMatch(/dark:border-/)
        })
    })

    it('should use CSS variables for nav item hover (not dark: classes)', async () => {
        renderNavBar()
        const hamburger = screen.getByLabelText('Toggle menu')
        fireEvent.click(hamburger)

        await waitFor(() => {
            const homeLinks = screen.getAllByText('Home')
            // Find the mobile nav link (should have the hover class)
            const mobileLink = homeLinks.find(el => el.className?.includes('hover:bg-[var(--nav-active-bg)]'))
            expect(mobileLink).toBeTruthy()
            expect(mobileLink.className).not.toMatch(/dark:hover:bg-/)
        })
    })
})

describe('NavBar - Header Styling', () => {
    it('should render with glass class for header', () => {
        renderNavBar()
        const header = document.querySelector('header')
        expect(header).toHaveClass('glass')
    })

    it('should have sticky positioning', () => {
        renderNavBar()
        const header = document.querySelector('header')
        expect(header).toHaveClass('sticky')
        expect(header).toHaveClass('top-0')
    })
})

describe('NavBar - Theme Toggle Presence', () => {
    it('should render theme toggle in mobile menu', async () => {
        renderNavBar()
        const hamburger = screen.getByLabelText('Toggle menu')
        fireEvent.click(hamburger)

        await waitFor(() => {
            const toggles = screen.getAllByTestId('theme-toggle')
            expect(toggles.length).toBeGreaterThanOrEqual(1)
            expect(screen.getByText('Dark Mode')).toBeInTheDocument()
        })
    })
})
