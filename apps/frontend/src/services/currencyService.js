import api from './api';

export async function getExchangeRates() {
    const response = await api.get('/currencies');
    return response.data;
}
