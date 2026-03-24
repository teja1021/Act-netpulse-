'use strict';
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/user.model');

exports.login = async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password)
      return res.status(400).json({ success: false, message: 'userId and password are required' });

    const user = await User.findOne({ userId: userId.toUpperCase().trim() });
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.userId, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: { userId: user.userId, name: user.name, email: user.email, plan: user.plan }
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
