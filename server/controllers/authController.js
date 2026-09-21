import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Please provide name, email, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        message: 'User already exists with this email',
      });
    }

    // Create user (password is automatically hashed by pre-save hook in User model)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
    });

    // Generate JWT
    const token = generateToken(user._id);

    // Return response without password
    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(`[Register Error]: ${error.message}`);
    return res.status(500).json({
      message: error.message || 'Server error during registration',
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide both email and password',
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Verify user exists and password matches
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // Generate JWT
    const token = generateToken(user._id);

    // Return response without password
    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(`[Login Error]: ${error.message}`);
    return res.status(500).json({
      message: error.message || 'Server error during login',
    });
  }
};

/**
 * @desc    Get logged in user profile
 * @route   GET /api/auth/me
 * @access  Private (Protected by authMiddleware)
 */
export const getCurrentUser = async (req, res) => {
  try {
    // req.user.id was attached by the protect middleware
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error(`[GetCurrentUser Error]: ${error.message}`);
    return res.status(500).json({
      message: error.message || 'Server error fetching user profile',
    });
  }
};
