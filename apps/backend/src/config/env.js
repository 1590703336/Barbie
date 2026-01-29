import { config } from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = `.env.${process.env.NODE_ENV || 'development'}.local`;
config({ path: path.resolve(process.cwd(), envFile) });

console.log(`[CONFIG] Loading from: ${path.resolve(process.cwd(), envFile)}`);
console.log(`[CONFIG] FRONTEND_URL: ${process.env.FRONTEND_URL || 'MISSING'}`);


export const {
    PORT,
    NODE_ENV,
    DB_URI,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    ARCJET_KEY,
    ARCJET_ENV,
    // Password Reset & Email
    UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN,
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_FROM,
    FRONTEND_URL,
    PASSWORD_RESET_TOKEN_EXPIRY
} = process.env;