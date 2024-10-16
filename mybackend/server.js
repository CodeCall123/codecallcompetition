// Import necessary modules and setup
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectToDatabase = require('./db'); 
const helmet = require('helmet'); 
const { exec } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const competitionRouter = require('./routes/competitions');
const trainingRouter = require('./routes/training');
const userRouter = require('./routes/users');
const xpRouter = require('./routes/xp');
const authRouter = require('./routes/auth');

const app = express();
const port = process.env.PORT || 5001;

app.use(express.json());
const allowedOrigins = ['https://codecallappfrontend.vercel.app', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(helmet()); 
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ message: 'Database connection error' });
  }
});
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],  
    scriptSrc: ["'self'"],  
    styleSrc: ["'self'"], 
    imgSrc: ["'self'", "data:"],  
    connectSrc: ["'self'", "https://api.github.com"],  
    objectSrc: ["'none'"],  
    upgradeInsecureRequests: [] 
  }
}));

app.use(competitionRouter);
app.use(trainingRouter);
app.use(userRouter);
app.use(xpRouter);
app.use(authRouter);

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

app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});