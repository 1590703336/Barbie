import { Router } from 'express';
import { signUp, signIn, signOut } from './auth.controller.js';
import { forgotPassword, resetPassword, verifyResetToken } from './passwordReset.controller.js';
import validate from '../../middlewares/validate.middleware.js';
import { signUpSchema, signInSchema } from './auth.validation.js';
import { forgotPasswordSchema, resetPasswordSchema } from './passwordReset.validation.js';

const authRouter = Router();

// Existing auth routes
authRouter.post('/sign-up', validate(signUpSchema), signUp);
authRouter.post('/sign-in', validate(signInSchema), signIn);
authRouter.post('/sign-out', signOut);

// Password reset routes
authRouter.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
authRouter.post('/reset-password', validate(resetPasswordSchema), resetPassword);
authRouter.get('/verify-reset-token/:token', verifyResetToken);

export default authRouter;

