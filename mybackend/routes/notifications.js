const express = require('express');
const NotificationController = require('../controller/notification');

const router = express.Router();

const notificationController = new NotificationController();

// add auth middleware
router.get("/notifications/unread/:username", notificationController.getUnreadNotifications);
router.patch("/notifications/read/:username", notificationController.markNotificationAsRead);


module.exports = router;