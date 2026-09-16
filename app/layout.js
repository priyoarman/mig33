import LeftBar from "./components/LeftBar";
import RightBar from "./components/RightBar";
import MobileTopBar from "./components/MobileTopBar";
import IosInstallBanner from "./components/IosInstallBanner";
import "./globals.css";
import { AuthProvider } from "./Providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  title: "mig33",
  description: "Created by Arman Hossain",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "mig33",
  },
  icons: {
    apple: "/icon-192.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-100" suppressHydrationWarning>
        <AuthProvider>
          <div className="reddit-shell reddit-layout text-xl">
            <LeftBar />
            <MobileTopBar />
            <main className="reddit-main-column min-w-0">
              <IosInstallBanner />
              {children}
            </main>
            <Analytics />
            <SpeedInsights />
            <RightBar />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
