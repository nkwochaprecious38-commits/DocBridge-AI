import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "DocBridge: Document Intelligence Platform", template: "%s | DocBridge" },
  description: "DocBridge transforms complex documents into structured, searchable, and actionable information.",
  icons: { icon: [{ url: "/favicon.ico" }, { url: "/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/apple-touch-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
