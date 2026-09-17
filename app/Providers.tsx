"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { RealtimeProvider } from "./components/RealtimeProvider";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider>
      <RealtimeProvider>{children}</RealtimeProvider>
    </SessionProvider>
  );
};
