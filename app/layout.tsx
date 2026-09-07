import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import Script from "next/script";
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
      <head>
        {/*
          Script ANTES de React hydrate: elimina atributos data-trae-ref="eX"
          que el IDE/extensión Trae inyecta en el DOM SSR antes de hidratar.
          Estos atributos provocan "Hydration Mismatch" porque React no los
          generó en el virtual DOM client-side.
          strategy="beforeInteractive" REQUIERE estar dentro de <head> en
          Next.js App Router (de lo contrario lanza warn: no se sabe el orden).
        */}
        <Script id="trae-cleanup-prehydrate" strategy="beforeInteractive">
          {`(function(){
  try {
    var doc = document;
    /** @param {Element} rootEl @return {number} */
    function cleanTraeAttrs(rootEl) {
      if (!rootEl || !rootEl.querySelectorAll) return 0;
      var rem = 0;
      var attrAll = rootEl.querySelectorAll('*');
      var m = attrAll.length, j = 0, node, attrs, ai, att;
      for (j = 0; j < m; j++) {
        node = attrAll[j];
        if (!node || node.nodeType !== 1 || !node.hasAttributes) continue;
        attrs = node.attributes;
        for (ai = attrs.length - 1; ai >= 0; ai--) {
          att = attrs[ai];
          if (att && typeof att.name === 'string' && att.name.indexOf('data-trae-') === 0) {
            node.removeAttribute(att.name); rem++;
          }
        }
      }
      return rem;
    }
    var removed = cleanTraeAttrs(doc.documentElement);

    // MutationObserver live cleanup para navegaciones SPA.
    if (typeof MutationObserver !== 'undefined') {
      var obs = new MutationObserver(function (mutations) {
        try {
          var k = 0, L = mutations.length, mut, nodes, ni, nL, nd, attrs, ai, att;
          for (k = 0; k < L; k++) {
            mut = mutations[k];
            if (mut.type === 'attributes' && mut.target && mut.target.nodeType === 1) {
              attrs = mut.target.attributes;
              if (attrs) {
                for (ai = attrs.length - 1; ai >= 0; ai--) {
                  att = attrs[ai];
                  if (att && typeof att.name === 'string' && att.name.indexOf('data-trae-') === 0) {
                    mut.target.removeAttribute(att.name);
                  }
                }
              }
            }
            nodes = mut.addedNodes;
            if (nodes && nodes.length) {
              nL = nodes.length;
              for (ni = 0; ni < nL; ni++) {
                nd = nodes[ni];
                if (nd && nd.nodeType === 1) cleanTraeAttrs(nd);
              }
            }
          }
        } catch (__e2) { /* ignore */ }
      });
      obs.observe(doc.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['data-trae-ref','data-trae-id','data-trae-ctx']
      });
      window.__RIFAS_TRAE_OBSERVER__ = obs;
    }

    window.__RIFAS_TRAE_CLEANUP_DONE__ = { removed: removed, at: Date.now() };
  } catch (__e) { /* no-op */ }
})();`}
        </Script>
      </head>
      <body
        className={`${inter.className} font-sans antialiased min-h-screen flex flex-col bg-slate-50`}
      >
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
