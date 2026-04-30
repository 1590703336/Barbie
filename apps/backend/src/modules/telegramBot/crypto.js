import crypto from 'crypto';
import { TELEGRAM_BOT_ENCRYPTION_KEY } from '../../config/env.js';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;

const getKey = () => {
    if (!TELEGRAM_BOT_ENCRYPTION_KEY) {
        throw new Error('TELEGRAM_BOT_ENCRYPTION_KEY is not configured');
    }
    const buf = Buffer.from(TELEGRAM_BOT_ENCRYPTION_KEY, 'hex');
    if (buf.length !== 32) {
        throw new Error('TELEGRAM_BOT_ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
    }
    return buf;
};

export const encryptToken = (plaintext) => {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decryptToken = (payload) => {
    const key = getKey();
    const parts = payload.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted token format');
    }
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
};

export const maskToken = (plaintext) => {
    if (!plaintext) return '';
    const last = plaintext.slice(-4);
    return `••••${last}`;
};
