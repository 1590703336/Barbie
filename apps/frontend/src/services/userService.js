import api from './api'

export async function getUser(userId, { signal } = {}) {
    const response = await api.get(`/users/${userId}`, { signal })
    return response.data
}

export async function updateUser(userId, data, { signal } = {}) {
    const response = await api.put(`/users/${userId}`, data, { signal })
    return response.data
}

export async function deleteUser(userId) {
    const response = await api.delete(`/users/${userId}`)
    return response.data
}
