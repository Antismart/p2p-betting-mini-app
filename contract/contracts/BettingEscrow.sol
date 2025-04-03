// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract BettingEscrow {
    address public owner;
    AggregatorV3Interface internal oracle; // Chainlink oracle instance
    
    struct Bet {
        address user;
        uint256 amount;
        bool choice;
        bool claimed;
    }

    mapping(uint256 => Bet[]) public bets;
    mapping(uint256 => bool) public eventResolved;
    mapping(uint256 => bool) public eventOutcome;
    mapping(address => mapping(uint256 => uint256)) public pendingWithdrawals;
    
    event BetPlaced(uint256 eventId, address user, uint256 amount, bool choice);
    event EventResolved(uint256 eventId, bool outcome);
    event WinningsClaimed(uint256 eventId, address user, uint256 amount);
    event ClaimFailed(uint256 eventId, address user, string reason);

    constructor(address _oracleAddress) {
        owner = msg.sender;
        oracle = AggregatorV3Interface(_oracleAddress);
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    function placeBet(uint256 eventId, bool choice) external payable {
        require(msg.value > 0, "Must send ETH to bet");
        require(!eventResolved[eventId], "Betting closed for this event");
        bets[eventId].push(Bet(msg.sender, msg.value, choice, false));
        emit BetPlaced(eventId, msg.sender, msg.value, choice);
    }

    function resolveEvent(uint256 eventId) external onlyOwner {
        require(!eventResolved[eventId], "Event already resolved");

        // Fetch outcome data from Chainlink oracle
        (, int256 result, , , ) = oracle.latestRoundData();
        require(result == 0 || result == 1, "Invalid outcome from oracle");

        bool outcome = (result == 1); // Convert oracle response to bool
        eventResolved[eventId] = true;
        eventOutcome[eventId] = outcome;
        
        emit EventResolved(eventId, outcome);
    }

    function claimWinnings(uint256 eventId) external {
        require(eventResolved[eventId], "Event not resolved yet");

        uint256 totalPool = 0;
        uint256 winningPool = 0;
        uint256 userBetAmount = 0;
        bool userWon = false;
        uint256 betIndex = 0;

        // First pass: calculate pools
        for (uint i = 0; i < bets[eventId].length; i++) {
            totalPool += bets[eventId][i].amount;
            if (bets[eventId][i].choice == eventOutcome[eventId]) {
                winningPool += bets[eventId][i].amount;
            }
            if (bets[eventId][i].user == msg.sender && !bets[eventId][i].claimed) {
                userBetAmount = bets[eventId][i].amount;
                userWon = true;
                betIndex = i;
            }
        }

        require(userWon, "No winning unclaimed bets found");
        require(winningPool > 0, "No winners in pool");

        // Calculate winnings
        uint256 winnings = (userBetAmount * totalPool) / winningPool;

        // Mark as claimed before updating pendingWithdrawals to prevent reentrancy
        bets[eventId][betIndex].claimed = true;
        pendingWithdrawals[msg.sender][eventId] = winnings;
        
        emit WinningsClaimed(eventId, msg.sender, winnings);
    }

    function withdraw(uint256 eventId) external {
        uint256 amount = pendingWithdrawals[msg.sender][eventId];
        require(amount > 0, "No winnings to withdraw");

        pendingWithdrawals[msg.sender][eventId] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            emit ClaimFailed(eventId, msg.sender, "Withdrawal failed");
            pendingWithdrawals[msg.sender][eventId] = amount;
            revert("Withdrawal failed");
        }
    }
}
