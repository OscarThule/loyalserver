import User from '#models/User.js';

export const saveUser = async (req, res) => {
  try {
    const { email, uid, token, name, username, role } = req.body;

    let user = await User.findOne({ $or: [{ email }, { uid }, { username }] });
    
    if (!user) {
      user = new User({
        email,
        uid,
        token,
        name,
        username,
        role: role || 'user'
      });
      await user.save();
    }

    // Return user data without sensitive info
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      username: user.username,
      role: user.role
    };

    res.status(200).json(userData);
  } catch (error) {
    console.error('Save user error:', error);
    res.status(500).json({ message: 'Failed to save user', error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password -biometricPublicKey');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user', error: error.message });
  }
};