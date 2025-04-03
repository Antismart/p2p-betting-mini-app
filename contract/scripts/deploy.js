const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying BettingEscrow...");

    // Replace with the Chainlink oracle address for your network
    const oracleAddress = "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43";

    // Get the contract factory
    const BettingEscrow = await ethers.getContractFactory("BettingEscrow");

    // Deploy the contract with the oracle address
    const bettingEscrow = await BettingEscrow.deploy(oracleAddress);

    // Wait for deployment completion (Ethers v6+)
    await bettingEscrow.waitForDeployment();

    // Get deployed contract address
    console.log("BettingEscrow deployed to:", await bettingEscrow.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
