import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quản Lý Vay Cá Nhân",
    short_name: "Quản Lý Vay",
    description: "Quản lý khoản đi vay, cho vay, lãi và dòng tiền cá nhân.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#4f46e5",
    lang: "vi",
    orientation: "any",
    icons: [
      { src: "/icons/brand-logo-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/brand-logo-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/brand-logo-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
