import { jest } from '@jest/globals';

// Mock Dependencies
const mockConvertPairRepository = {
    create: jest.fn(),
    findByUser: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn()
};

const mockAuthorization = {
    assertOwnerOrAdmin: jest.fn(),
    buildError: jest.fn((msg, code) => {
        const err = new Error(msg);
        err.statusCode = code;
        return err;
    })
};

// Mock Imports
jest.unstable_mockModule('../src/modules/convertPair/convertPair.repository.js', () => mockConvertPairRepository);
jest.unstable_mockModule('../src/utils/authorization.js', () => mockAuthorization);

// Import Controller
const {
    createConvertPair,
    getConvertPairs,
    updateConvertPair,
    deleteConvertPair
} = await import('../src/modules/convertPair/convertPair.controller.js');

describe('ConvertPair Controller', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            user: { _id: 'user123', role: 'user' },
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

    describe('createConvertPair', () => {
        it('should create a convert pair', async () => {
            req.body = { fromCurrency: 'USD', toCurrency: 'EUR' };
            const createdPair = { _id: 'pair1', ...req.body, user: 'user123' };

            mockConvertPairRepository.create.mockResolvedValue(createdPair);

            await createConvertPair(req, res, next);

            expect(mockConvertPairRepository.create).toHaveBeenCalledWith({
                fromCurrency: 'USD',
                toCurrency: 'EUR',
                user: 'user123'
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Convert pair created successfully',
                data: createdPair
            });
        });
    });

    describe('getConvertPairs', () => {
        it('should get all convert pairs for user', async () => {
            const pairs = [
                { _id: 'pair1', fromCurrency: 'USD', toCurrency: 'EUR' },
                { _id: 'pair2', fromCurrency: 'GBP', toCurrency: 'CNY' }
            ];

            mockConvertPairRepository.findByUser.mockResolvedValue(pairs);

            await getConvertPairs(req, res, next);

            expect(mockConvertPairRepository.findByUser).toHaveBeenCalledWith('user123');
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: pairs
            });
        });
    });

    describe('updateConvertPair', () => {
        it('should update a convert pair', async () => {
            req.params.id = 'pair1';
            req.body = { fromCurrency: 'GBP' };

            const existingPair = { _id: 'pair1', user: 'user123', fromCurrency: 'USD', toCurrency: 'EUR' };
            const updatedPair = { ...existingPair, fromCurrency: 'GBP' };

            mockConvertPairRepository.findById.mockResolvedValue(existingPair);
            mockConvertPairRepository.update.mockResolvedValue(updatedPair);

            await updateConvertPair(req, res, next);

            expect(mockConvertPairRepository.findById).toHaveBeenCalledWith('pair1');
            expect(mockAuthorization.assertOwnerOrAdmin).toHaveBeenCalled();
            expect(mockConvertPairRepository.update).toHaveBeenCalledWith('pair1', { fromCurrency: 'GBP' });
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Convert pair updated successfully',
                data: updatedPair
            });
        });

        it('should handle update failure (not found)', async () => {
            req.params.id = 'nonexistent';
            req.body = { fromCurrency: 'GBP' };

            mockConvertPairRepository.findById.mockResolvedValue(null);

            await updateConvertPair(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Convert pair not found',
                statusCode: 404
            }));
        });
    });

    describe('deleteConvertPair', () => {
        it('should delete a convert pair', async () => {
            req.params.id = 'pair1';
            const existingPair = { _id: 'pair1', user: 'user123' };

            mockConvertPairRepository.findById.mockResolvedValue(existingPair);

            await deleteConvertPair(req, res, next);

            expect(mockConvertPairRepository.findById).toHaveBeenCalledWith('pair1');
            expect(mockAuthorization.assertOwnerOrAdmin).toHaveBeenCalled();
            expect(mockConvertPairRepository.deleteById).toHaveBeenCalledWith('pair1');
            expect(res.status).toHaveBeenCalledWith(204);
        });

        it('should handle delete failure (not found)', async () => {
            req.params.id = 'nonexistent';

            mockConvertPairRepository.findById.mockResolvedValue(null);

            await deleteConvertPair(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Convert pair not found',
                statusCode: 404
            }));
        });
    });
});
