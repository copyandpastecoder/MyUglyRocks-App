import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { SettingsProvider } from "@/providers/settings-provider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "MyUglyRocks - Track Your Rock Tumbling Journey",
  description: "Track your rock tumbling cycles, share results, and learn from the community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <SettingsProvider>
                {children}
                <Toaster />
              </SettingsProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
