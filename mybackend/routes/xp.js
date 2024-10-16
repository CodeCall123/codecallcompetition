const express = require('express');
const XPController = require('../controller/xp');
const verifyAuth = require('../middleware/verifyAuth');

const router = express.Router();
const xpController = new XPController();

router.post('/awardXP', verifyAuth, xpController.awardXP);

module.exports = router