const express = require('express');
const AuthController  = require('../controller/auth');

const router = express.Router();
const authController = new AuthController();

router.post('/authenticate', authController.authenticate);

module.exports = router;