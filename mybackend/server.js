const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ethers } = require('ethers');
const helmet = require('helmet');
const { exec } = require('child_process');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const connectToDatabase = require('./db');
const redisClient = require('./redis');

const router = express.Router();

const competitionRouter = require('./routes/competitions');
const trainingRouter = require('./routes/training');
const userRouter = require('./routes/user');

const User = require('./models/User');

// Set up rate limiting for login
const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again after a minute.',
});

const app = express();
const port = process.env.PORT || 5001;

const allowedOrigins = [
  'https://codecallappfrontend.vercel.app',
  'http://localhost:3000',
];

// ZKSync setup
const ZKSYNC_MAINNET_URL = process.env.ZKSYNC_MAINNET_URL;
if (!ZKSYNC_MAINNET_URL) {
  console.error('ZKSYNC_MAINNET_URL is not set in the environment variables.');
  process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(ZKSYNC_MAINNET_URL);
provider
  .getNetwork()
  .then((network) => {
    console.log(`Connected to zkSync network: ${network.name}`);
  })
  .catch((error) => {
    console.error('Network connection failed:', error);
    process.exit(1);
  });

app.use(bodyParser.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);
app.use(helmet());
app.use((req, res, next) => {
  if (
    req.headers['x-forwarded-proto'] !== 'https' &&
    process.env.NODE_ENV === 'production'
  ) {
    return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  next();
});
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ message: 'Database connection error' });
  }
});
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'https://api.github.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.use('/user', userRouter);
app.use('/competitions', competitionRouter);
app.use('/training', trainingRouter);

// GitHub OAuth callback endpoint
router.post(
  '/authenticate',
  loginRateLimiter,
  body('code').isString().trim().escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code } = req.body;
    const clientID = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    try {
      const response = await axios.post(
        `https://github.com/login/oauth/access_token`,
        { client_id: clientID, client_secret: clientSecret, code },
        { headers: { accept: 'application/json' } }
      );

      if (response.data.error) {
        return res
          .status(500)
          .json({ message: response.data.error_description });
      }

      const { access_token } = response.data;
      const githubResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `token ${access_token}` },
      });

      const { login, avatar_url, email } = githubResponse.data;
      let user = await User.findOne({ username: login });

      if (!user) {
        const wallet = ethers.Wallet.createRandom();
        user = new User({
          username: login,
          avatar: avatar_url,
          email: email,
          github: login,
          totalEarnings: 0,
          xp: 0,
          Features: 0,
          Bugs: 0,
          Optimisations: 0,
          walletAddress: wallet.address,
          discord: '',
          telegram: '',
          twitter: '',
          linkedin: '',
        });
        await user.save();
      }

      res
        .status(200)
        .json({ username: user.username, accessToken: access_token });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Endpoint to fetch leaderboard data
app.get('/leaderboard', async (req, res) => {
  try {
    const cachedLeaderboard = await redisClient.get('leaderboard');
    if (cachedLeaderboard) {
      console.log('Serving from Redis cache');
      return res.status(200).json(JSON.parse(cachedLeaderboard));
    }

    const users = await User.find().sort({ xp: -1 });
    await redisClient.setEx('leaderboard', 60, JSON.stringify(users));

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint to execute Python code
app.post('/execute-python', async (req, res) => {
  const { code } = req.body;

  const fs = require('fs');
  const tmpFile = 'temp_code.py';

  fs.writeFileSync(tmpFile, code);

  exec(`python3 ${tmpFile}`, (error, stdout, stderr) => {
    fs.unlinkSync(tmpFile);

    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ error: error.message });
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(200).json({ output: stderr });
    }

    res.status(200).json({ output: stdout });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
