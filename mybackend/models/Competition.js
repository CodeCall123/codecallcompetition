const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const competitionSchema = new mongoose.Schema({
  name: String,
  description: String,
  status: { type: String, default: 'Live' },
  reward: Number,
  rewards: {
    feature: Number,
    bug: Number,
    optimization: Number,
    security: Number,
  },
  points: Number, // XP points for the competition
  languages: [String], // Programming languages for the competition
  types: [String], // Types of submissions (Feature, Bug, Optimization, etc.)
  endDate: Date, // End date of the competition
  startDate: Date, // Start date of the competition
  image: String, // Image link for competition
  websiteLink: String, // Link to the competition website
  repositoryLink: String, // Link to the repository for submissions
  competitionDetails: String, // Detailed description of the competition
  howToGuide: String, // Guide on how to participate
  scope: String, // Scope of the competition
  judges: {
    // Judges for the competition
    leadJudge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    judges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  submissions: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      submissionType: {
        type: String,
        enum: ['Feature', 'Bug', 'Optimization', 'Security'],
      },
      codeLink: String,
      timestamp: { type: Date, default: Date.now },
      approved: { type: Boolean, default: false },
      payout: { type: Number, default: 0 },
    },
  ],
});

// add indexes
competitionSchema.index({
  name: 1,
  status: 1,
  'submissions.userId': 1,
  'submissions.submissionType': 1,
});

const encryptedFields = ['submissions.codeLink'];

// Add encryption to the schema
competitionSchema.plugin(encrypt, {
  secret: process.env.ENCRYPTION_KEY,
  encryptedFields: encryptedFields,
});

const Competition = mongoose.model('Competition', competitionSchema);

module.exports = Competition;
