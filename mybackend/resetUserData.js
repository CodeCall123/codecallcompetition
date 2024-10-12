const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected...'))
  .catch((err) => console.log(err));

const resetUserData = async () => {
  try {
    const update = {
      xp: 0,
      Features: 0,
      Bugs: 0,
      Optimisations: 0,
      completedTasks: [],
    };

    await User.updateMany({}, update);
    console.log('All user data has been reset.');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error resetting user data:', error);
    mongoose.connection.close();
  }
};

resetUserData();
