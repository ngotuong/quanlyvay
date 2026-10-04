import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/app/theme-provider";
import { parseTheme, themeColors, themeCookieName } from "@/lib/app/theme.mjs";
import { PwaRegister } from "@/components/pwa-register";
import { NavigationFeedback } from "@/components/app/navigation-feedback";
import { DirtyNavigationGuard } from "@/components/app/dirty-navigation-guard";
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

export async function generateViewport(): Promise<Viewport> {
  const cookieStore = await cookies();
  return { themeColor: themeColors(cookieStore.get(themeCookieName)?.value) };
}

import { PrivacyProvider } from "@/components/app/privacy-provider";

function InitialApplicationLoading() {
  return <div className="initial-app-loading" id="initial-app-loading" role="status" aria-busy="true" aria-live="polite">
    <div className="initial-app-loading-mark" aria-hidden="true" />
    <strong>Đang mở không gian tài chính…</strong>
    <span>Đang kiểm tra phiên đăng nhập và chuẩn bị dữ liệu an toàn.</span>
  </div>;
}

async function ResolvedApplication({ children }: { children: ReactNode }) {
  const [profile, cookieStore] = await Promise.all([getAuthenticatedProfile(), cookies()]);
  const showAppShell = Boolean(profile && !profile.must_change_password);
  const unreadCount = showAppShell ? await getUnreadNotificationCount() : 0;

  return <PrivacyProvider initialPrivacy={cookieStore.get("qlv_privacy_mode")?.value !== "false"}>
    <a className="skip-link" href="#main-content">Bỏ qua đến nội dung chính</a>
    <PwaRegister unreadCount={unreadCount} />
    <NetworkStatus />
    <Suspense fallback={null}><NavigationFeedback /></Suspense>
    {showAppShell && profile ? <AppShell profile={profile} unreadCount={unreadCount}>{children}</AppShell> : children}
  </PrivacyProvider>;
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {

  const preference = parseTheme((await cookies()).get(themeCookieName)?.value);
  return (
    <html
      lang="vi"
      data-theme={preference}
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider initialPreference={preference}>
        <DirtyNavigationGuard />
        <Suspense fallback={<InitialApplicationLoading />}><ResolvedApplication>{children}</ResolvedApplication></Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
