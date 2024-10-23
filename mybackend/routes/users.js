const express = require('express');
const UserController = require('../controller/users');
const verifyAuth = require('../middleware/verifyAuth');

const router = express.Router();

const userController = new UserController();

router.get('/users/:username', userController.getUser);
router.put('/users/:username', verifyAuth, userController.updateUserData);
router.get('/users/can-update/:username', verifyAuth, userController.canUpdateThisProfile);
router.get('/users/:username/usdc-balance', verifyAuth, userController.fetchUSDCBalance);
// move it later
router.get('/leaderboard', userController.fetchLeaderboard);

module.exports = router;