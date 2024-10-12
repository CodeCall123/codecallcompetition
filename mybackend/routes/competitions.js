const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, param, validationResult } = require('express-validator');
const redisClient = require('../redis');

const checkRole = require('../middleware/checkRole');
const Competition = require('../models/Competition');
const User = require('../models/User');

const cacheKey = 'competitionsModules';

const clearCache = (key) => {
  redisClient.del(key, (err) => {
    if (err) console.error('Error clearing cache: ', err);
  });
};

//push
router.get('/', async (req, res) => {
  try {
    const cachedCompetitions = await redisClient.get(cacheKey);
    if (cachedCompetitions) {
      return res.status(200).json(JSON.parse(cachedCompetitions));
    }

    const competitions = await Competition.find(
      {},
      'name description status reward points image languages types startDate endDate'
    );

    redisClient.setEx(cacheKey, 3600, JSON.stringify(competitions));

    res.status(200).json(competitions);
  } catch (error) {
    console.error('Error fetching competitions:', error.message);
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cachedCompetition = await redisClient.get(cacheKey);
    if (cachedCompetition) {
      return res.status(200).json(JSON.parse(cachedCompetition));
    }

    const competition = await Competition.findById(req.params.id)
      .populate('judges.leadJudge')
      .populate('judges.judges');
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    redisClient.setEx(cacheKey, 3600, JSON.stringify(competition));

    res.status(200).json(competition);
  } catch (error) {
    console.error('Error fetching competition details:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint to assign judge role to the current user
router.post(
  '/:id/becomeJudge',
  // Validate and sanitize inputs
  param('id').isMongoId(),
  body('username').isString().trim().escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { username } = req.body;

    try {
      const competition = await Competition.findById(id);
      if (!competition) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Ensure the user is not already a judge or lead judge
      const isJudge = competition.judges.judges.some((judge) =>
        judge.equals(user._id)
      );
      const isLeadJudge =
        competition.judges.leadJudge &&
        competition.judges.leadJudge.equals(user._id);

      if (isJudge || isLeadJudge) {
        return res
          .status(400)
          .json({ message: 'User is already a reviewer or lead reviewer' });
      }

      // Assign the user as a judge
      competition.judges.judges.push(user._id);
      await competition.save();

      clearCache(`competition_${id}`);

      // Add the user to the GitHub team
      const teamSlug = `judge-repo1`;
      const org = process.env.GITHUB_ORG;
      const githubToken = process.env.GITHUB_ADMIN_TOKEN;

      await axios.put(
        `https://api.github.com/orgs/${org}/teams/${teamSlug}/memberships/${username}`,
        {},
        {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      res.status(200).json(competition);
    } catch (error) {
      console.error('Error assigning judge role:', error.message);
      res.status(500).json({ message: error.message });
    }
  }
);

// Endpoint to approve and merge PR
router.post(
  '/:id/mergePR',
  checkRole('judge'),
  // Validate and sanitize inputs
  param('id').isMongoId(),
  body('prNumber').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { prNumber } = req.body;

    try {
      const competition = await Competition.findById(id);
      if (!competition) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const repoUrl = new URL(competition.repositoryLink).pathname.substring(1);
      const prResponse = await axios.get(
        `https://api.github.com/repos/${repoUrl}/pulls/${prNumber}`,
        {
          headers: {
            Authorization: `token ${process.env.GITHUB_ADMIN_TOKEN}`,
          },
        }
      );

      const {
        labels,
        user: { login },
      } = prResponse.data;
      const user = await User.findOne({ username: login });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      let reward = 0;
      let updateData = {};

      if (labels.some((label) => label.name.toLowerCase() === 'feature')) {
        reward = competition.rewards.feature;
        updateData = { $inc: { totalEarnings: reward, Features: 1 } };
      } else if (labels.some((label) => label.name.toLowerCase() === 'bug')) {
        reward = competition.rewards.bug;
        updateData = { $inc: { totalEarnings: reward, Bugs: 1 } };
      } else if (
        labels.some((label) => label.name.toLowerCase() === 'optimization')
      ) {
        reward = competition.rewards.optimization;
        updateData = { $inc: { totalEarnings: reward, Optimisations: 1 } };
      } else if (
        labels.some((label) => label.name.toLowerCase() === 'security')
      ) {
        reward = competition.rewards.security;
        updateData = { $inc: { totalEarnings: reward } };
      }

      await axios.put(
        `https://api.github.com/repos/${repoUrl}/pulls/${prNumber}/merge`,
        {},
        {
          headers: {
            Authorization: `token ${process.env.GITHUB_ADMIN_TOKEN}`,
          },
        }
      );

      await User.findByIdAndUpdate(user._id, updateData);

      res.status(200).json({ message: 'PR merged and user earnings updated' });
    } catch (error) {
      console.error('Error merging PR:', error.message);
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
