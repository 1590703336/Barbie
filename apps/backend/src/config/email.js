import nodemailer from 'nodemailer';
import { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, NODE_ENV } from './env.js';

let transporter;

if (NODE_ENV === 'development') {
    // Development: Use Ethereal (fake SMTP for testing)
    // Get test account at https://ethereal.email/create
    transporter = nodemailer.createTransport({
        host: EMAIL_HOST || 'smtp.ethereal.email',
        port: EMAIL_PORT || 587,
        auth: {
            user: EMAIL_USER || 'ethereal-test@ethereal.email',
            pass: EMAIL_PASS || 'ethereal-password',
        },
    });
    console.log('[EMAIL] Using Ethereal (development) SMTP');
} else {
    // Production: Use real SMTP
    if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
        console.error('[EMAIL] Production email credentials not configured!');
    }

    transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT || 587,
        secure: EMAIL_PORT === '465', // true for 465, false for other ports
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
    });
    console.log('[EMAIL] Using production SMTP');
}

// Verify connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('[EMAIL] SMTP connection failed:', error.message);
    } else {
        console.log('[EMAIL] SMTP server is ready to send emails');
    }
});

export default transporter;
