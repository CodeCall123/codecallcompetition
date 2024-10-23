const axios = require('axios');
const User = require('../models/User');

const verifyAuth = async (req, res, next) => {

    // The token should be in this format "Bearer access_token_here";
    const access_token = req.headers.authorization;

    console.log({access_token});

    if (!access_token) {
        return res.status(401).json({ message: "No token found. Unauthorized" });
    };

    try {

        const githubResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `token ${access_token.split(' ')[1]}` },
        });

        // console.log({githubResponse.data});

        const { login } = githubResponse.data;
        const user = await User.findOne({ username: login });

        if (!user) {
            return res.status(401).json({
                message: "Invalid token! User not found"
            })
        }

        req.user = user;
        next();

    } catch (error) {
        console.error('Error verifying GitHub token:', error.message);
        return res.status(401).json({ message: 'Token verification failed' });
    }
};

module.exports = verifyAuth;