const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const User = require('./models/User');
const Competition = require('./models/Competition');

const seedData = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('Connected to MongoDB.');

  try {
    // Clear existing data
    await User.deleteMany({});
    await Competition.deleteMany({});

    // Seed data for users
    const users = [
      {
        username: 'testuser',
        email: 'testuser@example.com',
        github: 'testuser',
        xp: 500,
        totalEarnings: 100,
        Features: 5,
        Bugs: 2,
        Optimisations: 3,
        walletAddress: '0x123456789abcdef',
      },
      {
        username: 'developer2',
        email: 'dev2@example.com',
        github: 'developer2',
        xp: 300,
        totalEarnings: 50,
        Features: 3,
        Bugs: 1,
        Optimisations: 1,
        walletAddress: '0xabcdef123456789',
      },
    ];

    await User.insertMany(users);

    // Seed data for competitions
    const competitions = [
      {
        name: 'Competition 1',
        description: 'This is a sample competition.',
        reward: 1000,
        points: 50,
        languages: ['JavaScript', 'Python'],
        types: ['Feature', 'Optimization'],
        startDate: new Date(),
        endDate: new Date(),
        judges: {
          leadJudge: null,
          judges: [],
        },
      },
      {
        name: 'Competition 2',
        description: 'This is another sample competition.',
        reward: 2000,
        points: 75,
        languages: ['Java', 'Python'],
        types: ['Bug', 'Feature'],
        startDate: new Date(),
        endDate: new Date(),
        judges: {
          leadJudge: null,
          judges: [],
        },
      },
    ];

    await Competition.insertMany(competitions);

    console.log('Data seeded successfully.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding data:', error);
    mongoose.connection.close();
  }
};

seedData();
