import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/user";
import cloudinary from "@/lib/cloudinary";

const uploadToCloudinary = async (file) => {
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "redilink_profiles", resource_type: "auto" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer);
  });
};

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const formData = await request.formData();
    const name = formData.get("name")?.toString().trim();
    const bio = formData.get("bio")?.toString().trim() || "";
    const website = formData.get("website")?.toString().trim() || "";
    const profileFile = formData.get("profileImage");
    const coverFile = formData.get("coverImage");

    const update = {
      name: name || undefined,
      bio,
      website,
    };

    if (profileFile && typeof profileFile !== "string") {
      const uploadResult = await uploadToCloudinary(profileFile);
      update.profileImage = uploadResult.secure_url;
    }

    if (coverFile && typeof coverFile !== "string") {
      const uploadResult = await uploadToCloudinary(coverFile);
      update.coverImage = uploadResult.secure_url;
    }

    const user = await User.findByIdAndUpdate(session.user.id, update, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        name: user.name,
        bio: user.bio,
        website: user.website,
        profileImage: user.profileImage,
        coverImage: user.coverImage,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
