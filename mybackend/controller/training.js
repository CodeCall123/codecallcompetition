const Training = require("../models/Training");

class TrainingController {

    trainingModules = async (req, res) => {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        try {

            const modules = await Training.find({}).limit(limit).skip(skip);

            if (modules.length < 1) {
                return res.json({
                    message: "Training modules not available at this moment",
                    modules: []
                })
            };

            const totalModules = await Training.countDocuments();

            return res.json({
                message: "OK",
                metaData: {
                    totalModules,
                    totalPages: Math.ceil(totalModules / limit),
                    currentPage: page,
                    limit
                },
                modules
            })

        } catch (error) {
            console.error('Error fetching training modules', error.message);
            res.status(500).json({ message: error.message });
        }
    }

    fetchTrainingModule = async (req, res) => {
        try {
            const trainingModule = await Training.findById(req.params.id);
            if (!trainingModule) {
                return res.status(404).json({ message: 'Training module not found' });
            }
            res.status(200).json(trainingModule);
        } catch (error) {
            console.error('Error fetching training module', error.message);
            res.status(500).json({ message: error.message });
        }
    }

    submitTrainingModuleWork = async (req, res) => {
        const { id } = req.params;
        const { userId, codeLink } = req.body;

        try {
            const trainingModule = await Training.findById(id);
            if (!trainingModule) {
                return res.status(404).json({ message: 'Training module not found' });
            }

            trainingModule.submissions.push({ userId, codeLink, timestamp: new Date() });
            await trainingModule.save();

            res.status(200).json({ message: 'Submission added successfully' });
        } catch (error) {
            console.error('Error submitting work:', error.message);
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = TrainingController;