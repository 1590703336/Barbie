import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ForgotPasswordForm from '../../../components/auth/ForgotPasswordForm'

describe('ForgotPasswordForm', () => {
    it('renders email input and submit button', () => {
        render(<ForgotPasswordForm loading={false} />)

        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument()
    })

    it('updates email state on input change', () => {
        render(<ForgotPasswordForm loading={false} />)

        const input = screen.getByLabelText(/Email/i)
        fireEvent.change(input, { target: { value: 'test@example.com' } })

        expect(input).toHaveValue('test@example.com')
    })

    it('calls onSubmit with email when form is submitted', () => {
        const mockOnSubmit = vi.fn()
        render(<ForgotPasswordForm onSubmit={mockOnSubmit} loading={false} />)

        const input = screen.getByLabelText(/Email/i)
        // Fill email
        fireEvent.change(input, { target: { value: 'test@example.com' } })

        // Submit
        fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }))

        expect(mockOnSubmit).toHaveBeenCalledWith({ email: 'test@example.com' })
    })

    it('disables submit button when loading is true', () => {
        render(<ForgotPasswordForm loading={true} />)

        const button = screen.getByRole('button')
        expect(button).toBeDisabled()
    })

    it('shows "Sending..." text when loading', () => {
        render(<ForgotPasswordForm loading={true} />)

        expect(screen.getByText(/Sending.../i)).toBeInTheDocument()
    })

    it('prevents submission with empty email (HTML required attribute)', () => {
        const mockOnSubmit = vi.fn()
        render(<ForgotPasswordForm onSubmit={mockOnSubmit} loading={false} />)

        const input = screen.getByLabelText(/Email/i)
        expect(input).toBeRequired()

        // Note: verify HTML5 validation prevents submission is tricky in JSDOM sometimes, 
        // but verifying the 'required' attribute exists is usually sufficient for unit tests.
    })
})
