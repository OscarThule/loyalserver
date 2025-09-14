import express from 'express';
import { 
  register, 
  login,
  registerBiometric,
  getProfile
} from '../controllers/auth.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get user profile - fixed by removing duplicate middleware
router.get('/profile', auth, getProfile);

// Register biometric auth
router.post('/biometric', auth, registerBiometric);
  
export default router;  