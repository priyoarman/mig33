"use client";

import { SessionProvider } from "next-auth/react";
import { RealtimeProvider } from "./components/RealtimeProvider";

export const AuthProvider = ({ children }) => {
  return (
    <SessionProvider>
      <RealtimeProvider>{children}</RealtimeProvider>
    </SessionProvider>
  );
};
