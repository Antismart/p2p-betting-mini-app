import { NextResponse } from "next/server";

function getFrameMetadata({ buttons, image, postUrl }: { buttons: any[]; image: any; postUrl: string }) {
  return `
    <meta name="buttons" content='${JSON.stringify(buttons)}'>
    <meta name="image" content='${JSON.stringify(image)}'>
    <meta name="postUrl" content="${postUrl}">
  `;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const eventId = url.searchParams.get("eventId") || "1";
  const betAmount = url.searchParams.get("amount") || "0.01";

  const host = url.origin;

  const frameMetadata = getFrameMetadata({
    buttons: [
      { label: `Bet ${betAmount} ETH on Yes`, action: "post" },
      { label: `Bet ${betAmount} ETH on No`, action: "post" },
    ],
    image: {
      src: `${host}/api/images/betting-frame.png?eventId=${eventId}`,
      aspectRatio: "1.91:1",
    },
    postUrl: `${host}/api/frame/place-bet`,
  });

  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Bet on Event #${eventId}</title>
        ${frameMetadata}
      </head>
      <body>
        <h1>Bet on Event #${eventId}</h1>
        <p>View this page in a Farcaster client to place bets.</p>
      </body>
    </html>
  `, {
    headers: { "Content-Type": "text/html" },
  });
}