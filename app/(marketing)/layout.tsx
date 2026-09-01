import { Toaster } from "@/components/ui/toaster";

export default function MarketingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      {children}
      <Toaster richColors position="top-right" closeButton />
    </div>
  );
}
