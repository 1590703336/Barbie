import api from './api'

export async function getBinding({ signal } = {}) {
    const response = await api.get('/telegram-bot/me', { signal })
    return response.data
}

export async function bindBot(botToken) {
    const response = await api.post('/telegram-bot', { botToken })
    return response.data
}

export async function unbindBot() {
    const response = await api.delete('/telegram-bot')
    return response.data
}
