const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { ethers } = require('ethers');

const User = require('../models/User');

// Function to get USDC balance on zkSync
const getUSDCBalance = async (walletAddress) => {
  const usdcContractAddress = process.env.USDC_CONTRACT_ADDRESS;
  const usdcAbi = JSON.parse(process.env.USDC_ABI);
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.ZKSYNC_MAINNET_URL
  );

  try {
    const usdcContract = new ethers.Contract(
      usdcContractAddress,
      usdcAbi,
      provider
    );
    const balance = await usdcContract.balanceOf(walletAddress);
    const formattedBalance = ethers.utils.formatUnits(balance, 6);
    return formattedBalance;
  } catch (error) {
    console.error(
      `Error fetching USDC balance for ${walletAddress}:`,
      error.message
    );
    throw new Error('Could not fetch USDC balance.');
  }
};

// Function to get user data by username
const getUserDataByUsername = async (username) => {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    console.error(`Error fetching user data for ${username}:`, error.message);
    throw new Error('User not found');
  }
};

// Function to update user data by username
const updateUserDataByUsername = async (username, data) => {
  try {
    const { avatar, email, discord, telegram, twitter, linkedin, bio } = data;

    const updateFields = {
      avatar,
      email,
      discord,
      telegram,
      twitter,
      linkedin,
      bio,
    };

    const user = await User.findOneAndUpdate({ username }, updateFields, {
      new: true,
    });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    console.error(`Error updating user data for ${username}:`, error.message);
    throw new Error('User not found');
  }
};

module.exports = {
  getUSDCBalance,
  getUserDataByUsername,
  updateUserDataByUsername,
};
