import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// viewport must be exported separately in Next.js 15+
export const viewport: Viewport = {
  width:         'device-width',
  initialScale:  1,
  maximumScale:  1,
  themeColor:    '#ffffff',
}

export const metadata: Metadata = {
  title: "ElimuNova AI - Intelligent Education Platform",
  description: "Transform education with AI-powered lesson plans, schemes of work, and personalized learning experiences.",
  keywords: ["education", "AI", "learning", "teaching", "lesson plans", "schemes of work"],
  authors: [{ name: "ElimuNova AI Team" }],
icons: {
    icon: [
      { url: '/logo-black-removebg-preview.png', type: 'image/png', sizes: 'any' },
    ],
    shortcut: '/logo-black-removebg-preview.png',
    apple:    [{ url: '/logo-black-removebg-preview.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: "ElimuNova AI - Intelligent Education Platform",
    description: "Transform education with AI-powered lesson plans, schemes of work, and personalized learning experiences.",
    type: "website",
    images: ['/logo-black-removebg-preview.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
<head>
        <link rel="icon" href="/logo-black-removebg-preview.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/logo-black-removebg-preview.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo-black-removebg-preview.png" />
        <meta name="msapplication-TileImage" content="/logo-black-removebg-preview.png" />
        <meta name="msapplication-TileColor" content="#667eea" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
