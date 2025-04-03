import { sendFrameNotification } from "@/lib/notification-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fid, message } = body;

    const result = await sendFrameNotification({
      fid,
      title: "New Activity on P2P Betting",
      body: message,
    });

    if (result.state === "error") {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}