import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import { validateEmail } from './utils/validators.js';

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const formatUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  username: user.username,
  role: user.role,
  profilePicture: user.profilePicture,
  bio: user.bio,
  createdAt: user.createdAt
});

export const register = async (req, res) => {
  try {
    const { email, password, name, username } = req.body;

    if (!email || !password || !name || !username) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    try {
      validateEmail(email);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

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

    const user = new User({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      username: username.toLowerCase().trim()
    });

    await user.save();
    const token = generateToken(user._id);
    console.log("Generated token (register):bearer", token); // <-- Add this

    return res.status(201).json({
      success: true,
      token,
      user: formatUserResponse(user)
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

    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);
    console.log("Generated token (login):bearer",  token); // <-- Add this
    return res.json({
      success: true,
      token,
      user: formatUserResponse(user)
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
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      user: formatUserResponse(user)
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
      { new: true }
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
      user: formatUserResponse(user)
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