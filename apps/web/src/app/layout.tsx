import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
  icons: { icon: "/icons/app-icon-192.png", apple: "/icons/app-icon-192.png" },
};

export const viewport: Viewport = { themeColor: [
  { media: "(prefers-color-scheme: light)", color: "#f4f7fb" },
  { media: "(prefers-color-scheme: dark)", color: "#08111f" },
] };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#main-content">
          Bỏ qua đến nội dung chính
        </a>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
