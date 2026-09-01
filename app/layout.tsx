import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: {
    default: "RifasCenter — Tu número, tu premio, tu causa.",
    template: "%s · RifasCenter"
  },
  description:
    "Participa en rifas de premios increíbles o crea la tuya. Apoya causas solidarias mientras tienes la oportunidad de ganar.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "RifasCenter — Tu número, tu premio, tu causa.",
    description:
      "Rifas y sorteos digitales: participa por premios o crea rifas solidarias para tu comunidad.",
    type: "website",
    locale: "es_LA"
  },
  twitter: {
    card: "summary_large_image",
    title: "RifasCenter",
    description: "Tu número, tu premio, tu causa."
  },
  keywords: ["rifas", "sorteos", "premios", "solidario", "rifas online", "ganar"]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable}`}>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
