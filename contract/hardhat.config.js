require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.7",
  networks: {
    baseSepolia: {
      url: "https://sepolia.base.org", // Base Sepolia RPC
      accounts: [process.env.PRIVATE_KEY], // Use your private key
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY, // Optional for verifying contracts
  },
};
