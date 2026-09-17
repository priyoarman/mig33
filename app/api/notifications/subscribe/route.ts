import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongoDB from "@/lib/mongodb";
import PushSubscription from "@/models/pushSubscription";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { endpoint, keys } = (await request.json()) as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };
    if (
      typeof endpoint !== "string" ||
      !endpoint ||
      !keys?.p256dh ||
      !keys?.auth
    ) {
      return NextResponse.json(
        { error: "A valid push subscription is required" },
        { status: 400 },
      );
    }

    await connectMongoDB();
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        userId: session.user.id,
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        userAgent: request.headers.get("user-agent") || undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to save push subscription" },
      { status: 500 },
    );
  }
}
