const mongoose = require('mongoose');
const User = require('./User');
const Notification = require('./Notification');

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
  points: Number,  // XP points for the competition
  languages: [String],  // Programming languages for the competition
  types: [String],  // Types of submissions (Feature, Bug, Optimization, etc.)
  endDate: Date,    // End date of the competition
  startDate: Date,  // Start date of the competition
  image: String,    // Image link for competition
  websiteLink: String,  // Link to the competition website
  repositoryLink: String,  // Link to the repository for submissions
  competitionDetails: String,  // Detailed description of the competition
  howToGuide: String,  // Guide on how to participate
  scope: String,  // Scope of the competition
  judges: {       // Judges for the competition
    leadJudge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    judges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  submissions: [   
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      submissionType: { type: String, enum: ['Feature', 'Bug', 'Optimization', 'Security'] },  
      codeLink: String,  
      timestamp: { type: Date, default: Date.now },  
      approved: { type: Boolean, default: false }, 
      payout: { type: Number, default: 0 }  
    }
  ]
});

competitionSchema.post('save', async function (document) {

  if(this.isModified('status')) {

    // optimize it later
    const users = await User.find({'approvedSubmissions.competitionId': document._id});
    const status_updated_message = `Competition ${document.name}'s status changed to ${document.status}`;

    users.forEach( async (user) => {
      await Notification.create({message: status_updated_message, user: user._id });
    });
  }

});

competitionSchema.post('save', async function (document) {
  document.submissions.forEach( async (sub) => {
    if(sub.approved) {

      const user = await User.findOne({'approvedSubmissions.competitionId': document._id});
      const approved_message = `Your submission for competition ${document.name} has been approved`;

      await Notification.create({message: approved_message, user: user._id});

    }
  })
})

const Competition = mongoose.model('Competition', competitionSchema);

module.exports = Competition;