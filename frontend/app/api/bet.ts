// import { NextRequest, NextResponse } from "next/server";
// import { createWalletClient, http, parseEther } from "viem";
// import { base, baseSepolia } from "viem/chains";
// import contractABI from "@/lib/BettingContractABI.json";

// const contractAddress = "0xYourSmartContractAddress"; // Replace with deployed contract

// // Wallet client for transaction signing (use a real private key in backend service)
// const walletClient = createWalletClient({
//   chain: baseSepolia,
//   transport: http(),
//   account: process.env.PRIVATE_KEY as `0x${string}`, // Set this securely in your backend
// });

// export async function GET(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const fid = searchParams.get("fid");
//   const choice = searchParams.get("choice");

//   if (!fid || !choice) {
//     return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
//   }

//   try {
//     // Call the smart contract to place a bet
//     const tx = await walletClient.writeContract({
//       address: contractAddress as `0x${string}`,
//       abi: contractABI,
//       functionName: "placeBet",
//       args: [fid, choice],
//       value: parseEther("0.01"), // Example: Each bet requires 0.01 ETH
//     });

//     return NextResponse.json({ message: `Bet placed on ${choice}`, tx });
//   } catch (error) {
//     let message = "An unknown error occurred";
//     if (error instanceof Error) {
//       message = error.message;
//     }
//     return NextResponse.json({ error: message }, { status: 500 });
//   }
// }
