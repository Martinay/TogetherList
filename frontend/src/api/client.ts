// Centralized API client configuration
// All API calls should use this module to ensure consistent URL handling

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

/**
 * Base URL for API v1 endpoints
 * In development, Vite proxies /api requests to the backend
 * In production, the same host serves both frontend and backend
 */
export const API_V1 = `${API_BASE_URL}/api/v1`

/**
 * Generic fetch wrapper with error handling
 */
export async function apiFetch<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = `${API_V1}${endpoint}`
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    })

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

/**
 * GET request helper
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
    return apiFetch<T>(endpoint)
}

/**
 * POST request helper
 */
export async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
    return apiFetch<T>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
    })
}

/**
 * PUT request helper
 */
export async function apiPut<T>(endpoint: string, body: unknown): Promise<T> {
    return apiFetch<T>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
    })
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
    return apiFetch<T>(endpoint, {
        method: 'DELETE',
    })
}
