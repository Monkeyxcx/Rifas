"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { showError } from "@/lib/ui/modals";

const BUCKET = "rifas-media";
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Props = {
  value: string;
  onChange: (url: string) => void;
  className?: string;
};

export default function PrizeImageDropzone({ value, onChange, className }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        void showError({
          title: "Formato no válido",
          message: "Usa JPG, PNG, WEBP o GIF."
        });
        return;
      }
      if (file.size > MAX_BYTES) {
        void showError({
          title: "Archivo muy grande",
          message: "El máximo es 5 MB."
        });
        return;
      }

      try {
        setUploading(true);
        const supabase = createClient();
        const {
          data: { user },
          error: authErr
        } = await supabase.auth.getUser();
        if (authErr || !user) {
          void showError({
            title: "Sesión requerida",
            message: "Inicia sesión para subir la imagen."
          });
          return;
        }

        const ext =
          file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) ||
          "jpg";
        const path = `${user.id}/prize-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;

        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type
        });
        if (error) throw error;

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        if (!data?.publicUrl) throw new Error("No se obtuvo la URL pública");
        onChange(data.publicUrl);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "No se pudo subir la imagen.";
        void showError({ title: "Error al subir", message });
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const onFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) void upload(file);
    },
    [upload]
  );

  return (
    <div className={cn("flex w-full flex-col items-center space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-xl border border-slate-200 bg-white aspect-[16/9] sm:max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Vista previa del premio"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-slate-900/70 to-transparent p-3">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-white disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Cambiar
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-white disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging(false);
            onFiles(e.dataTransfer.files);
          }}
          className={cn(
            "mx-auto flex h-28 w-full max-w-sm flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 text-center transition sm:h-32",
            dragging
              ? "border-brand-rose bg-brand-rose/5"
              : "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 hover:border-brand-rose/40 hover:bg-rose-50/30",
            uploading && "pointer-events-none opacity-70"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-brand-rose" />
              <p className="text-sm font-semibold text-slate-700">Subiendo a Storage…</p>
            </>
          ) : (
            <>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-white shadow-sm border border-slate-200">
                <ImagePlus className="h-4 w-4 text-brand-rose" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Arrastra la imagen aquí o haz clic
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  JPG, PNG, WEBP · máx. 5 MB
                </p>
              </div>
            </>
          )}
        </button>
      )}
    </div>
  );
}
