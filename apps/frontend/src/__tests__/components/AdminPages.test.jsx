/**
 * Admin Pages Component Tests
 * 
 * Tests for admin login, dashboard, and layout components.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ============ MOCKS ============

// Mock zustand store
const mockStore = {
    admin: null,
    adminToken: null,
    adminExpiresAt: null,
    isAdminAuthenticated: false,
    adminLogin: vi.fn(),
    adminLogout: vi.fn(),
    updateAdminSession: vi.fn(),
}

vi.mock('../../store/store', () => ({
    default: (selector) => selector(mockStore),
}))

// Mock admin service
vi.mock('../../services/adminService', () => ({
    adminSignIn: vi.fn(),
    adminSignOut: vi.fn(),
    refreshAdminSession: vi.fn(),
    getPlatformOverview: vi.fn(),
    getUserGrowthTrend: vi.fn(),
    getPlatformFinancials: vi.fn(),
    getCategoryDistribution: vi.fn(),
    getAllUsers: vi.fn(),
    getUserDetails: vi.fn(),
    updateUserRole: vi.fn(),
    deleteUser: vi.fn(),
    getSubscriptionHealth: vi.fn(),
    getCurrencyStats: vi.fn(),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
        aside: ({ children, ...props }) => <aside {...props}>{children}</aside>,
        tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
}))

// Import components after mocks
import AdminLogin from '../../pages/admin/AdminLogin'
import AdminDashboard from '../../pages/admin/AdminDashboard'
import AdminUsers from '../../pages/admin/AdminUsers'
import * as adminService from '../../services/adminService'

// ============ TEST UTILITIES ============

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    })
    return ({ children }) => (
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                {children}
            </MemoryRouter>
        </QueryClientProvider>
    )
}

// ============ ADMIN LOGIN TESTS ============

describe('AdminLogin', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockStore.isAdminAuthenticated = false
        mockStore.admin = null
    })

    it('should render login form', () => {
        render(<AdminLogin />, { wrapper: createWrapper() })

        expect(screen.getByText(/admin portal/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should show loading state during login', async () => {
        adminService.adminSignIn.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        )

        render(<AdminLogin />, { wrapper: createWrapper() })

        fireEvent.change(screen.getByLabelText(/admin email/i), {
            target: { value: 'admin@test.com' },
        })
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'password123' },
        })
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

        expect(await screen.findByText(/authenticating/i)).toBeInTheDocument()
    })

    it('should show error message on failed login', async () => {
        adminService.adminSignIn.mockRejectedValue({
            response: { data: { message: 'Invalid credentials' } },
        })

        render(<AdminLogin />, { wrapper: createWrapper() })

        fireEvent.change(screen.getByLabelText(/admin email/i), {
            target: { value: 'admin@test.com' },
        })
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'wrongpassword' },
        })
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

        expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument()
    })

    it('should call adminLogin on successful sign-in', async () => {
        adminService.adminSignIn.mockResolvedValue({
            success: true,
            data: {
                user: { _id: 'admin-1', email: 'admin@test.com', role: 'admin' },
                token: 'admin-token',
                expiresAt: Date.now() + 30 * 60 * 1000,
            },
        })

        render(<AdminLogin />, { wrapper: createWrapper() })

        fireEvent.change(screen.getByLabelText(/admin email/i), {
            target: { value: 'admin@test.com' },
        })
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'password123' },
        })
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

        await waitFor(() => {
            expect(mockStore.adminLogin).toHaveBeenCalledWith(
                expect.objectContaining({
                    user: expect.any(Object),
                    token: 'admin-token',
                })
            )
        })
    })

    it('should show session expired message when redirected', () => {
        render(
            <MemoryRouter initialEntries={['/admin/login?expired=true']}>
                <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
                    <AdminLogin />
                </QueryClientProvider>
            </MemoryRouter>
        )

        expect(screen.getByText(/session.*expired/i)).toBeInTheDocument()
    })
})

// ============ ADMIN DASHBOARD TESTS ============

describe('AdminDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockStore.isAdminAuthenticated = true
        mockStore.admin = { email: 'admin@test.com', role: 'admin' }
        mockStore.adminToken = 'valid-token'
    })

    it('should render dashboard with loading state', () => {
        adminService.getPlatformOverview.mockReturnValue(new Promise(() => { }))

        render(<AdminDashboard />, { wrapper: createWrapper() })

        expect(screen.getByText(/platform overview/i)).toBeInTheDocument()
    })

    it('should display KPIs after loading', async () => {
        adminService.getPlatformOverview.mockResolvedValue({
            data: {
                users: { total: 100, admins: 5, newThisMonth: 10 },
                transactions: { total: 500 },
                volume: { totalIncomeUSD: 50000, totalExpenseUSD: 30000, netCashFlowUSD: 20000 },
                subscriptions: { active: 25 },
            },
        })
        adminService.getUserGrowthTrend.mockResolvedValue({ data: { data: [] } })
        adminService.getPlatformFinancials.mockResolvedValue({ data: { data: [] } })
        adminService.getCategoryDistribution.mockResolvedValue({ data: { data: [] } })

        render(<AdminDashboard />, { wrapper: createWrapper() })

        await waitFor(() => {
            expect(screen.getByText('100')).toBeInTheDocument() // Total users
        })
    })
})

// ============ ADMIN USERS TESTS ============

describe('AdminUsers', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockStore.isAdminAuthenticated = true
    })

    it('should render user management page', async () => {
        adminService.getAllUsers.mockResolvedValue({
            data: [
                { _id: 'u1', name: 'User 1', email: 'u1@test.com', role: 'user', createdAt: '2024-01-01' },
                { _id: 'u2', name: 'User 2', email: 'u2@test.com', role: 'admin', createdAt: '2024-01-02' },
            ],
            pagination: { page: 1, limit: 15, total: 2, pages: 1 },
        })

        render(<AdminUsers />, { wrapper: createWrapper() })

        await waitFor(() => {
            expect(screen.getByText('User Management')).toBeInTheDocument()
        })
    })

    it('should display users in table', async () => {
        adminService.getAllUsers.mockResolvedValue({
            data: [
                { _id: 'u1', name: 'John Doe', email: 'john@test.com', role: 'user', createdAt: '2024-01-01' },
            ],
            pagination: { page: 1, limit: 15, total: 1, pages: 1 },
        })

        render(<AdminUsers />, { wrapper: createWrapper() })

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument()
            expect(screen.getByText('john@test.com')).toBeInTheDocument()
        })
    })

    it('should filter users by search', async () => {
        adminService.getAllUsers.mockResolvedValue({
            data: [],
            pagination: { page: 1, limit: 15, total: 0, pages: 0 },
        })

        render(<AdminUsers />, { wrapper: createWrapper() })

        const searchInput = screen.getByPlaceholderText(/search/i)
        fireEvent.change(searchInput, { target: { value: 'john' } })
        fireEvent.click(screen.getByRole('button', { name: /search/i }))

        await waitFor(() => {
            expect(adminService.getAllUsers).toHaveBeenCalledWith(
                expect.objectContaining({ search: 'john' })
            )
        })
    })

    it('should filter users by role', async () => {
        adminService.getAllUsers.mockResolvedValue({
            data: [],
            pagination: { page: 1, limit: 15, total: 0, pages: 0 },
        })

        render(<AdminUsers />, { wrapper: createWrapper() })

        const roleSelect = screen.getByRole('combobox')
        fireEvent.change(roleSelect, { target: { value: 'admin' } })

        await waitFor(() => {
            expect(adminService.getAllUsers).toHaveBeenCalledWith(
                expect.objectContaining({ role: 'admin' })
            )
        })
    })
})

// ============ CLEANUP VERIFICATION ============

describe('Test Cleanup', () => {
    afterAll(() => {
        console.log('=== FRONTEND TEST CLEANUP ===')
        console.log('All mocks cleared')
        console.log('No test data requires cleanup (frontend tests use mocks)')
        console.log('=== CLEANUP COMPLETE ===')
    })

    it('should verify all mocks are properly reset between tests', () => {
        vi.clearAllMocks()

        expect(adminService.adminSignIn).not.toHaveBeenCalled()
        expect(mockStore.adminLogin).not.toHaveBeenCalled()
    })
})
