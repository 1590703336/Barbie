# Password Reset - Environment Variables Setup

## Development Environment

### 1. Get Ethereal Email Credentials (Free Testing)

Visit: **https://ethereal.email/create**

This will give you test SMTP credentials that you can use for development. Emails won't actually be delivered but you'll get a preview URL to see them.

Example output:
```
Host: smtp.ethereal.email
Port: 587
Username: your-test-username@ethereal.email
Password: your-test-password
```

### 2. Create `.env.development.local`

Create this file in `/apps/backend/` with the following:

```env
# Email Configuration (Ethereal for dev)
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=your-ethereal-username@ethereal.email
EMAIL_PASS=your-ethereal-password
EMAIL_FROM=noreply@subscriptiontracker.dev

# Upstash Redis (Optional in dev - uses in-memory fallback if not set)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Token Expiry (15 minutes in seconds)
PASSWORD_RESET_TOKEN_EXPIRY=900
```

---

## Production Environment

### 1. Setup Upstash Redis (Required for Production)

1. Visit: **https://upstash.com**
2. Create free account
3. Create a new Redis database
4. Copy the REST API credentials:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 2. Setup Email Service (Choose One)

**Option A: SendGrid (Recommended)**
- Visit: https://sendgrid.com
- Free tier: 100 emails/day
- Get API key from Settings → API Keys
- Use: `EMAIL_HOST=smtp.sendgrid.net`, `EMAIL_PORT=587`, `EMAIL_USER=apikey`, `EMAIL_PASS=<your-api-key>`

**Option B: AWS SES**
- Visit: https://aws.amazon.com/ses/
- Verify your domain
- Get SMTP credentials
- Very cost-effective at scale

**Option C: Resend**
- Visit: https://resend.com
- Modern API, developer-friendly
- Free tier: 3,000 emails/month

### 3. Create `.env.production.local`

Create this file in `/apps/backend/` with the following:

```env
# Upstash Redis (Required)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Email Configuration (Production SMTP)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com

# Frontend URL
FRONTEND_URL=https://your-production-domain.com

# Token Expiry (15 minutes)
PASSWORD_RESET_TOKEN_EXPIRY=900
```

---

## Testing the Setup

### Development Testing

1. Start the backend: `npm run dev`
2. Check console for:
   ```
   [EMAIL] Using Ethereal (development) SMTP
   [EMAIL] SMTP server is ready to send emails
   [UPSTASH] Redis credentials not configured. Using in-memory fallback for development.
   ```
3. When you request password reset, check console for email preview URL

### Production Testing

1. Verify environment variables are loaded
2. Check console for:
   ```
   [EMAIL] Using production SMTP
   [EMAIL] SMTP server is ready to send emails
   [UPSTASH] Redis client initialized
   ```
3. Test with a real email address you own
