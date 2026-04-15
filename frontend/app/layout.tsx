import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARGUS — Real-time DeFi Monitor",
  description: "Real-time DeFi chain movement monitoring. Get whale alerts and liquidity updates on Telegram.",
  openGraph: {
    title: "ARGUS — Real-time DeFi Monitor",
    description: "Real-time DeFi chain movement monitoring. Get whale alerts and liquidity updates on Telegram.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
