// Set the encryption key before importing the module under test.
process.env.TELEGRAM_BOT_ENCRYPTION_KEY =
    '5a2d4a9acd6557dc3ce37709c95e7733116e6384cf14a6d9ea73c3322c332637';

const { encryptToken, decryptToken, maskToken } = await import(
    '../src/modules/telegramBot/crypto.js'
);

describe('telegramBot/crypto', () => {
    it('round-trips a bot token', () => {
        const token = '123456789:ABCDEFGHijklMNOPQRSTuvwxYZ-1234567';
        const enc = encryptToken(token);
        expect(enc).not.toContain(token);
        expect(enc.split(':')).toHaveLength(3);
        expect(decryptToken(enc)).toBe(token);
    });

    it('produces a different ciphertext per call (random IV)', () => {
        const token = 'plaintext-token-value';
        expect(encryptToken(token)).not.toBe(encryptToken(token));
    });

    it('rejects tampered ciphertext', () => {
        const enc = encryptToken('hello world');
        const [iv, tag, ct] = enc.split(':');
        const tamperedCt = ct.replace(/.$/, ct.endsWith('a') ? 'b' : 'a');
        expect(() => decryptToken(`${iv}:${tag}:${tamperedCt}`)).toThrow();
    });

    it('rejects malformed payloads', () => {
        expect(() => decryptToken('not-encrypted')).toThrow();
    });

    it('maskToken keeps the last four characters', () => {
        expect(maskToken('123456789:abcdefghij1234')).toBe('••••1234');
        expect(maskToken('')).toBe('');
    });
});
