import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Suspense } from "react";
import { cookies } from "next/headers";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { NavigationFeedback } from "@/components/app/navigation-feedback";
import { NetworkStatus } from "@/components/app/network-status";
import { AppShell } from "@/components/app/app-shell";
import { getAuthenticatedProfile } from "@/lib/auth/session";
import { getUnreadNotificationCount } from "@/lib/business/queries";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quản lý vay cá nhân",
  description: "Quản lý khoản đi vay, cho vay và dòng tiền cá nhân.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Quản Lý Vay" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = { themeColor: [
  { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
  { media: "(prefers-color-scheme: dark)", color: "#090d18" },
] };

import { PrivacyProvider } from "@/components/app/privacy-provider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getAuthenticatedProfile();
  const showAppShell = Boolean(profile && !profile.must_change_password);
  const unreadCount = showAppShell ? await getUnreadNotificationCount() : 0;

  return (
    <html
      lang="vi"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PrivacyProvider initialPrivacy={(await cookies()).get("qlv_privacy_mode")?.value !== "false"}>
          <a className="skip-link" href="#main-content">
            Bỏ qua đến nội dung chính
          </a>
          <PwaRegister unreadCount={unreadCount} />
          <NetworkStatus />
          <Suspense fallback={null}><NavigationFeedback /></Suspense>
          {showAppShell && profile ? <AppShell profile={profile} unreadCount={unreadCount}>{children}</AppShell> : children}
        </PrivacyProvider>
      </body>
    </html>
  );
}
