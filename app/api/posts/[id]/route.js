import connectMongoDB from "@/lib/mongodb";
import Post from "@/models/posts";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import {
  recordNewHashtags,
  resolveMentions,
  notifyNewMentions,
} from "@/lib/mentionsAndTags";

export async function GET(request, { params }) {
  await connectMongoDB();
  const { id } = await params;
  const post = await Post.findById(id).lean();

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  // return as { post }
  return NextResponse.json({ post }, { status: 200 });
}

export async function PUT(request, { params }) {
  await connectMongoDB();
  const session = await getServerSession(authOptions);

  if (!session)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const post = await Post.findById(id);

  if (!post) 
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (post.authorId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const previousBody = post.body;

  // Support both JSON body updates and multipart/form-data with media changes
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    // handle form data with possible image/gif and existing-media changes
    const data = await request.formData();
    const newBody = data.get("newBody");
    const file = data.get("image");
    const gifUrl = data.get("gifUrl");
    const existingImagesRaw = data.get("existingImages");

    if (newBody !== null) post.body = newBody;

    let images = post.images || [];
    if (existingImagesRaw !== null) {
      try {
        const parsed = JSON.parse(existingImagesRaw);
        images = Array.isArray(parsed)
          ? parsed.filter((url) => typeof url === "string")
          : [];
      } catch {
        images = post.images || [];
      }
    }

    if (file && file.size) {
      // upload to cloudinary
      try {
        const uploadToCloudinary = (file) => {
          return new Promise((resolve, reject) => {
            file.arrayBuffer().then((buffer) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  folder: "redilink_posts",
                  resource_type: "auto",
                },
                (error, result) => {
                  if (error) return reject(error);
                  return resolve(result);
                }
              );
              stream.end(Buffer.from(buffer));
            });
          });
        };

        const uploadResult = await uploadToCloudinary(file);
        images.push(uploadResult.secure_url);
      } catch (err) {
        console.error("Cloudinary upload failed:", err);
        return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
      }
    } else if (gifUrl) {
      images.push(gifUrl);
    }

    post.images = images;
  } else {
    // JSON update (no image)
    const { newBody } = await request.json();
    if (newBody !== undefined) post.body = newBody;
  }

  if (post.body !== previousBody) {
    const previousMentionIds = post.mentions || [];
    const mentionedUsers = await resolveMentions(post.body);
    post.mentions = mentionedUsers.map((user) => user.id);

    await post.save();

    await recordNewHashtags(post.body, previousBody);
    await notifyNewMentions({
      mentionedUsers,
      previouslyMentionedIds: previousMentionIds,
      authorId: session.user.id,
      actor: {
        name: session.user.name,
        username: session.user.username,
        profileImage: session.user.image || null,
      },
      postId: post._id.toString(),
      postBody: post.body,
      context: "post",
    });
  } else {
    await post.save();
  }

  return NextResponse.json({ message: "Post Updated", post }, { status: 200 });
}

export async function DELETE(request, { params }) {
  await connectMongoDB();
  const session = await getServerSession(authOptions);

  if (!session)
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const post = await Post.findById(id);

  if (!post)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (post.authorId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await Post.deleteMany({ repostOf: id });
  await Post.findByIdAndDelete(id);
  return NextResponse.json({ message: "Post Deleted" }, { status: 200 });
}