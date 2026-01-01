import { jest } from '@jest/globals';
import { assertAdmin, assertOwnerOrAdmin, assertSameUserOrAdmin } from '../src/utils/authorization.js';

describe('Authorization Utils', () => {

    describe('assertAdmin', () => {
        it('should allow admin', () => {
            console.log('\n--- TEST: assertAdmin (Success) ---');
            const requester = { role: 'admin' };
            console.log(`Input (requester):`, JSON.stringify(requester, null, 2));

            expect(() => assertAdmin(requester)).not.toThrow();
            console.log('--- TEST PASSED: No error thrown ---');
        });

        it('should deny non-admin', () => {
            console.log('\n--- TEST: assertAdmin (Failure) ---');
            const requester = { role: 'user' };
            console.log(`Input (requester):`, JSON.stringify(requester, null, 2));

            expect(() => assertAdmin(requester)).toThrow("You are not authorized to perform this action");
            console.log('--- TEST PASSED: Error 403 thrown ---');
        });
    });

    describe('assertOwnerOrAdmin', () => {
        it('should allow admin regardless of owner', () => {
            console.log('\n--- TEST: assertOwnerOrAdmin (Admin) ---');
            const ownerId = 'user1';
            const requester = { role: 'admin', id: 'admin1' };
            console.log(`Input: Owner=${ownerId}, Requester=${JSON.stringify(requester)}`);

            expect(() => assertOwnerOrAdmin(ownerId, requester)).not.toThrow();
            console.log('--- TEST PASSED: Admin allowed ---');
        });

        it('should allow owner', () => {
            console.log('\n--- TEST: assertOwnerOrAdmin (Owner) ---');
            const ownerId = 'user1';
            const requester = { role: 'user', id: 'user1' };
            console.log(`Input: Owner=${ownerId}, Requester=${JSON.stringify(requester)}`);

            expect(() => assertOwnerOrAdmin(ownerId, requester)).not.toThrow();
            console.log('--- TEST PASSED: Owner allowed ---');
        });

        it('should deny non-owner', () => {
            console.log('\n--- TEST: assertOwnerOrAdmin (Non-Owner) ---');
            const ownerId = 'user1';
            const requester = { role: 'user', id: 'user2' };
            console.log(`Input: Owner=${ownerId}, Requester=${JSON.stringify(requester)}`);

            expect(() => assertOwnerOrAdmin(ownerId, requester)).toThrow("You are not authorized to access this resource");
            console.log('--- TEST PASSED: Non-owner denied ---');
        });
    });

    describe('assertSameUserOrAdmin', () => {
        it('should allow admin', () => {
            console.log('\n--- TEST: assertSameUserOrAdmin (Admin) ---');
            const targetId = 'user1';
            const requester = { role: 'admin' };
            expect(() => assertSameUserOrAdmin(targetId, requester)).not.toThrow();
            console.log('--- TEST PASSED ---');
        });

        it('should allow same user', () => {
            console.log('\n--- TEST: assertSameUserOrAdmin (Same User) ---');
            const targetId = 'user1';
            const requester = { role: 'user', id: 'user1' };
            console.log(`Input: Target=${targetId}, Requester=${requester.id}`);

            expect(() => assertSameUserOrAdmin(targetId, requester)).not.toThrow();
            console.log('--- TEST PASSED ---');
        });

        it('should deny different user', () => {
            console.log('\n--- TEST: assertSameUserOrAdmin (Diff User) ---');
            const targetId = 'user1';
            const requester = { role: 'user', id: 'user2' };
            console.log(`Input: Target=${targetId}, Requester=${requester.id}`);

            expect(() => assertSameUserOrAdmin(targetId, requester)).toThrow();
            console.log('--- TEST PASSED: Denied ---');
        });
    });
});
