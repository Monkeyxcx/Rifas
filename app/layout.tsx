import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap"
});

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap"
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "RifasCenter — Tu número, tu premio, tu causa.",
    template: "%s · RifasCenter"
  },
  description:
    "Participa en rifas de premios increíbles o crea la tuya. Apoya causas solidarias mientras tienes la oportunidad de ganar.",
  applicationName: "RifasCenter",
  keywords: [
    "rifas",
    "sorteos",
    "premios",
    "solidario",
    "rifas online",
    "ganar",
    "causas sociales"
  ],
  authors: [{ name: "RifasCenter" }],
  creator: "RifasCenter",
  publisher: "RifasCenter",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    locale: "es_LA",
    url: SITE_URL,
    siteName: "RifasCenter",
    title: "RifasCenter — Tu número, tu premio, tu causa.",
    description:
      "Rifas y sorteos digitales: participa por premios o crea rifas solidarias para tu comunidad."
  },
  twitter: {
    card: "summary_large_image",
    title: "RifasCenter",
    description: "Tu número, tu premio, tu causa."
  },
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable}`}>
      <body
        className={`${inter.className} font-sans antialiased min-h-screen flex flex-col bg-slate-50`}
      >
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
