import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country  = searchParams.get("country")  ?? "us";
  const category = searchParams.get("category") ?? "business";
  const key = process.env.NEXT_PUBLIC_NEWS_API;
  if (!key) {
    return NextResponse.json(
      { error: "API key not configured in environment" },
      { status: 500 }
    );
  }

  const url = new URL("https://newsapi.org/v2/top-headlines");
  url.searchParams.set("country",  country);
  url.searchParams.set("category", category);
  url.searchParams.set("apiKey",    key);

  const apiRes  = await fetch(url);
  const payload = await apiRes.json();
  return NextResponse.json(payload, { status: apiRes.status });
}
