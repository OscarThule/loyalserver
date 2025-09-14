import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { validateEmail } from '../utils/validators.js';

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const sanitizeUser = (user) => {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    username: user.username,
    role: user.role,
    profilePicture: user.profilePicture,
    bio: user.bio,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

export const register = async (req, res) => {
  try {
    const { email, password, name, username } = req.body;

    // Validate input
    if (!email || !password || !name || !username) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        required: ['email', 'password', 'name', 'username'],
        received: { email, name, username }
      });
    }

    // Validate email format
    try {
      validateEmail(email);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: error.message
      });
    }

    // Check for existing user (case-insensitive)
    const existingUser = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
        { username: { $regex: new RegExp(`^${username}$`, 'i') } }
      ]
    });

    if (existingUser) {
      const conflict = existingUser.email.toLowerCase() === email.toLowerCase() 
        ? 'email' 
        : 'username';
      return res.status(409).json({
        success: false,
        message: 'User already exists',
        conflict
      });
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      username: username.toLowerCase().trim(),
      role: 'user'
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user)
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user with password (case-insensitive)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: sanitizeUser(user)
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    // Find user without sensitive data
    const user = await User.findById(req.userId)
      .select('-password -__v -biometricPublicKey');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      user: sanitizeUser(user)
    });

  } catch (error) {
    console.error('Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const registerBiometric = async (req, res) => {
  try {
    const { publicKey } = req.body;

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        message: 'Public key is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { biometricPublicKey: publicKey },
      { new: true, select: '-password -__v' }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      message: 'Biometric registered successfully',
      user: sanitizeUser(user)
    });

  } catch (error) {
    console.error('Biometric Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Biometric registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};