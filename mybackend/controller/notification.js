class NotificationController {

    getUnreadNotifications = async (req, res) => {
        const { username } = req.params;
        if (username !== req.user.username) {
            return res.status(409).json({
                message: "Cannot get notifications"
            })
        }

        try {

            const user = await User.findOne({ username });

            if (!user) {
                return res.status(404).json({
                    message: "User not found"
                });
            };

            const unread_notifications = await Notification.find({ user: user._id, read: false });

            if (unread_notifications.length < 1) {
                return res.json({
                    message: "No new notifications"
                });
            };

            return res.json({
                message: "OK",
                totalUnreadNotifications: unread_notifications.length,
                notifications: unread_notifications
            })

        } catch (error) {
            console.log("error while getting notifications");
        }
    }

    markNotificationAsRead = async (req, res) => {

        const { username } = req.params;
        if (username !== req.user.username) {
            return res.status(409).json({
                message: "Cannot get notifications"
            })
        }

        const { notificationId } = req.body;

        try {

            const user = await User.findOne({ username });

            if (!user) {
                return res.status(404).json({
                    message: "User not found"
                });
            };

            const unread_notification = await Notification.findOne({ _id: notificationId, read: false });

            unread_notification.read = true;

            return res.json({
                message: "Notification marked as read"
            })

        } catch (error) {
            console.log("Error while marking notification as read", error);
        }
    }
};

module.exports = NotificationController;