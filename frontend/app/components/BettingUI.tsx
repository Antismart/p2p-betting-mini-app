"use client";
import { useState } from "react";
import { getContract } from "../lib/contract";
import { ethers } from "ethers";
import { sendFrameNotification } from "@/lib/notification-client";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaShareAlt,
  FaCoins,
  FaSpinner,
  FaTrophy,
  FaPlus,
  FaCopy,
} from "react-icons/fa";
import {
  ConnectWallet,
  ConnectWalletText,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Name,
  Identity,
  EthBalance,
  Address,
  Avatar,
} from "@coinbase/onchainkit/identity";
import { useAccount } from "wagmi";

const BettingUI = () => {
  const [eventId, setEventId] = useState("");
  const [betChoice, setBetChoice] = useState(true);
  const [betAmount, setBetAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const { address } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [newEventId, setNewEventId] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");

  const userFid = 12345;

  const updateProgress = (value: number) => {
    setProgress(value);
    setTimeout(() => setProgress(0), 2000);
  };

  const addBadge = (badge: string) => {
    if (!badges.includes(badge)) {
      setBadges((prev) => [...prev, badge]);
    }
  };

  const addXp = (points: number) => {
    setXp((prevXp) => {
      const newXp = prevXp + points;
      if (newXp >= 100) {
        setLevel((prevLevel) => prevLevel + 1);
        return newXp - 100;
      }
      return newXp;
    });
  };

  const handleError = (error: any, action: string) => {
    console.error(`${action} failed:`, error);
    setError(`Failed to ${action}. Please try again.`);
  };

  const [betNotification, setBetNotification] = useState<string | null>(null);

  const [placedBets, setPlacedBets] = useState<
    { eventId: string; amount: string; choice: boolean }[]
  >([]);

  const placeBet = async () => {
    try {
      if (!eventId || isNaN(Number(eventId))) {
        throw new Error("Invalid Event ID. Please enter a numeric Event ID.");
      }

      setLoading(true);
      updateProgress(25);
      setMessage("Placing bet...");
      const contract = await getContract();
      const tx = await contract.placeBet(BigInt(eventId), betChoice, {
        value: ethers.parseEther(betAmount),
      });
      await tx.wait();
      updateProgress(100);
      setMessage("Bet placed successfully!");
      addBadge("First Bet Placed");
      addXp(20);

      setPlacedBets((prevBets) => [
        ...prevBets,
        { eventId, amount: betAmount, choice: betChoice },
      ]);
      // Show notification
      setBetNotification(
        `You have successfully placed a bet on Event ID: ${eventId}`,
      );
      setTimeout(() => setBetNotification(null), 5000); // Auto-dismiss after 5 seconds

      await sendFrameNotification({
        fid: userFid,
        title: "Bet Placed",
        body: `You placed a bet of ${betAmount} ETH on Event ID: ${eventId}.`,
      });

      // Share on Farcaster
      await shareOnFarcaster(
        `I just placed a bet on Event ID: ${eventId} with ${betAmount} ETH!`,
      );
    } catch (error) {
      handleError(error, "place bet");
    } finally {
      setLoading(false);
    }
  };

  const resolveEvent = async () => {
    try {
      if (!eventId || isNaN(Number(eventId))) {
        throw new Error("Invalid Event ID. Please enter a numeric Event ID.");
      }

      setLoading(true);
      setMessage("Resolving event using Chainlink oracle...");
      const contract = await getContract();
      const tx = await contract.resolveEvent(BigInt(eventId));
      await tx.wait();

      setMessage("Event resolved successfully!");
      addBadge("Event Resolved");
      addXp(30);

      await sendFrameNotification({
        fid: userFid,
        title: "Event Resolved",
        body: `Event ID: ${eventId} has been resolved.`,
      });
    } catch (error) {
      handleError(error, "resolve event");
    } finally {
      setLoading(false);
    }
  };

  const claimWinnings = async () => {
    try {
      if (!eventId || isNaN(Number(eventId))) {
        throw new Error("Invalid Event ID. Please enter a numeric Event ID.");
      }

      setLoading(true);
      setMessage("Claiming winnings...");
      const contract = await getContract();
      const tx = await contract.claimWinnings(BigInt(eventId));
      await tx.wait();

      setMessage("Winnings claimed successfully!");
      addBadge("Winnings Claimed");
      addXp(50);

      await sendFrameNotification({
        fid: userFid,
        title: "Winnings Claimed",
        body: `You claimed your winnings for Event ID: ${eventId}.`,
      });
    } catch (error) {
      handleError(error, "claim winnings");
    } finally {
      setLoading(false);
    }
  };

  const fetchResolvedOutcome = async () => {
    try {
      setLoading(true);
      setMessage("Fetching resolved outcome...");
      const contract = await getContract();

      // Fetch the resolved outcome from the smart contract
      const outcome = await contract.eventOutcome(eventId);
      setMessage(`Resolved Outcome: ${outcome ? "Yes" : "No"}`);
    } catch (error) {
      handleError(error, "fetch resolved outcome");
    } finally {
      setLoading(false);
    }
  };

  const shareOnFarcaster = async (message: string) => {
    try {
      setLoading(true);
      setMessage("Sharing on Farcaster...");
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid: userFid, message }),
      });

      if (response.ok) {
        setMessage("Shared on Farcaster!");
        addBadge("Shared on Farcaster");
        addXp(10);
      } else {
        setError("Failed to share on Farcaster. Please try again.");
      }
    } catch (error) {
      handleError(error, "share on Farcaster");
    } finally {
      setLoading(false);
    }
  };

  const generateEventId = () => {
    return Date.now(); // Use a timestamp as a numeric Event ID
  };

  const createEvent = async () => {
    try {
      setLoading(true);
      setMessage("Creating price prediction event...");
      const id = generateEventId();

      // Save the event details
      const eventDetails = {
        id,
        cryptocurrency: eventName,
        targetPrice: eventDescription,
        deadline: newEventId,
      };

      console.log("Saving event:", eventDetails);

      setNewEventId(id.toString());
      setMessage("Price prediction event created successfully!");
      setShowCreateEventModal(false);
    } catch (error) {
      handleError(error, "create price prediction event");
    } finally {
      setLoading(false);
    }
  };
  const [selectedBet, setSelectedBet] = useState<{
    eventId: string;
    users: { address: string; choice: boolean }[];
  } | null>(null);

  const viewBetDetails = async (eventId: string) => {
    try {
      setLoading(true);
      setMessage("Fetching bet details...");
      const contract = await getContract();

      // Fetch users who joined the bet and their decisions
      const users = await contract.getBetParticipants(BigInt(eventId));
      const formattedUsers = users.map((user: any) => ({
        address: user[0],
        choice: user[1],
      }));

      setSelectedBet({ eventId, users: formattedUsers });
    } catch (error) {
      handleError(error, "fetch bet details");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-lg mx-auto p-6 bg-gradient-to-br from-pink-50 via-purple-100 to-blue-50 text-gray-800 rounded-lg shadow-2xl relative">
      <h2 className="text-4xl font-bold mb-6 text-center text-gradient">
        🎮 P2P Betting
      </h2>
      <div className="max-h-[80vh] overflow-y-auto">
        {/* Wallet Connection */}
        <div className="mb-6">
          <Wallet className="[&>div:nth-child(2)]:!opacity-20 md:[&>div:nth-child(2)]:!opacity-100">
            <ConnectWallet className="w-full flex items-center justify-center bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 p-3 rounded-lg shadow-md transition">
              <ConnectWalletText>
                {address ? "Connected" : "Connect Wallet"}
              </ConnectWalletText>
            </ConnectWallet>
            {address && (
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            )}
          </Wallet>
        </div>
        {/* Progress Bar */}
        {progress > 0 && (
          <div className="absolute top-0 left-0 w-full h-2 bg-gray-200">
            <div
              className="h-full bg-blue-400 transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {/* Level and XP */}
        <div className="mb-6 text-center">
          <h3 className="text-lg font-bold">Level {level}</h3>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-400 h-full rounded-full"
              style={{ width: `${xp}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-1">{xp}/100 XP</p>
        </div>

        {/* Create Event Modal */}
        {showCreateEventModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
              <h3 className="text-xl font-semibold mb-4">
                Create Price Prediction Event
              </h3>

              {/* Cryptocurrency Name */}
              <input
                type="text"
                className="w-full mb-4 p-3 border rounded"
                placeholder="Cryptocurrency (e.g., Bitcoin, Ethereum)"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />

              {/* Target Price */}
              <input
                type="number"
                className="w-full mb-4 p-3 border rounded"
                placeholder="Target Price (e.g., 50000)"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
              />

              {/* Deadline */}
              <input
                type="datetime-local"
                className="w-full mb-4 p-3 border rounded"
                placeholder="Prediction Deadline"
                value={newEventId}
                onChange={(e) => setNewEventId(e.target.value)}
              />

              <div className="flex justify-between">
                <button
                  onClick={() => setShowCreateEventModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={createEvent}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Display Generated Event ID */}
        {newEventId && (
          <div className="relative mb-6 p-4 bg-green-100 text-green-800 rounded-lg shadow-md">
            <button
              onClick={() => setNewEventId("")} // Clear the event ID to dismiss the notification
              className="absolute top-2 right-2 text-green-800 hover:text-green-600"
            >
              ✕
            </button>
            <h3 className="text-lg font-semibold">
              Event Created Successfully!
            </h3>
            <p className="text-sm mt-2">
              Your Event ID is: <span className="font-bold">{newEventId}</span>
            </p>
            <p className="text-sm mt-1">
              Share this Event ID with others so they can place bets on it.
            </p>
          </div>
        )}

        {/* Create Event Button */}
        <button
          onClick={() => setShowCreateEventModal(true)}
          className="mb-6 w-full flex items-center justify-center bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 p-3 rounded-lg shadow-md transition"
        >
          <FaPlus className="mr-2" />
          Create Price Prediction Event
        </button>
        {/* Event ID Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Event ID</label>
          <input
            type="number"
            className="w-full p-3 rounded bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter Event ID for the price prediction"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          />
        </div>

        {/* Bet Amount Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Bet Amount (ETH)
          </label>
          <input
            type="text"
            className="w-full p-3 rounded bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter Bet Amount"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
          />
        </div>

        {/* Bet Choice */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Your Choice</label>
          <select
            className="w-full p-3 rounded bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={betChoice ? "true" : "false"}
            onChange={(e) => setBetChoice(e.target.value === "true")}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={placeBet}
            className="flex items-center justify-center bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 p-3 rounded-lg shadow-md transition"
            disabled={loading}
          >
            {loading ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <FaCheckCircle className="mr-2" />
            )}
            Place Bet
          </button>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={resolveEvent}
              className="flex items-center justify-center bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 p-3 rounded-lg shadow-md transition"
              disabled={loading}
            >
              Resolve Event
            </button>
            <button
              onClick={fetchResolvedOutcome}
              className="flex items-center justify-center bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 p-3 rounded-lg shadow-md transition"
              disabled={loading}
            >
              Fetch Outcome
            </button>
          </div>
        </div>

        {/* Bet Placement Notification */}
        {betNotification && (
          <div className="fixed top-4 right-4 bg-blue-100 text-blue-800 p-4 rounded-lg shadow-md z-50">
            <p>{betNotification}</p>
          </div>
        )}
        {/* Claim Winnings Button */}
        <button
          onClick={claimWinnings}
          className="mt-4 w-full flex items-center justify-center bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 p-3 rounded-lg shadow-md transition"
          disabled={loading}
        >
          {loading ? (
            <FaSpinner className="animate-spin mr-2" />
          ) : (
            <FaCoins className="mr-2" />
          )}
          Claim Winnings
        </button>
        {/* Share Button */}
        <button
          onClick={() =>
            shareOnFarcaster(
              `I just placed a bet on Event ID: ${eventId} with ${betAmount} ETH!`,
            )
          }
          className="mt-4 w-full flex items-center justify-center bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 p-3 rounded-lg shadow-md transition"
          disabled={loading}
        >
          {loading ? (
            <FaSpinner className="animate-spin mr-2" />
          ) : (
            <FaShareAlt className="mr-2" />
          )}
          Share on Farcaster
        </button>

        {/* Placed Bets */}
        {placedBets.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Your Placed Bets</h3>
            <ul className="list-disc pl-4 mt-2">
              {placedBets.map((bet, index) => (
                <li
                  key={index}
                  className="text-sm cursor-pointer hover:underline"
                  onClick={() => viewBetDetails(bet.eventId)}
                >
                  Event ID: {bet.eventId} - Bet: {bet.choice ? "Yes" : "No"} -
                  Amount: {bet.amount} ETH
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bet Details */}
        {selectedBet && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
              <h3 className="text-lg font-semibold mb-4">
                Bet Details for Event ID: {selectedBet.eventId}
              </h3>
              <ul className="list-disc pl-4">
                {selectedBet.users.map((user, index) => (
                  <li key={index} className="text-sm">
                    Address: {user.address} - Choice:{" "}
                    {user.choice ? "Yes" : "No"}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setSelectedBet(null)}
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}
        {/* Achievements */}
        {badges.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Achievements</h3>
            <ul className="list-disc pl-4 mt-2">
              {badges.map((badge, index) => (
                <li key={index} className="text-sm">
                  {badge}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingUI;
