import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  register,
  login,
  demoLogin,
  logout,
  me,
  forgotPassword,
  resetPassword,
  deleteAccount,
} from '../controllers/authController.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/demo', authLimiter, demoLogin);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.delete('/account', requireAuth, deleteAccount);

export default router;
