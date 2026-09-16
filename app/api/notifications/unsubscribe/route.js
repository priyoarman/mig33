import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongoDB from "@/lib/mongodb";
import PushSubscription from "@/models/pushSubscription";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { endpoint } = await request.json();
    if (typeof endpoint !== "string" || !endpoint) {
      return NextResponse.json(
        { error: "A valid endpoint is required" },
        { status: 400 },
      );
    }

    await connectMongoDB();
    await PushSubscription.deleteOne({
      endpoint,
      userId: session.user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to remove push subscription" },
      { status: 500 },
    );
  }
}
