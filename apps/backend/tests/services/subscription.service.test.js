import { jest } from '@jest/globals';

// Mock currency conversion
const mockConvertToUSD = jest.fn();
const mockBuildError = jest.fn((msg, code) => {
    const err = new Error(msg);
    err.statusCode = code;
    return err;
});

jest.unstable_mockModule('../../src/modules/currency/currency.service.js', () => ({
    convertToUSD: mockConvertToUSD
}));

jest.unstable_mockModule('../../src/utils/authorization.js', () => ({
    buildError: mockBuildError
}));

// Import service (after mocks)
const {
    prepareSubscriptionData,
    buildTotalSubscriptionPipeline,
    calculateTotalFromStats
} = await import('../../src/modules/subscription/subscription.service.js');

describe('Subscription Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockConvertToUSD.mockImplementation((amount, currency) => {
            if (currency === 'USD') return Promise.resolve(amount);
            if (currency === 'EUR') return Promise.resolve(amount * 1.1);
            return Promise.resolve(amount);
        });
    });

    describe('prepareSubscriptionData', () => {
        describe('Currency Conversion', () => {
            it('should calculate amountUSD for USD subscription', async () => {
                const data = { price: 10, currency: 'USD', name: 'Netflix' };

                const result = await prepareSubscriptionData(data);

                expect(mockConvertToUSD).toHaveBeenCalledWith(10, 'USD');
                expect(result.amountUSD).toBe(10);
            });

            it('should calculate amountUSD for non-USD subscription', async () => {
                const data = { price: 10, currency: 'EUR', name: 'Spotify' };

                const result = await prepareSubscriptionData(data);

                expect(mockConvertToUSD).toHaveBeenCalledWith(10, 'EUR');
                expect(result.amountUSD).toBe(11);
            });

            it('should recalculate amountUSD when price changes', async () => {
                const data = { price: 20 };
                const existingData = { price: 10, currency: 'USD', amountUSD: 10 };

                const result = await prepareSubscriptionData(data, existingData);

                expect(mockConvertToUSD).toHaveBeenCalledWith(20, 'USD');
                expect(result.amountUSD).toBe(20);
            });

            it('should handle price changed to 0 correctly', async () => {
                const data = { price: 0 };
                const existingData = { price: 15, currency: 'USD', amountUSD: 15, _id: 'sub1' };

                const result = await prepareSubscriptionData(data, existingData);

                expect(mockConvertToUSD).toHaveBeenCalledWith(0, 'USD');
                expect(result.amountUSD).toBe(0);
                expect(result.price).toBe(0);
            });
        });

        describe('Renewal Date Calculation', () => {
            it('should auto-calculate renewalDate for new daily subscription', async () => {
                const startDate = new Date('2024-01-15');
                const data = {
                    price: 1,
                    currency: 'USD',
                    startDate: startDate.toISOString(),
                    frequency: 'daily'
                };

                const result = await prepareSubscriptionData(data);

                expect(result.renewalDate).toBeInstanceOf(Date);
                const expected = new Date('2024-01-16');
                expect(result.renewalDate.toDateString()).toBe(expected.toDateString());
            });

            it('should auto-calculate renewalDate for new weekly subscription', async () => {
                const data = {
                    price: 5,
                    currency: 'USD',
                    startDate: '2024-01-15',
                    frequency: 'weekly'
                };

                const result = await prepareSubscriptionData(data);

                const expected = new Date('2024-01-22'); // 15 + 7
                expect(result.renewalDate.toDateString()).toBe(expected.toDateString());
            });

            it('should auto-calculate renewalDate for new monthly subscription', async () => {
                const data = {
                    price: 10,
                    currency: 'USD',
                    startDate: '2024-01-15',
                    frequency: 'monthly'
                };

                const result = await prepareSubscriptionData(data);

                const expected = new Date('2024-02-14'); // 15 + 30
                expect(result.renewalDate.toDateString()).toBe(expected.toDateString());
            });

            it('should auto-calculate renewalDate for new yearly subscription', async () => {
                const data = {
                    price: 100,
                    currency: 'USD',
                    startDate: '2024-01-15',
                    frequency: 'yearly'
                };

                const result = await prepareSubscriptionData(data);

                const expected = new Date('2025-01-14'); // 15 + 365
                expect(result.renewalDate.toDateString()).toBe(expected.toDateString());
            });

            it('should recalculate renewalDate when frequency changes', async () => {
                const data = { frequency: 'weekly' };
                const existingData = {
                    _id: 'sub1',
                    startDate: new Date('2024-01-15'),
                    frequency: 'monthly',
                    renewalDate: new Date('2024-02-14')
                };

                const result = await prepareSubscriptionData(data, existingData);

                const expected = new Date('2024-01-22'); // 7 days from startDate
                expect(result.renewalDate.toDateString()).toBe(expected.toDateString());
            });

            it('should recalculate renewalDate when startDate changes', async () => {
                const data = { startDate: '2024-02-01' };
                const existingData = {
                    _id: 'sub1',
                    startDate: new Date('2024-01-15'),
                    frequency: 'monthly',
                    renewalDate: new Date('2024-02-14')
                };

                const result = await prepareSubscriptionData(data, existingData);

                const expected = new Date('2024-03-02'); // 30 days from new startDate
                expect(result.renewalDate.toDateString()).toBe(expected.toDateString());
            });

            it('should use provided renewalDate when explicitly given', async () => {
                const customRenewalDate = '2024-06-01';
                const data = {
                    price: 10,
                    currency: 'USD',
                    startDate: '2024-01-15',
                    frequency: 'monthly',
                    renewalDate: customRenewalDate
                };

                const result = await prepareSubscriptionData(data);

                // Should NOT auto-calculate, should use provided value
                expect(result.renewalDate).toBe(customRenewalDate);
            });

            it('should not recalculate renewalDate for existing subscription when no input changes params', async () => {
                const data = { name: 'New Name' };
                const existingData = {
                    _id: 'sub1',
                    startDate: new Date('2024-01-15'),
                    frequency: 'monthly',
                    renewalDate: new Date('2024-02-14')
                };

                const result = await prepareSubscriptionData(data, existingData);

                // renewalDate should not be in result (not recalculated)
                expect(result.renewalDate).toBeUndefined();
            });
        });

        describe('Status Handling', () => {
            it('should set status to expired if renewalDate is in the past', async () => {
                const pastDate = new Date();
                pastDate.setDate(pastDate.getDate() - 10); // 10 days ago

                const data = {
                    price: 10,
                    currency: 'USD',
                    renewalDate: pastDate.toISOString()
                };

                const result = await prepareSubscriptionData(data);

                expect(result.status).toBe('expired');
            });

            it('should not set status to expired if renewalDate is in the future', async () => {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 30);

                const data = {
                    price: 10,
                    currency: 'USD',
                    renewalDate: futureDate.toISOString()
                };

                const result = await prepareSubscriptionData(data);

                expect(result.status).toBeUndefined();
            });
        });

        describe('Validation', () => {
            it('should throw error if renewalDate is before or equal to startDate', async () => {
                const data = {
                    price: 10,
                    currency: 'USD',
                    startDate: '2024-06-15',
                    renewalDate: '2024-06-10' // Before startDate
                };

                await expect(prepareSubscriptionData(data)).rejects.toThrow('Renew date must be after the start date');
            });

            it('should throw error if renewalDate equals startDate', async () => {
                const data = {
                    price: 10,
                    currency: 'USD',
                    startDate: '2024-06-15',
                    renewalDate: '2024-06-15' // Same as startDate
                };

                await expect(prepareSubscriptionData(data)).rejects.toThrow('Renew date must be after the start date');
            });
        });
    });

    describe('buildTotalSubscriptionPipeline', () => {
        it('should filter by user and active status', () => {
            const pipeline = buildTotalSubscriptionPipeline('507f1f77bcf86cd799439011');

            expect(pipeline).toHaveLength(2);

            const matchStage = pipeline[0].$match;
            expect(matchStage.status).toBe('active');
        });

        it('should use ObjectId for user', () => {
            const pipeline = buildTotalSubscriptionPipeline('507f1f77bcf86cd799439011');

            const matchStage = pipeline[0].$match;
            expect(matchStage.user).toBeDefined();
        });

        it('should group by frequency', () => {
            const pipeline = buildTotalSubscriptionPipeline('507f1f77bcf86cd799439011');

            const groupStage = pipeline[1].$group;
            expect(groupStage._id).toBe('$frequency');
            expect(groupStage.total).toBeDefined();
        });
    });

    describe('calculateTotalFromStats', () => {
        it('should apply daily multiplier (365)', () => {
            const stats = [{ _id: 'daily', total: 1 }];

            const result = calculateTotalFromStats(stats);

            expect(result).toBe(365);
        });

        it('should apply weekly multiplier (52)', () => {
            const stats = [{ _id: 'weekly', total: 10 }];

            const result = calculateTotalFromStats(stats);

            expect(result).toBe(520);
        });

        it('should apply monthly multiplier (12)', () => {
            const stats = [{ _id: 'monthly', total: 15 }];

            const result = calculateTotalFromStats(stats);

            expect(result).toBe(180);
        });

        it('should apply yearly multiplier (1)', () => {
            const stats = [{ _id: 'yearly', total: 100 }];

            const result = calculateTotalFromStats(stats);

            expect(result).toBe(100);
        });

        it('should sum multiple frequencies correctly', () => {
            const stats = [
                { _id: 'monthly', total: 10 },  // 10 * 12 = 120
                { _id: 'yearly', total: 50 },   // 50 * 1 = 50
                { _id: 'weekly', total: 5 }     // 5 * 52 = 260
            ];

            const result = calculateTotalFromStats(stats);

            expect(result).toBe(430); // 120 + 50 + 260
        });

        it('should return 0 for empty stats', () => {
            const stats = [];

            const result = calculateTotalFromStats(stats);

            expect(result).toBe(0);
        });

        it('should handle unknown frequency as 0 multiplier', () => {
            const stats = [
                { _id: 'monthly', total: 10 },
                { _id: 'biweekly', total: 20 } // Unknown frequency
            ];

            const result = calculateTotalFromStats(stats);

            expect(result).toBe(120); // Only monthly counted: 10 * 12
        });

        it('should handle subscriptions with zero total', () => {
            const stats = [
                { _id: 'monthly', total: 0 },
                { _id: 'yearly', total: 100 }
            ];

            const result = calculateTotalFromStats(stats);

            expect(result).toBe(100);
        });
    });
});
