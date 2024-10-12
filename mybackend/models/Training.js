const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const trainingSchema = new mongoose.Schema({
  name: String,
  description: String,
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner',
  },
  points: Number,
  languages: [String],
  types: [String],
  status: { type: String, default: 'Live' },
  startDate: Date,
  endDate: Date,
  image: String,
  repositoryLink: String,
  trainingDetails: String,
  howToGuide: String,
  scope: String,
  starterCode: String,
  judges: {
    judges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  submissions: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      codeLink: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  tests: [
    {
      input: String,
      expectedOutput: String,
    },
  ],
  hints: [String],
});

trainingSchema.index({ name: 1, difficulty: 1 });

const encryptedFields = [
  'starterCode',
  'submissions.codeLink',
  'tests.input',
  'tests.expectedOutput',
];

// Add encryption to the schema
trainingSchema.plugin(encrypt, {
  secret: process.env.ENCRYPTION_KEY,
  encryptedFields: encryptedFields,
});

const Training = mongoose.model('Training', trainingSchema);

module.exports = Training;
