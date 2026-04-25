import { subscriptionSchema, subscriptionUpdateSchema } from '../src/modules/subscription/subscription.validation.js';

const validBase = {
    name: 'Netflix',
    price: 15.99,
    currency: 'USD',
    frequency: 'monthly',
    category: 'Entertainment',
    startDate: '2026-01-01',
    paymentMethod: 'card',
};

describe('subscriptionSchema (create)', () => {
    it('accepts a valid payload', () => {
        const { error } = subscriptionSchema.validate(validBase);
        expect(error).toBeUndefined();
    });

    it('rejects an unknown user field (mass-assignment guard)', () => {
        const { error } = subscriptionSchema.validate({
            ...validBase,
            user: '507f1f77bcf86cd799439011',
        });
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('user');
    });
});

describe('subscriptionUpdateSchema (PUT)', () => {
    it('accepts a partial update with a single field', () => {
        const { error } = subscriptionUpdateSchema.validate({ name: 'New Name' });
        expect(error).toBeUndefined();
    });

    it('accepts an update with several optional fields', () => {
        const { error } = subscriptionUpdateSchema.validate({
            price: 9.99,
            currency: 'EUR',
            notes: 'cheaper plan',
        });
        expect(error).toBeUndefined();
    });

    it('rejects an empty body', () => {
        const { error } = subscriptionUpdateSchema.validate({});
        expect(error).toBeDefined();
    });

    it('rejects a user field (cannot reassign ownership)', () => {
        const { error } = subscriptionUpdateSchema.validate({
            name: 'New Name',
            user: '507f1f77bcf86cd799439011',
        });
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('user');
    });

    it('rejects unknown fields', () => {
        const { error } = subscriptionUpdateSchema.validate({
            name: 'New Name',
            isAdmin: true,
        });
        expect(error).toBeDefined();
    });

    it('rejects an invalid currency code', () => {
        const { error } = subscriptionUpdateSchema.validate({ currency: 'usd' });
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('currency');
    });

    it('rejects an invalid frequency', () => {
        const { error } = subscriptionUpdateSchema.validate({ frequency: 'biweekly' });
        expect(error).toBeDefined();
    });

    it('rejects a negative price', () => {
        const { error } = subscriptionUpdateSchema.validate({ price: -1 });
        expect(error).toBeDefined();
    });

    it('allows updating only renewalDate', () => {
        const { error } = subscriptionUpdateSchema.validate({ renewalDate: '2026-12-31' });
        expect(error).toBeUndefined();
    });
});
