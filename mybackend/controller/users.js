const User = require('../models/User');
const { ethers } = require('ethers');

class UserController {

    constructor() {
        this.usdcContractAddress = '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4';
        this.usdcAbi = ["function balanceOf(address owner) view returns (uint256)"];

        const ZKSYNC_MAINNET_URL = process.env.ZKSYNC_MAINNET_URL;

        if (!ZKSYNC_MAINNET_URL) {
            console.error("ZKSYNC_MAINNET_URL is not set in the environment variables.");
            process.exit(1);
        }

        this.provider = new ethers.JsonRpcProvider(ZKSYNC_MAINNET_URL);
        this.checkNetworkConnection();
    }

    checkNetworkConnection() {
        this.provider.getNetwork()
            .then((network) => {
                console.log(`Connected to zkSync network: ${network.name}`);
            })
            .catch((error) => {
                console.error("Network connection failed:", error);
                process.exit(1);
            });
    }

    getUser = async (req, res) => {
        const { username } = req.params;
        try {
            console.log(`Fetching data for user: ${username}`);
            const userData = await this.getUserDataByUsername(username);
            res.status(200).json(userData);
        } catch (error) {
            console.error('Error fetching user data:', error.message);
            res.status(500).json({ message: error.message });
        }
    }

    updateUserData = async (req, res) => {
        const { username } = req.params;

        if (req.user.username !== username) {
            return res.status(403).json({ message: 'You are not authorized to update this profile' });
        }

        const updateData = req.body;

        try {
            console.log(`Updating data for user: ${username}`);
            const updatedUserData = await this.updateUserDataByUsername(username, updateData);
            res.status(200).json(updatedUserData);
        } catch (error) {
            console.error('Error updating user data:', error.message);
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    }

    canUpdateThisProfile = async (req, res) => {
        const {username} = req.params;
        try {

            const loggedInUser = req.user.username;
            if(username !== loggedInUser) {
                return res.status(409).json({
                    message: "You're not allowed to update this profile"
                });
            };

            res.json({
                message: "OK"
            })

        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    }

    fetchUSDCBalance = async (req, res) => {
        const { username } = req.params;

        if (username !== req.user.username) {
            return res.status(409).json({
                message: "You're not allowed to perform this operation"
            })
        }

        try {
            const user = await User.findOne({ username });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const balance = await this.getUSDCBalance(user.walletAddress);
            res.status(200).json({ walletAddress: user.walletAddress, usdcBalance: balance });
        } catch (error) {
            console.error('Error fetching USDC balance:', error.message);
            res.status(500).json({ message: 'Error fetching USDC balance', error: error.message });
        }
    }

    // we can move it to a separate controller
    fetchLeaderboard = async (req, res) => {
        try {
            const users = await User.find().sort({ xp: -1 });
            res.status(200).json(users);
        } catch (error) {
            console.error('Error fetching leaderboard data:', error.message);
            res.status(500).json({ message: error.message });
        }
    }

    // private methods
    updateUserDataByUsername = async (username, data) => {
        // const updateFields = { avatar, email, discord, telegram, twitter, linkedin, bio } = data;
        const user = await User.findOneAndUpdate({ username }, data, { new: true });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    getUserDataByUsername = async (username) => {
        const user = await User.findOne({ username });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    getUSDCBalance = async (walletAddress) => {
        try {
            const usdcContract = new ethers.Contract(this.usdcContractAddress, this.usdcAbi, this.provider);
            const balance = await usdcContract.balanceOf(walletAddress);
            const formattedBalance = ethers.formatEther(balance, 6);
            return formattedBalance;
        } catch (error) {
            console.error(`Error fetching USDC balance for ${walletAddress} on zkSync:`, error);
            throw new Error('Could not fetch USDC balance on zkSync.');
        }
    }
};

module.exports = UserController;