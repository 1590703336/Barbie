import '@testing-library/jest-dom'

// Mock for axios
vi.mock('./services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}))
