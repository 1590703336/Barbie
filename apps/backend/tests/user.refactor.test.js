import { jest } from '@jest/globals';

// Mock Dependencies
const mockUserRepository = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteById: jest.fn()
};

const mockUserService = {
    getUsers: jest.fn(),
    getUser: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn()
};

const mockAuthorization = {
    assertAdmin: jest.fn(),
    assertSameUserOrAdmin: jest.fn(),
    assertOwnerOrAdmin: jest.fn(), // If used
    buildError: jest.fn((msg, code) => new Error(msg))
};

// Mock Imports
jest.unstable_mockModule('../src/modules/user/user.repository.js', () => mockUserRepository);
// Note: We are testing the Controller, so we mock the Service. 
// Ideally we might want to integration test Service -> Repository too, 
// but sticking to the pattern of "Test Controller orchestration" is valid.
jest.unstable_mockModule('../src/modules/user/user.service.js', () => mockUserService);
jest.unstable_mockModule('../src/utils/authorization.js', () => mockAuthorization);

// Import Controller
const {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getUser
} = await import('../src/modules/user/user.controller.js');

describe('User Controller (Refactored)', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            user: { _id: 'admin123', role: 'admin' }, // Default to admin for easier privilege
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

    describe('getUsers', () => {
        it('should get all users (admin only)', async () => {
            console.log('\n--- TEST: getUsers ---');

            const users = [{ name: 'Alice' }, { name: 'Bob' }];
            mockUserService.getUsers.mockResolvedValue(users);
            console.log(`Mock Setup (Service getUsers):`, JSON.stringify(users, null, 2));

            await getUsers(req, res, next);

            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));

            expect(mockAuthorization.assertAdmin).toHaveBeenCalled();
            expect(mockUserService.getUsers).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { users } }));
            console.log('--- TEST PASSED ---');
        });
    });

    describe('getUser', () => {
        it('should get a specific user (verify auth)', async () => {
            console.log('\n--- TEST: getUser ---');
            req.params.id = 'user123';
            console.log(`Input (req.params.id): ${req.params.id}`);

            const user = { _id: 'user123', name: 'Bob' };
            mockUserService.getUser.mockResolvedValue(user);
            console.log(`Mock Setup (Service getUser):`, JSON.stringify(user, null, 2));

            await getUser(req, res, next);

            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));

            expect(mockAuthorization.assertSameUserOrAdmin).toHaveBeenCalledWith('user123', expect.anything(), expect.any(String));
            expect(mockUserService.getUser).toHaveBeenCalledWith('user123');
            expect(res.status).toHaveBeenCalledWith(200);
            console.log('--- TEST PASSED ---');
        });

        it('should handle getUser failure (User not found)', async () => {
            console.log('\n--- TEST: getUser (Not Found) ---');
            req.params.id = 'nonexistent';

            const error = new Error('User not found');
            error.statusCode = 404;
            mockUserService.getUser.mockRejectedValue(error);

            await getUser(req, res, next);

            expect(mockUserService.getUser).toHaveBeenCalledWith('nonexistent');
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'User not found', statusCode: 404 }));
            console.log('--- TEST PASSED ---');
        });
    });

    describe('createUser', () => {
        it('should create user (admin only)', async () => {
            console.log('\n--- TEST: createUser ---');
            req.body = { name: 'Charlie', email: 'charlie@example.com' };
            console.log(`Input (req.body):`, JSON.stringify(req.body, null, 2));

            const newUser = { ...req.body, _id: 'u1' };
            mockUserService.createUser.mockResolvedValue(newUser);
            console.log(`Mock Setup (Service createUser):`, JSON.stringify(newUser, null, 2));

            await createUser(req, res, next);

            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));

            expect(mockAuthorization.assertAdmin).toHaveBeenCalled();
            expect(mockUserService.createUser).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            console.log('--- TEST PASSED ---');
        });

        it('should handle createUser failure (User already exists)', async () => {
            console.log('\n--- TEST: createUser (Already Exists) ---');
            req.body = { name: 'Charlie', email: 'existing@example.com' };

            const error = new Error('User already exists');
            error.statusCode = 400;
            mockUserService.createUser.mockRejectedValue(error);

            await createUser(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'User already exists', statusCode: 400 }));
            console.log('--- TEST PASSED ---');
        });
    });

    describe('updateUser', () => {
        it('should update user (verify auth)', async () => {
            console.log('\n--- TEST: updateUser ---');
            req.params.id = 'user123';
            req.body = { name: 'Bobby' };
            console.log(`Input (req.params.id): ${req.params.id}`);
            console.log(`Input (req.body):`, JSON.stringify(req.body, null, 2));

            const updatedUser = { _id: 'user123', name: 'Bobby' };
            mockUserService.updateUser.mockResolvedValue(updatedUser);
            console.log(`Mock Setup (Service updateUser):`, JSON.stringify(updatedUser, null, 2));

            await updateUser(req, res, next);

            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));

            expect(mockAuthorization.assertSameUserOrAdmin).toHaveBeenCalledWith('user123', expect.anything(), expect.any(String));
            expect(mockUserService.updateUser).toHaveBeenCalledWith('user123', req.body);
            expect(res.status).toHaveBeenCalledWith(200);
            console.log('--- TEST PASSED ---');
        });

        it('should handle updateUser failure (User not found)', async () => {
            console.log('\n--- TEST: updateUser (Not Found) ---');
            req.params.id = 'nonexistent';
            req.body = { name: 'Ghost' };

            const error = new Error('User not found');
            error.statusCode = 404;
            mockUserService.updateUser.mockRejectedValue(error);

            await updateUser(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'User not found', statusCode: 404 }));
            console.log('--- TEST PASSED ---');
        });
    });

    describe('deleteUser', () => {
        it('should delete user (verify auth)', async () => {
            console.log('\n--- TEST: deleteUser ---');
            req.params.id = 'user123';
            console.log(`Input (req.params.id): ${req.params.id}`);

            mockUserService.deleteUser.mockResolvedValue({ deleted: true });

            await deleteUser(req, res, next);

            console.log(`Actual Output (res.json):`, JSON.stringify(res.json.mock.calls[0][0], null, 2));

            expect(mockAuthorization.assertSameUserOrAdmin).toHaveBeenCalledWith('user123', expect.anything(), expect.any(String));
            expect(mockUserService.deleteUser).toHaveBeenCalledWith('user123');
            expect(res.status).toHaveBeenCalledWith(200);
            console.log('--- TEST PASSED ---');
        });

        it('should handle deleteUser failure (User not found)', async () => {
            console.log('\n--- TEST: deleteUser (Not Found) ---');
            req.params.id = 'nonexistent';

            const error = new Error('User not found');
            error.statusCode = 404;
            mockUserService.deleteUser.mockRejectedValue(error);

            await deleteUser(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'User not found', statusCode: 404 }));
            console.log('--- TEST PASSED ---');
        });
    });
});
