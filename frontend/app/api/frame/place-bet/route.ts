// filepath: /mnt/data/Desktop/Base/p2p-betting-mini-app/app/api/frame/place-bet/route.ts
import { NextResponse } from "next/server";
import { getContract } from "../../../lib/contract";
import { ethers } from "ethers";

export async function POST(req: Request) {
  const { trustedData } = await req.json();
  const { eventId, choice } = trustedData.input.targetParams;

  try {
    const contract = await getContract();
    const tx = await contract.placeBet(eventId, choice === "yes", { value: ethers.parseEther("0.01") });
    await tx.wait();

    return NextResponse.json({
      frame: {
        title: "Bet Placed!",
        image: "https://p2p-betting-mini-app.vercel.app/public/success-frame.png",
        buttons: [{ label: "View Bets", action: "post", target: `/api/frame` }],
      },
    });
  } catch (error) {
    return NextResponse.json({
      frame: {
        title: "Bet Failed!",
        image: "https://p2p-betting-mini-app.vercel.app/public/error-frame.png",
        buttons: [{ label: "Try Again", action: "post", target: `/api/frame` }],
      },
    });
  }
}