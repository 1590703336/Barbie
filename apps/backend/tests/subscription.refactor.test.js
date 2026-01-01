import { jest } from '@jest/globals';

// Mock Dependencies
const mockSubscriptionRepository = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn(),
    aggregate: jest.fn()
};

const mockSubscriptionService = {
    prepareSubscriptionData: jest.fn(),
    buildTotalSubscriptionPipeline: jest.fn(),
    calculateTotalFromStats: jest.fn()
};

const mockAuthorization = {
    assertOwnerOrAdmin: jest.fn(),
    assertSameUserOrAdmin: jest.fn(),
    buildError: jest.fn((msg, code) => {
        const err = new Error(msg);
        err.statusCode = code;
        return err;
    })
};

// Mock Imports
jest.unstable_mockModule('../src/modules/subscription/subscription.repository.js', () => mockSubscriptionRepository);
jest.unstable_mockModule('../src/modules/subscription/subscription.service.js', () => mockSubscriptionService);
jest.unstable_mockModule('../src/utils/authorization.js', () => mockAuthorization);
jest.unstable_mockModule('../src/modules/currency/currency.service.js', () => ({
    convertFromUSD: jest.fn((amount) => amount),
    convertToUSD: jest.fn((amount) => amount)
}));

// Import Controller
const {
    createSubscription,
    updateSubscription,
    deleteSubscription,
    cancelSubscription,
    getUpcomingRenewals,
    getTotalSubscription,
    getSubscriptions,
    getSubscriptionById,
    getAllSubscriptions
} = await import('../src/modules/subscription/subscription.controller.js');

describe('Subscription Controller (Refactored)', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            user: { _id: 'user123', role: 'user', defaultCurrency: 'USD' },
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };
        next = jest.fn();
    });

    describe('createSubscription', () => {
        it('should create subscription via orchestration', async () => {
            console.log('\n--- TEST: createSubscription ---');
            req.body = { name: 'Netflix', price: 10 };
            console.log(`Input (req.body):`, JSON.stringify(req.body, null, 2));

            const preparedData = { name: 'Netflix', price: 10, amountUSD: 10, user: 'user123' };
            const createdSub = { ...preparedData, _id: 's1' };

            mockSubscriptionService.prepareSubscriptionData.mockResolvedValue(preparedData);
            console.log(`Mock Setup (Service prep):`, JSON.stringify(preparedData, null, 2));

            mockSubscriptionRepository.create.mockResolvedValue(createdSub);
            console.log(`Mock Setup (Repo create):`, JSON.stringify(createdSub, null, 2));

            await createSubscription(req, res, next);

            console.log(`Expected Output (res.json):`, JSON.stringify({ success: true, message: 'Subscription created successfully', data: { subscription: createdSub } }, null, 2));
            console.log(`Actual Output (res.status):`, res.status.mock.calls[0][0]);
            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));

            expect(mockSubscriptionService.prepareSubscriptionData).toHaveBeenCalledWith(expect.objectContaining({ name: 'Netflix', user: 'user123' }));
            expect(mockSubscriptionRepository.create).toHaveBeenCalledWith(preparedData);
            expect(res.status).toHaveBeenCalledWith(201);
            console.log('--- TEST PASSED ---');
        });
    });

    describe('getSubscriptions', () => {
        it('should get all subscriptions for a user', async () => {
            console.log('\n--- TEST: getSubscriptions ---');
            req.params.id = 'user123';
            console.log(`Input (req.params.id): ${req.params.id}`);

            const subs = [{ _id: 's1' }];
            mockSubscriptionRepository.find.mockResolvedValue(subs);
            console.log(`Mock Setup (Repo find):`, JSON.stringify(subs, null, 2));

            await getSubscriptions(req, res, next);

            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));
            expect(mockSubscriptionRepository.find).toHaveBeenCalledWith({ user: 'user123' });
            console.log('--- TEST PASSED ---');
        });
    });

    describe('getSubscriptionById', () => {
        it('should get subscription by ID', async () => {
            console.log('\n--- TEST: getSubscriptionById ---');
            req.params.id = 's1';
            const sub = { _id: 's1', user: 'user123' };
            mockSubscriptionRepository.findById.mockResolvedValue(sub);
            console.log(`Mock Setup (Repo findById):`, JSON.stringify(sub, null, 2));

            await getSubscriptionById(req, res, next);

            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));
            expect(mockAuthorization.assertOwnerOrAdmin).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            console.log('--- TEST PASSED ---');
        });
    });

    describe('updateSubscription', () => {
        it('should update subscription', async () => {
            console.log('\n--- TEST: updateSubscription ---');
            req.params.id = 's1';
            req.body = { price: 20 };

            const existing = { _id: 's1', user: 'user123', price: 10 };
            const prepared = { price: 20 };
            const updated = { _id: 's1', price: 20 };

            mockSubscriptionRepository.findById.mockResolvedValue(existing);
            mockSubscriptionService.prepareSubscriptionData.mockResolvedValue(prepared);
            mockSubscriptionRepository.update.mockResolvedValue(updated);
            console.log(`Mock Setup (Repo update):`, JSON.stringify(updated, null, 2));

            await updateSubscription(req, res, next);

            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));
            expect(mockSubscriptionRepository.update).toHaveBeenCalledWith('s1', prepared);
            console.log('--- TEST PASSED ---');
        });

        it('should handle update failure (Subscription not found)', async () => {
            console.log('\n--- TEST: updateSubscription (Not Found) ---');
            req.params.id = 'nonexistent';
            req.body = { price: 20 };

            mockSubscriptionRepository.findById.mockResolvedValue(null);

            await updateSubscription(req, res, next);

            expect(mockSubscriptionRepository.findById).toHaveBeenCalledWith('nonexistent');
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, message: 'Subscription not found' }));
            console.log('--- TEST PASSED ---');
        });
    });

    describe('deleteSubscription', () => {
        it('should delete subscription', async () => {
            console.log('\n--- TEST: deleteSubscription ---');
            req.params.id = 's1';
            const existing = { _id: 's1', user: 'user123' };
            mockSubscriptionRepository.findById.mockResolvedValue(existing);

            await deleteSubscription(req, res, next);

            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));
            expect(mockSubscriptionRepository.deleteById).toHaveBeenCalledWith('s1');
            console.log('--- TEST PASSED ---');
        });

        it('should handle delete failure (Subscription not found)', async () => {
            console.log('\n--- TEST: deleteSubscription (Not Found) ---');
            req.params.id = 'nonexistent';

            mockSubscriptionRepository.findById.mockResolvedValue(null);

            await deleteSubscription(req, res, next);

            expect(mockSubscriptionRepository.findById).toHaveBeenCalledWith('nonexistent');
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, message: 'Subscription not found' }));
            console.log('--- TEST PASSED ---');
        });
    });

    describe('cancelSubscription', () => {
        it('should cancel subscription', async () => {
            console.log('\n--- TEST: cancelSubscription ---');
            req.params.id = 's1';
            const existing = { _id: 's1', user: 'user123', status: 'active' };
            const updated = { _id: 's1', status: 'cancelled' };

            mockSubscriptionRepository.findById.mockResolvedValue(existing);
            mockSubscriptionRepository.update.mockResolvedValue(updated);

            await cancelSubscription(req, res, next);

            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));
            expect(mockSubscriptionRepository.update).toHaveBeenCalledWith('s1', { status: 'cancelled' });
            console.log('--- TEST PASSED ---');
        });
    });

    describe('getUpcomingRenewals', () => {
        it('should fetch renewals via logic in controller/service', async () => {
            console.log('\n--- TEST: getUpcomingRenewals ---');
            const renewals = [{ name: 'Gym' }];
            mockSubscriptionRepository.find.mockResolvedValue(renewals);
            console.log(`Mock Setup (Repository find):`, JSON.stringify(renewals, null, 2));

            await getUpcomingRenewals(req, res, next);

            console.log(`Actual Output (res.status):`, res.status.mock.calls[0][0]);
            expect(mockAuthorization.assertSameUserOrAdmin).toHaveBeenCalled();
            expect(mockSubscriptionRepository.find).toHaveBeenCalledWith(
                expect.objectContaining({ user: 'user123' }),
                { renewalDate: 1 }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            console.log('--- TEST PASSED ---');
        });
    });

    describe('getTotalSubscription', () => {
        it('should calculate totals via aggregation pipeline', async () => {
            console.log('\n--- TEST: getTotalSubscription ---');
            const pipeline = ['pipe'];
            const stats = [{ _id: 'monthly', total: 10 }];

            mockSubscriptionService.buildTotalSubscriptionPipeline.mockReturnValue(pipeline);
            mockSubscriptionRepository.aggregate.mockResolvedValue(stats);
            mockSubscriptionService.calculateTotalFromStats.mockReturnValue(120);

            await getTotalSubscription(req, res, next);

            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));
            expect(mockSubscriptionService.buildTotalSubscriptionPipeline).toHaveBeenCalledWith('user123');
            expect(mockSubscriptionRepository.aggregate).toHaveBeenCalledWith(pipeline);
            expect(mockSubscriptionService.calculateTotalFromStats).toHaveBeenCalledWith(stats);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: { total: 120 }
            }));
            console.log('--- TEST PASSED: getTotalSubscription ---');
        });
    });

    describe('getAllSubscriptions', () => {
        it('should get all subscriptions (admin view)', async () => {
            console.log('\n--- TEST: getAllSubscriptions (Admin) ---');
            req.user.role = 'admin';
            console.log(`Input (req.user.role): admin`);

            const subs = [{ _id: 's1' }, { _id: 's2' }];
            mockSubscriptionRepository.find.mockResolvedValue(subs);
            console.log(`Mock Setup (Repo find): ${JSON.stringify(subs)}`);

            await getAllSubscriptions(req, res, next);
            // how many subscriptions are there?

            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));
            expect(mockSubscriptionRepository.find).toHaveBeenCalledWith({});
            console.log('--- TEST PASSED ---');
        });

        it('should get user subscriptions (user view)', async () => {
            console.log('\n--- TEST: getAllSubscriptions (User) ---');
            req.user.role = 'user';
            console.log(`Input (req.user.role): user`);

            const subs = [{ _id: 's1' }];
            mockSubscriptionRepository.find.mockResolvedValue(subs);
            console.log(`Mock Setup (Repo find): ${JSON.stringify(subs)}`);

            await getAllSubscriptions(req, res, next);
            // how many subscriptions are there?
            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));
            expect(mockSubscriptionRepository.find).toHaveBeenCalledWith({ user: 'user123' });
            console.log('--- TEST PASSED ---');
        });
    });
});
