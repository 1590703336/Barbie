import { jest } from '@jest/globals';

// Mock Dependencies
const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn()
};

// Mock Imports
jest.unstable_mockModule('../src/modules/auth/auth.service.js', () => mockAuthService);

// Import Controller
const {
    signUp,
    signIn
} = await import('../src/modules/auth/auth.controller.js');

describe('Auth Controller (Refactored)', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };
        next = jest.fn();
    });

    describe('signIn', () => {
        it('should sign in a user', async () => {
            console.log('\n--- TEST: signIn ---');
            req.body = { email: 'test@example.com', password: 'password' };
            console.log(`Input (req.body):`, JSON.stringify(req.body, null, 2));

            const serviceResult = { user: { _id: 'u1', email: 'test@example.com' }, token: 'xyz' };
            mockAuthService.signIn.mockResolvedValue(serviceResult);
            console.log(`Mock Setup (Service signIn):`, JSON.stringify(serviceResult, null, 2));

            await signIn(req, res, next);

            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));

            expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({ token: 'xyz' })
            }));
            console.log('--- TEST PASSED ---');
        });

        it('should handle signIn failure (User not found)', async () => {
            console.log('\n--- TEST: signIn (User Not Found) ---');
            req.body = { email: 'wrong@example.com', password: 'password' };
            console.log(`Input (req.body):`, JSON.stringify(req.body, null, 2));

            const error = new Error('User not found');
            error.statusCode = 404;
            mockAuthService.signIn.mockRejectedValue(error);
            console.log(`Mock Setup (Service signIn throws):`, JSON.stringify({ message: error.message, statusCode: error.statusCode }, null, 2));

            await signIn(req, res, next);

            console.log(`Actual Output (next called with):`, JSON.stringify(next.mock.calls[0][0], null, 2));

            expect(mockAuthService.signIn).toHaveBeenCalledWith('wrong@example.com', 'password');
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'User not found', statusCode: 404 }));
            console.log('--- TEST PASSED ---');
        });

        it('should handle signIn failure (Invalid password)', async () => {
            console.log('\n--- TEST: signIn (Invalid Password) ---');
            req.body = { email: 'test@example.com', password: 'wrongpass' };
            console.log(`Input (req.body):`, JSON.stringify(req.body, null, 2));

            const error = new Error('Invalid password');
            error.statusCode = 401;
            mockAuthService.signIn.mockRejectedValue(error);
            console.log(`Mock Setup (Service signIn throws):`, JSON.stringify({ message: error.message, statusCode: error.statusCode }, null, 2));

            await signIn(req, res, next);

            console.log(`Actual Output (next called with):`, JSON.stringify(next.mock.calls[0][0], null, 2));

            expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'wrongpass');
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid password', statusCode: 401 }));
            console.log('--- TEST PASSED ---');
        });
    });

    describe('signUp', () => {
        it('should sign up a user', async () => {
            console.log('\n--- TEST: signUp ---');
            req.body = { email: 'test@example.com', password: 'password' };
            console.log(`Input (req.body):`, JSON.stringify(req.body, null, 2));

            const serviceResult = { user: { _id: 'u1', email: 'test@example.com' }, token: 'abc' };
            mockAuthService.signUp.mockResolvedValue(serviceResult);
            console.log(`Mock Setup (Service signUp):`, JSON.stringify(serviceResult, null, 2));

            await signUp(req, res, next);

            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));

            expect(mockAuthService.signUp).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({ token: 'abc' })
            }));
            console.log('--- TEST PASSED ---');
        });

        it('should handle signUp failure (User already exists)', async () => {
            console.log('\n--- TEST: signUp (User Exists) ---');
            req.body = { email: 'test@example.com', password: 'password' };
            console.log(`Input (req.body):`, JSON.stringify(req.body, null, 2));

            const error = new Error('User already exists');
            error.statusCode = 400;
            mockAuthService.signUp.mockRejectedValue(error);
            console.log(`Mock Setup (Service signUp throws):`, JSON.stringify({ message: error.message, statusCode: error.statusCode }, null, 2));

            await signUp(req, res, next);

            console.log(`Actual Output (next called with):`, JSON.stringify(next.mock.calls[0][0], null, 2));

            expect(mockAuthService.signUp).toHaveBeenCalledWith(req.body);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'User already exists', statusCode: 400 }));
            console.log('--- TEST PASSED ---');
        });
    });
});
