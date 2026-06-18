import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "ElimuNova AI - Intelligent Education Platform",
  description: "Transform education with AI-powered lesson plans, schemes of work, and personalized learning experiences.",
  keywords: ["education", "AI", "learning", "teaching", "lesson plans", "schemes of work"],
  authors: [{ name: "ElimuNova AI Team" }],
  themeColor: '#ffffff',
  colorScheme: 'light',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: [
      { url: '/logo-64.png', sizes: '32x32',   type: 'image/png' },
      { url: '/logo-64.png', sizes: '16x16',   type: 'image/png' },
      { url: '/logo-64.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo-64.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/logo-64.png',
    apple: [
      { url: '/logo-64.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: "ElimuNova AI - Intelligent Education Platform",
    description: "Transform education with AI-powered lesson plans, schemes of work, and personalized learning experiences.",
    type: "website",
    images: ['/logo-64.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <head>
        <link rel="icon" href="/logo-64.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/logo-64.png" type="image/png" sizes="16x16" />
        <link rel="shortcut icon" href="/logo-64.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo-64.png" />
        <meta name="msapplication-TileImage" content="/logo-64.png" />
        <meta name="msapplication-TileColor" content="#667eea" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
