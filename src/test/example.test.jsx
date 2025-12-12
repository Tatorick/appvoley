import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

describe('Environment Setup', () => {
    it('should run a simple test', () => {
        expect(true).toBe(true)
    })

    it('should support JSX', () => {
        render(<div>Hello World</div>)
        expect(screen.getByText('Hello World')).toBeInTheDocument()
    })
})
