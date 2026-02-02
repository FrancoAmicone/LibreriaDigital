const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiOptions extends RequestInit {
    token?: string;
}

export async function apiFetch(endpoint: string, options: ApiOptions = {}) {
    const { token, ...rest } = options;

    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...rest,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'API request failed');
    }

    return response.json();
}

export const usersApi = {
    getMe: (token: string) => apiFetch('/api/users/me', { token }),
    sync: (token: string, data: { name?: string; image?: string; email?: string }) =>
        apiFetch('/api/users/sync', { method: 'POST', body: JSON.stringify(data), token }),
    requestAccess: (token: string) =>
        apiFetch('/api/users/request-access', { method: 'PATCH', token }),
    getAll: (token: string) => apiFetch('/api/users', { token }),
    updateStatus: (id: string, status: 'ACTIVE' | 'PENDING', token: string) =>
        apiFetch(`/api/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }), token }),
};

export const booksApi = {
    getAll: (token: string) => apiFetch('/api/books', { token }),
    getById: (id: string, token: string) => apiFetch(`/api/books/${id}`, { token }),
    create: (data: any, token: string) =>
        apiFetch('/api/books', { method: 'POST', body: JSON.stringify(data), token }),
    delete: (id: string, token: string) =>
        apiFetch(`/api/books/${id}`, { method: 'DELETE', token }),
    update: (id: string, data: any, token: string) =>
        apiFetch(`/api/books/${id}`, { method: 'PUT', body: JSON.stringify(data), token }),
};

export const lendingApi = {
    createRequest: (bookId: string, token: string) =>
        apiFetch('/api/lending-requests', { method: 'POST', body: JSON.stringify({ bookId }), token }),
    getMyRequests: (token: string) =>
        apiFetch('/api/lending-requests/my-requests', { token }),
    getRequestsForMyBooks: (token: string) =>
        apiFetch('/api/lending-requests/for-my-books', { token }),
    approve: (requestId: string, token: string) =>
        apiFetch(`/api/lending-requests/${requestId}/approve`, { method: 'PATCH', token }),
    reject: (requestId: string, token: string) =>
        apiFetch(`/api/lending-requests/${requestId}/reject`, { method: 'PATCH', token }),
    markDelivered: (requestId: string, token: string) =>
        apiFetch(`/api/lending-requests/${requestId}/deliver`, { method: 'PATCH', token }),
    markReturned: (requestId: string, token: string) =>
        apiFetch(`/api/lending-requests/${requestId}/return`, { method: 'PATCH', token }),
    cancel: (requestId: string, token: string) =>
        apiFetch(`/api/lending-requests/${requestId}`, { method: 'DELETE', token }),
};
