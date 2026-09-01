import { redirect } from "next/navigation";

export default function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  void redirect("/rifas");
  return <div className="flex min-h-screen flex-col">{children}</div>;
}
