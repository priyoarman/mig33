import connectMongoDB from "@/lib/mongodb";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import { generateUniqueUsername } from "@/lib/username";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required." },
        { status: 400 },
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    await connectMongoDB();
    const username = await generateUniqueUsername(name);
    await User.create({ name, email, password: hashed, username });
    return NextResponse.json({ message: "User registered." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error registering user." },
      { status: 500 }
    );
  }
}
