import { jest } from '@jest/globals';

const mockAxios = {
    get: jest.fn()
};

jest.unstable_mockModule('axios', () => ({
    default: mockAxios
}));

const { convertToUSD, convertFromUSD } = await import('../src/modules/currency/currency.service.js');

describe('currency.service unsupported currency handling', () => {
    beforeEach(() => {
        mockAxios.get.mockReset();
        mockAxios.get.mockResolvedValue({
            data: {
                rates: { USD: 1, EUR: 0.92, GBP: 0.79 }
            }
        });
    });

    describe('convertToUSD', () => {
        it('returns the amount unchanged for USD', async () => {
            await expect(convertToUSD(100, 'USD')).resolves.toBe(100);
        });

        it('converts a supported currency', async () => {
            await expect(convertToUSD(92, 'EUR')).resolves.toBe(100);
        });

        it('throws an error with statusCode 400 for an unsupported currency', async () => {
            expect.assertions(3);
            try {
                await convertToUSD(100, 'XYZ');
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(err.statusCode).toBe(400);
                expect(err.message).toBe('Unsupported currency: XYZ');
            }
        });
    });

    describe('convertFromUSD', () => {
        it('returns the amount unchanged for USD', async () => {
            await expect(convertFromUSD(100, 'USD')).resolves.toBe(100);
        });

        it('converts to a supported currency', async () => {
            await expect(convertFromUSD(100, 'EUR')).resolves.toBe(92);
        });

        it('throws an error with statusCode 400 for an unsupported currency', async () => {
            expect.assertions(3);
            try {
                await convertFromUSD(100, 'XYZ');
            } catch (err) {
                expect(err).toBeInstanceOf(Error);
                expect(err.statusCode).toBe(400);
                expect(err.message).toBe('Unsupported currency: XYZ');
            }
        });
    });
});
