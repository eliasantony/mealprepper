import type { Metadata } from "next";
import React from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Layout/Header";
import { MainLayout } from "@/components/Layout/MainLayout";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { InstallPrompt } from "@/components/InstallPrompt";
import { NotificationPermission } from "@/components/NotificationPermission";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import clsx from "clsx";
import { Toaster } from "sonner";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MealPrepper - AI Meal Planning",
  description: "Plan your weekly meals with the power of AI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MealPrepper",
  },
  icons: {
    icon: "/logo-round.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={clsx(plusJakartaSans.className, "bg-background min-h-screen flex flex-col")} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <React.Suspense fallback={null}>
              <AuthGuard>
                <MainLayout>
                  {children}
                </MainLayout>
              </AuthGuard>
            </React.Suspense>
            <InstallPrompt />
            <NotificationPermission />
          </AuthProvider>
          <Toaster />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
