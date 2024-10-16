const {ethers} = require('ethers');
const axios = require('axios');

const User = require('../models/User');

class AuthController {
    authenticate = async (req, res) => {
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
                console.error('Error from GitHub:', response.data.error_description);
                return res.status(500).json({ message: response.data.error_description });
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
                    linkedin: ''
                });
                await user.save();
            }

            res.status(200).json({ username: user.username, accessToken: access_token });
        } catch (error) {
            console.error('Error during authentication:', error.response ? error.response.data : error.message);
            res.status(500).json({ message: error.message });
        }
    }

};

module.exports = AuthController;