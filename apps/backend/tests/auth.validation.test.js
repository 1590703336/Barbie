import { signUpSchema, signInSchema } from '../src/modules/auth/auth.validation.js';

describe('Auth Validation Schemas', () => {
    describe('signUpSchema', () => {
        describe('defaultCurrency field', () => {
            it('should accept valid 3-letter currency codes', () => {
                const validCurrencies = ['USD', 'EUR', 'CNY', 'AUD', 'GBP', 'JPY', 'CAD', 'CHF', 'INR', 'KRW'];

                for (const currency of validCurrencies) {
                    const { error } = signUpSchema.validate({
                        name: 'Test User',
                        email: 'test@example.com',
                        password: 'password123',
                        defaultCurrency: currency
                    });

                    expect(error).toBeUndefined();
                }
            });

            it('should reject invalid currency codes (lowercase)', () => {
                const { error } = signUpSchema.validate({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    defaultCurrency: 'usd'
                });

                expect(error).toBeDefined();
                expect(error.details[0].message).toContain('pattern');
            });

            it('should reject invalid currency codes (too short)', () => {
                const { error } = signUpSchema.validate({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    defaultCurrency: 'US'
                });

                expect(error).toBeDefined();
            });

            it('should reject invalid currency codes (too long)', () => {
                const { error } = signUpSchema.validate({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    defaultCurrency: 'USDD'
                });

                expect(error).toBeDefined();
            });

            it('should reject invalid currency codes (with numbers)', () => {
                const { error } = signUpSchema.validate({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    defaultCurrency: 'US1'
                });

                expect(error).toBeDefined();
            });

            it('should allow missing defaultCurrency (optional field)', () => {
                const { error } = signUpSchema.validate({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });

                expect(error).toBeUndefined();
            });
        });

        describe('other required fields', () => {
            it('should validate complete signup data', () => {
                const { error, value } = signUpSchema.validate({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    defaultCurrency: 'EUR'
                });

                expect(error).toBeUndefined();
                expect(value.name).toBe('Test User');
                expect(value.email).toBe('test@example.com');
                expect(value.defaultCurrency).toBe('EUR');
            });

            it('should reject missing name', () => {
                const { error } = signUpSchema.validate({
                    email: 'test@example.com',
                    password: 'password123'
                });

                expect(error).toBeDefined();
                expect(error.details[0].path).toContain('name');
            });

            it('should reject missing email', () => {
                const { error } = signUpSchema.validate({
                    name: 'Test User',
                    password: 'password123'
                });

                expect(error).toBeDefined();
                expect(error.details[0].path).toContain('email');
            });

            it('should reject missing password', () => {
                const { error } = signUpSchema.validate({
                    name: 'Test User',
                    email: 'test@example.com'
                });

                expect(error).toBeDefined();
                expect(error.details[0].path).toContain('password');
            });
        });
    });

    describe('signInSchema', () => {
        it('should validate complete signin data', () => {
            const { error } = signInSchema.validate({
                email: 'test@example.com',
                password: 'password123'
            });

            expect(error).toBeUndefined();
        });

        it('should reject missing email', () => {
            const { error } = signInSchema.validate({
                password: 'password123'
            });

            expect(error).toBeDefined();
        });

        it('should reject missing password', () => {
            const { error } = signInSchema.validate({
                email: 'test@example.com'
            });

            expect(error).toBeDefined();
        });
    });
});
