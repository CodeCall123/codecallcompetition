const User = require('../models/User');
const Training = require('../models/Training');

class XPController {

    awardXP = async (req, res) => {
        const { username, taskId, trainingId } = req.body;
        try {
            const user = await User.findOne({ username });
            const training = await Training.findById(trainingId);

            if (!user || !training) {
                return res.status(404).json({ message: 'User or Training not found' });
            }

            const taskCompleted = user.completedTasks.some(
                (task) => task.taskId === taskId && task.trainingId.equals(trainingId)
            );

            if (taskCompleted) {
                return res.status(200).json({ success: false, message: 'Task already completed' });
            }

            let awardedXP = 0;
            switch (taskId) {
                case 1:
                    awardedXP = Math.round(training.points * 0.05);
                    break;
                case 2:
                    awardedXP = Math.round(training.points * 0.1);
                    break;

                default:
                    return res.status(400).json({ message: 'Invalid task ID' });
            }

            user.xp += awardedXP;
            user.completedTasks.push({ taskId, trainingId });
            await user.save();

            res.status(200).json({ success: true, awardedXP, message: `XP awarded for Task ${taskId}` });
        } catch (error) {
            console.error('Error awarding XP:', error.message);
            res.status(500).json({ success: false, message: 'Error awarding XP', error: error.message });
        }
    }

};

module.exports = XPController;