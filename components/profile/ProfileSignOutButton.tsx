"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";

export function ProfileSignOutButton() {
  const [pending, start] = useTransition();
  const [isPending, setIsPending] = useState(false);

  const onSignOut = async () => {
    setIsPending(true);
    try {
      const res = await fetch("/api/auth/signout", { method: "POST" });
      if (res.ok) {
        window.location.href = "/auth";
      } else {
        window.location.href = "/auth?error=signout";
      }
    } catch {
      window.location.href = "/auth";
    } finally {
      setIsPending(false);
    }
  };

  const allPending = pending || isPending;

  return (
    <Button
      type="button"
      variant="outline"
      className="!h-10 justify-start !border-rose-200 !bg-rose-50/40 !text-rose-700 hover:!bg-rose-100 font-bold"
      disabled={allPending}
      onClick={() => start(() => void onSignOut())}
    >
      {allPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      Cerrar sesión
    </Button>
  );
}

export default ProfileSignOutButton;
