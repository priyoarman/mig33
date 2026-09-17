import connectMongoDB from "@/lib/mongodb";
import Hashtag from "@/models/hashtag";

export interface TrendingHashtag {
  tag: string;
  count: number;
}

export async function getTrendingHashtags(
  limit = 30,
): Promise<TrendingHashtag[]> {
  await connectMongoDB();

  const hashtags = await Hashtag.find({ count: { $gt: 0 } })
    .sort({ count: -1 })
    .limit(limit)
    .select("tag count")
    .lean();

  return hashtags.map((hashtag) => ({ tag: hashtag.tag, count: hashtag.count }));
}
