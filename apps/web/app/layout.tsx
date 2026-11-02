import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MotionConfig } from "motion/react";
import QueryProvider from "@/components/QueryProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Terhal",
  description: "Terhal dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        {/* Turns movement off app-wide for people who ask their OS to reduce motion, keeping only the fades. */}
        <MotionConfig reducedMotion="user">
          <QueryProvider>{children}</QueryProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
