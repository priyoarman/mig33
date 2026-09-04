import { withAuth, type NextAuthMiddlewareOptions } from "next-auth/middleware";

const authOptions: NextAuthMiddlewareOptions = {
  callbacks: {
    authorized: ({ token }): boolean => Boolean(token),
  },
};

export default withAuth(authOptions);

export const config = {
  matcher: ["/profile", "/messages", "/notifications"],
};
