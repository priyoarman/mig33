import { NextResponse, type NextRequest } from "next/server";

type GiphyImageVariant = {
  url: string;
};

type GiphyItem = {
  id: string;
  images?: {
    original?: GiphyImageVariant;
    downsized?: GiphyImageVariant;
    fixed_height?: GiphyImageVariant;
    fixed_height_small?: GiphyImageVariant;
    downsized_medium?: GiphyImageVariant;
  };
};

type GifResult = {
  url: string;
  preview: string;
  id: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const limit = searchParams.get("limit") || "30";

    const apiKey = process.env.GIPHY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GIPHY_API_KEY not configured" },
        { status: 500 },
      );
    }

    const giphyUrl = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(
      q,
    )}&limit=${limit}&rating=g`;

    const response = await fetch(giphyUrl);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Giphy API error:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch from Giphy API" },
        { status: response.status },
      );
    }

    const data = (await response.json()) as { data?: GiphyItem[] };

    const results = (data.data || [])
      .map((item): GifResult | null => {
        try {
          const url =
            item.images?.original?.url ||
            item.images?.downsized?.url ||
            item.images?.fixed_height?.url;

          if (!url) return null;

          const preview =
            item.images?.fixed_height_small?.url ||
            item.images?.downsized_medium?.url ||
            url;

          return {
            url,
            preview,
            id: item.id,
          };
        } catch {
          return null;
        }
      })
      .filter((result): result is GifResult => result !== null);

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Giphy search error:", err);
    return NextResponse.json(
      { error: "Server error during Giphy search" },
      { status: 500 },
    );
  }
}
