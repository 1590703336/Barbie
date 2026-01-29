import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ResetPasswordForm from '../../../components/auth/ResetPasswordForm'

describe('ResetPasswordForm', () => {
    it('renders password inputs and submit button', () => {
        render(<ResetPasswordForm loading={false} />)

        expect(screen.getByLabelText(/^New Password/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/^Confirm Password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument()
    })

    it('updates password state on input change', () => {
        render(<ResetPasswordForm loading={false} />)

        const passwordInput = screen.getByLabelText(/^New Password/i)
        fireEvent.change(passwordInput, { target: { value: 'password123' } })

        expect(passwordInput).toHaveValue('password123')
    })

    it('shows error message when passwords do not match', () => {
        render(<ResetPasswordForm loading={false} />)

        fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'password123' } })
        fireEvent.change(screen.getByLabelText(/^Confirm Password/i), { target: { value: 'mismatch' } })

        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument()
    })

    it('disables submit button when passwords do not match', () => {
        render(<ResetPasswordForm loading={false} />)

        fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'password123' } })
        fireEvent.change(screen.getByLabelText(/^Confirm Password/i), { target: { value: 'mismatch' } })

        const button = screen.getByRole('button', { name: /Reset Password/i })
        expect(button).toBeDisabled()
    })

    it('calls onSubmit with passwords when they match and form is submitted', () => {
        const mockOnSubmit = vi.fn()
        render(<ResetPasswordForm onSubmit={mockOnSubmit} loading={false} />)

        fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'password123' } })
        fireEvent.change(screen.getByLabelText(/^Confirm Password/i), { target: { value: 'password123' } })

        fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }))

        expect(mockOnSubmit).toHaveBeenCalledWith({
            password: 'password123',
            confirmPassword: 'password123'
        })
    })

    it('shows "Resetting..." text when loading', () => {
        render(<ResetPasswordForm loading={true} />)

        expect(screen.getByText(/Resetting.../i)).toBeInTheDocument()
    })

    it('disables submit button when loading is true', () => {
        render(<ResetPasswordForm loading={true} />)

        const button = screen.getByRole('button', { name: /Resetting.../i })
        expect(button).toBeDisabled()
    })
})
