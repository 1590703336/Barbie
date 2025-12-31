import api from './api'

export async function getUser(userId) {
    const response = await api.get(`/users/${userId}`)
    return response.data
}

export async function updateUser(userId, data) {
    const response = await api.put(`/users/${userId}`, data)
    return response.data
}

export async function deleteUser(userId) {
    const response = await api.delete(`/users/${userId}`)
    return response.data
}
