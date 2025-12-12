import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Login from './Login'
import { supabase } from '../../lib/supabase'
import { BrowserRouter } from 'react-router-dom'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: vi.fn()
        }
    }
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

describe('Login Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders login form correctly', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        )
        expect(screen.getByText(/Bienvenido/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument()
    })

    it('handles input changes', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        )

        const emailInput = screen.getByPlaceholderText('tu@email.com')
        const passwordInput = screen.getByPlaceholderText('••••••••')

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        fireEvent.change(passwordInput, { target: { value: 'password123' } })

        expect(emailInput.value).toBe('test@example.com')
        expect(passwordInput.value).toBe('password123')
    })

    it('shows error on failed login', async () => {
        supabase.auth.signInWithPassword.mockResolvedValue({
            data: null,
            error: { message: 'Invalid credentials' }
        })

        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        )

        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } })
        fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
        })
    })

    it('navigates to app on successful login', async () => {
        supabase.auth.signInWithPassword.mockResolvedValue({
            data: { user: { id: '123' } },
            error: null
        })

        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        )

        fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'correct' } })
        fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }))

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/app')
        })
    })
})
