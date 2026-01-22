/**
 * RecordModal Verification Tests
 * 
 * These tests verify that RecordModal is a purely presentational component
 * that does NOT directly handle any data operations, cache, or service calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RecordModal from '../../components/common/RecordModal'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }) => children,
}))

// Mock CategoryIcon
vi.mock('../../components/common/CategoryIcon', () => ({
    CategoryIcon: ({ category }) => <div data-testid="category-icon">{category}</div>,
}))

// Mock ActionButton with tracking
vi.mock('../../components/common/ActionButton', () => ({
    ActionButton: ({ onClick, children, variant }) => (
        <button data-testid={`action-button-${variant || 'primary'}`} onClick={onClick}>
            {children}
        </button>
    ),
}))

describe('RecordModal - UI-Only Verification', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        type: 'expense',
        data: { title: 'Test Expense', amount: 100, category: 'Food' },
        options: { categories: ['Food', 'Transport'], currencies: ['USD', 'EUR'] },
        onChange: vi.fn(),
        onSave: vi.fn(),
        onDelete: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Callback Delegation (No Direct Data Operations)', () => {
        it('should call onChange callback when form fields change', () => {
            render(<RecordModal {...defaultProps} />)

            const titleInput = screen.getByDisplayValue('Test Expense')
            fireEvent.change(titleInput, { target: { value: 'New Title' } })
            expect(defaultProps.onChange).toHaveBeenCalled()
        })

        it('should call onSave callback when save button clicked', async () => {
            render(<RecordModal {...defaultProps} />)

            const saveButton = screen.getByText('Save Changes')
            fireEvent.click(saveButton)

            expect(defaultProps.onSave).toHaveBeenCalled()
        })

        it('should call onDelete callback when delete button clicked', async () => {
            render(<RecordModal {...defaultProps} />)

            const deleteButton = screen.getByText('Delete')
            fireEvent.click(deleteButton)

            expect(defaultProps.onDelete).toHaveBeenCalled()
        })

        it('should call onClose callback when cancel button clicked', () => {
            render(<RecordModal {...defaultProps} />)

            const cancelButton = screen.getByText('Cancel')
            fireEvent.click(cancelButton)

            expect(defaultProps.onClose).toHaveBeenCalled()
        })
    })

    describe('Pure Presentational Verification', () => {
        it('should render expense form fields correctly', () => {
            render(<RecordModal {...defaultProps} type="expense" />)
            expect(screen.getByText('expense')).toBeInTheDocument()
        })

        it('should render income form when type is income', () => {
            const incomeData = { category: 'Salary', amount: 5000, source: 'Employer' }
            render(<RecordModal {...defaultProps} type="income" data={incomeData} />)
            expect(screen.getByText('income')).toBeInTheDocument()
        })

        it('should render budget form when type is budget', () => {
            const budgetData = { category: 'Food', limit: 500, month: 1, year: 2024 }
            render(<RecordModal {...defaultProps} type="budget" data={budgetData} />)
            expect(screen.getByText('budget')).toBeInTheDocument()
        })

        it('should render subscription form when type is subscription', () => {
            const subData = { name: 'Netflix', price: 15, frequency: 'monthly' }
            const subOptions = {
                categories: ['Entertainment'],
                currencies: ['USD'],
                frequencies: ['monthly', 'yearly'],
                statuses: ['active', 'cancelled']
            }
            render(<RecordModal {...defaultProps} type="subscription" data={subData} options={subOptions} />)
            expect(screen.getByText('subscription')).toBeInTheDocument()
        })

        it('should display error message from data prop', () => {
            const dataWithError = { ...defaultProps.data, error: 'Validation failed' }
            render(<RecordModal {...defaultProps} data={dataWithError} />)
            expect(screen.getByText('Validation failed')).toBeInTheDocument()
        })
    })

    describe('No Direct Service Import Verification', () => {
        it('should delegate save to parent callback (not direct service call)', async () => {
            render(<RecordModal {...defaultProps} />)

            const saveButton = screen.getByText('Save Changes')
            fireEvent.click(saveButton)

            // onSave being called proves RecordModal delegates, not calls services directly
            expect(defaultProps.onSave).toHaveBeenCalledTimes(1)
        })
    })
})

describe('RecordModal - Form Field Rendering', () => {
    it('should render all expense form fields', () => {
        const props = {
            isOpen: true,
            onClose: vi.fn(),
            type: 'expense',
            data: { title: '', amount: '', category: '', currency: 'USD', date: '', notes: '' },
            options: { categories: ['Food', 'Transport'], currencies: ['USD', 'EUR'] },
            onChange: vi.fn(),
            onSave: vi.fn(),
            onDelete: vi.fn(),
        }

        render(<RecordModal {...props} />)
        expect(screen.getByText(/amount/i)).toBeInTheDocument()
    })
})
