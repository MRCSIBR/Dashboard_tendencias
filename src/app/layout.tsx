import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrendDash — Trend Intelligence Dashboard",
  description:
    "Predictive analytics engine powered by real-time Google Trends data. Explore interest trends with EMA, RSI and MACD indicators.",
  keywords: ["google trends", "trend analysis", "EMA", "RSI", "MACD", "analytics"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
