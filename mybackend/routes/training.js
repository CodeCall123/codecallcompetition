const express = require('express');
const router = express.Router();
const Training = require('../models/Training');
const { body, param, validationResult } = require('express-validator');
const redisClient = require('../redis');

const cacheKey = 'trainingModules';

const clearCache = (key) => {
  redisClient.del(key, (err) => {
    if (err) console.error('Error clearing cache: ', err);
  });
};

// Endpoint to fetch all training modules
router.get('/', async (req, res) => {
  try {
    const cachedTrainingModules = await redisClient.get(cacheKey);
    if (cachedTrainingModules) {
      return res.status(200).json(JSON.parse(cachedTrainingModules));
    }

    const trainingModules = await Training.find();
    console.log('Fetched training modules:', trainingModules);

    redisClient.setEx(cacheKey, 3600, JSON.stringify(trainingModules));

    res.status(200).json(trainingModules);
  } catch (error) {
    console.error('Error fetching training modules:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint to fetch a training module by ID
router.get('/:id', async (req, res) => {
  try {
    const cachedTrainingModule = await redisClient.get(cacheKey);
    if (cachedTrainingModule) {
      return res.status(200).json(JSON.parse(cachedTrainingModule));
    }

    const trainingModule = await Training.findById(req.params.id);
    if (!trainingModule) {
      return res.status(404).json({ message: 'Training module not found' });
    }

    redisClient.setEx(cacheKey, 3600, JSON.stringify(trainingModule));

    res.status(200).json(trainingModule);
  } catch (error) {
    console.error('Error fetching training module:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint to submit work for a training module
router.post(
  '/:id/submit',
  // Validate and sanitize inputs
  param('id').isMongoId(),
  body('userId').isMongoId(),
  body('codeLink').isURL().trim().escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { userId, codeLink } = req.body;

    try {
      const trainingModule = await Training.findById(id);
      if (!trainingModule) {
        return res.status(404).json({ message: 'Training module not found' });
      }

      trainingModule.submissions.push({
        userId,
        codeLink,
        timestamp: new Date(),
      });
      await trainingModule.save();

      clearCache(`trainingModule_${id}`);

      res.status(200).json({ message: 'Submission added successfully' });
    } catch (error) {
      console.error('Error submitting work:', error.message);
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
