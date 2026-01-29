import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PasswordInput from '../../../components/common/PasswordInput'

describe('PasswordInput', () => {
    it('renders password input with toggle button', () => {
        render(<PasswordInput value="" onChange={() => { }} />)

        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument()
    })

    it('initially hides password (type="password")', () => {
        render(<PasswordInput value="secret123" onChange={() => { }} />)

        const input = screen.getByPlaceholderText('••••••••')
        expect(input).toHaveAttribute('type', 'password')
    })

    it('shows password when toggle clicked (type="text")', () => {
        render(<PasswordInput value="secret123" onChange={() => { }} />)

        const toggleBtn = screen.getByRole('button', { name: /show password/i })
        fireEvent.click(toggleBtn)

        const input = screen.getByPlaceholderText('••••••••')
        expect(input).toHaveAttribute('type', 'text')
    })

    it('hides password when toggle clicked again', () => {
        render(<PasswordInput value="secret123" onChange={() => { }} />)

        const toggleBtn = screen.getByRole('button', { name: /show password/i })

        // First click - show password
        fireEvent.click(toggleBtn)
        expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'text')

        // Second click - hide password again
        const hideBtn = screen.getByRole('button', { name: /hide password/i })
        fireEvent.click(hideBtn)
        expect(screen.getByPlaceholderText('••••••••')).toHaveAttribute('type', 'password')
    })

    it('updates aria-label based on visibility state', () => {
        render(<PasswordInput value="secret123" onChange={() => { }} />)

        // Initially "Show password"
        expect(screen.getByLabelText('Show password')).toBeInTheDocument()

        // After toggle - "Hide password"
        fireEvent.click(screen.getByRole('button'))
        expect(screen.getByLabelText('Hide password')).toBeInTheDocument()
    })

    it('passes custom className to wrapper', () => {
        const { container } = render(
            <PasswordInput value="" onChange={() => { }} className="custom-wrapper" />
        )

        expect(container.firstChild).toHaveClass('custom-wrapper')
    })

    it('passes inputClassName to input element', () => {
        render(
            <PasswordInput
                value=""
                onChange={() => { }}
                inputClassName="custom-input-class"
            />
        )

        const input = screen.getByPlaceholderText('••••••••')
        expect(input).toHaveClass('custom-input-class')
    })

    it('renders label when provided', () => {
        render(
            <PasswordInput
                value=""
                onChange={() => { }}
                label="Password Label"
                id="test-password"
            />
        )

        expect(screen.getByText('Password Label')).toBeInTheDocument()
        expect(screen.getByLabelText('Password Label')).toBeInTheDocument()
    })

    it('handles disabled state', () => {
        render(<PasswordInput value="" onChange={() => { }} disabled />)

        const input = screen.getByPlaceholderText('••••••••')
        const toggleBtn = screen.getByRole('button')

        expect(input).toBeDisabled()
        expect(toggleBtn).toBeDisabled()
    })

    it('calls onChange when input value changes', () => {
        const mockOnChange = vi.fn()
        render(<PasswordInput value="" onChange={mockOnChange} />)

        const input = screen.getByPlaceholderText('••••••••')
        fireEvent.change(input, { target: { value: 'newpassword' } })

        expect(mockOnChange).toHaveBeenCalled()
    })

    it('applies id attribute to input', () => {
        render(<PasswordInput value="" onChange={() => { }} id="password-field" />)

        const input = screen.getByPlaceholderText('••••••••')
        expect(input).toHaveAttribute('id', 'password-field')
    })

    it('applies required attribute when specified', () => {
        render(<PasswordInput value="" onChange={() => { }} required />)

        const input = screen.getByPlaceholderText('••••••••')
        expect(input).toBeRequired()
    })

    it('applies minLength attribute when specified', () => {
        render(<PasswordInput value="" onChange={() => { }} minLength={8} />)

        const input = screen.getByPlaceholderText('••••••••')
        expect(input).toHaveAttribute('minLength', '8')
    })

    it('uses custom placeholder when provided', () => {
        render(<PasswordInput value="" onChange={() => { }} placeholder="Enter password" />)

        expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument()
    })
})
