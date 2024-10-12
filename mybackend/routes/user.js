// routes/user.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const redisClient = require('../redis');
const User = require('../models/User');
const {
  getUSDCBalance,
  getUserDataByUsername,
  updateUserDataByUsername,
} = require('../controllers/userController');

// Endpoint to fetch user data
router.get('/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const cachedUser = await redisClient.get(`user:${username}`);
    if (cachedUser) {
      return res.status(200).json(JSON.parse(cachedUser));
    }

    const userData = await getUserDataByUsername(username);
    await redisClient.setEx(`user:${username}`, 60, JSON.stringify(userData));

    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint to update user data
router.put(
  '/:username',
  body('email').isEmail().normalizeEmail(),
  body('discord').optional().isString().trim().escape(),
  body('telegram').optional().isString().trim().escape(),
  body('twitter').optional().isString().trim().escape(),
  body('linkedin').optional().isString().trim().escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username } = req.params;
    const updateData = req.body;

    try {
      const updatedUserData = await updateUserDataByUsername(
        username,
        updateData
      );
      await redisClient.del(`user:${username}`);
      res.status(200).json(updatedUserData);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Endpoint to fetch USDC balance
router.get('/:username/usdc-balance', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const balance = await getUSDCBalance(user.walletAddress);
    res
      .status(200)
      .json({ walletAddress: user.walletAddress, usdcBalance: balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
