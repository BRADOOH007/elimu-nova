import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ErrorCatcher } from "@/components/error-catcher";

// System font stack — avoids fetching fonts from Google at build time, so
// `next build` never fails in restricted/offline networks.
const geistSans = { variable: '--font-geist-sans' } as const;
const geistMono = { variable: '--font-geist-mono' } as const;

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
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  keywords: ["education", "AI", "learning", "teaching", "lesson plans", "schemes of work"],
  authors: [{ name: "ElimuNova AI Team" }],
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: 'any' },
      { url: '/favicon.png', sizes: '32x32',   type: 'image/png' },
      { url: '/favicon.png', sizes: '16x16',   type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple:    [{ url: '/favicon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: "ElimuNova AI - Intelligent Education Platform",
    description: "Transform education with AI-powered lesson plans, schemes of work, and personalized learning experiences.",
    type: "website",
    images: [{ url: '/logo-black.png', width: 400, height: 400, alt: 'ElimuNova AI Logo' }],
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
        <link rel="icon" href="/favicon.png" type="image/png" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="16x16" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="msapplication-TileImage" content="/favicon.png" />
        <meta name="msapplication-TileColor" content="#667eea" />
        <link rel="manifest" href="/manifest.json" />
        <script dangerouslySetInnerHTML={{__html:'(function(){var n=new MutationObserver(function(m){for(var i=0;i<m.length;i++){if(m[i].type==="attributes"){m[i].target.removeAttribute("rtrvr-ls");m[i].target.removeAttribute("rtrvr-hk")}}});n.observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:["rtrvr-ls","rtrvr-hk"]})})()'}} />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ErrorCatcher />
          {children}
        </Providers>
      </body>
    </html>
  );
}
