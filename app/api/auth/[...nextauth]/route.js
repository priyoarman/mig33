import User from "@/models/user";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import connectMongoDB from "@/lib/mongodb";
import { generateUniqueUsername } from "@/lib/username";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {},
      async authorize(credentials) {
        const { email, password } = credentials;
        await connectMongoDB();
        const user = await User.findOne({ email });
        if (!user) return null;
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;
        return user;
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google" || account.provider === "github") {
        await connectMongoDB();
        try {
          const existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            const username = await generateUniqueUsername(user.name);
            await User.create({
              name: user.name,
              email: user.email,
              username,
              profileImage: user.image,
            });
          }
          return true;
        } catch (error) {
          console.error("Error during sign-in:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      await connectMongoDB();
      const dbUser = await User.findOne({ email: token.email || user?.email });

      if (!dbUser) {
        return token;
      }

      token.id = dbUser._id.toString();
      token.name = dbUser.name;
      token.email = dbUser.email;
      token.username = dbUser.username;
      token.picture = dbUser.profileImage || token.picture;
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.username = token.username;
      session.user.image = token.picture || session.user.image;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
