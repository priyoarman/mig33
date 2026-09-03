import bcrypt from "bcryptjs";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth, { type AuthOptions } from "next-auth";

import connectMongoDB from "@/lib/mongodb";
import { generateUniqueUsername } from "@/lib/username";
import User from "@/models/user";

type AuthOptionsWithTrustHost = AuthOptions & { trustHost: boolean };

export const authOptions: AuthOptionsWithTrustHost = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {},
      async authorize(credentials) {
        const { email, password } = (credentials ?? {}) as {
          email?: string;
          password?: string;
        };
        if (!email || !password) return null;

        await connectMongoDB();
        const user = await User.findOne({ email });
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          username: user.username,
          image: user.profileImage ?? null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
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

      if (!dbUser) return token;

      token.id = dbUser._id.toString();
      token.name = dbUser.name;
      token.email = dbUser.email;
      token.username = dbUser.username;
      token.picture = dbUser.profileImage || token.picture;
      return token;
    },

    async session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.username) session.user.username = token.username;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.image = token.picture || session.user.image;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };