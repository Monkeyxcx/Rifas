import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AdBannerPlaceholder } from "@/components/ads/AdBannerPlaceholder";
import { Toaster } from "@/components/ui/toaster";

export default function MarketingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />

      <div
        aria-hidden
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/70 bg-white/95 backdrop-blur px-2 sm:px-4 py-2 pb-2 sm:pb-3"
      >
        <div className="container max-w-content">
          <AdBannerPlaceholder
            label="Publicidad RifasCenter"
            height="64px"
          />
          <div className="h-[env(safe-area-inset-bottom)]" aria-hidden />
        </div>
      </div>

      <Toaster richColors position="top-right" closeButton />
    </div>
  );
}
