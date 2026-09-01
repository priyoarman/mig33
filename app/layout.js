import LeftBar from "./components/LeftBar";
import RightBar from "./components/RightBar";
import "./globals.css";
import { AuthProvider } from "./Providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  title: "mig33",
  description: "Created by Arman Hossain",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100" suppressHydrationWarning>
        <AuthProvider>
          <div className="reddit-shell reddit-layout text-xl">
            <LeftBar />
            <main className="reddit-main-column min-w-0">{children}</main>
            <Analytics />
            <SpeedInsights />
            <RightBar />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
