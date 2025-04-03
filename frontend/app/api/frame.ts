import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    frames: [
      {
        image: "https://p2p-betting-mini-app.vercel.app/frame.png", // Replace with a dynamic event image
        buttons: [
          { label: "Bet Yes", action: "post", target: "/api/bet?choice=yes" },
          { label: "Bet No", action: "post", target: "/api/bet?choice=no" },
        ],
        post_url: "https://p2p-betting-mini-app.vercel.app/api/frame",
      },
    ],
  });
}

