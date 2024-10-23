// User model (User.js)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  avatar: String,
  email: {
    type: String,
    unique: true
  },
  github: String,
  totalEarnings: Number,
  xp: Number,
  Features: Number,
  Bugs: Number,
  Optimisations: Number,
  walletAddress: String,
  discord: String,
  telegram: String,
  twitter: String,
  linkedin: String,
  bio: String,
  completedTasks: [{ taskId: Number, trainingId: mongoose.Schema.Types.ObjectId }],
  
  approvedSubmissions: [{
    competitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition' },
    submissionType: { type: String, enum: ['Feature', 'Optimization', 'Bug'] },
    payout: Number
  }]
});

const User = mongoose.model('User', userSchema);
module.exports = User;
