"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Ticket, ArrowLeft, Lock, Sparkles, Loader2, Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  showSuccess,
  showError,
  showInfo,
  showConfirm
} from "@/lib/ui/modals";

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

type Mode = "signin" | "signup";

function AuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const modeParam: Mode = (searchParams.get("mode") === "signup" ? "signup" : "signin");
  const next = searchParams.get("next") || undefined;

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>(modeParam);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMode(modeParam);
  }, [modeParam]);

  const handleBack = (e: React.MouseEvent) => {
    if (typeof window !== "undefined" && window.history.length > 2) {
      e.preventDefault();
      window.history.back();
    }
  };

  async function verifyEmailNotRegistered(
    e: string
  ): Promise<"ok" | "exists" | "invalid"> {
    if (!EMAIL_RE.test(e)) return "invalid";
    setCheckingEmail(true);
    try {
      const r = await fetch(
        "/api/auth/exists?email=" + encodeURIComponent(e),
        { method: "GET", credentials: "include" }
      );
      const j = (await r.json().catch(() => ({ ok: false, exists: false }))) as {
        ok?: boolean;
        exists?: boolean;
      };
      if (!j.ok) return "ok"; // mejor continuar y que supabase auth dé error
      return j.exists ? "exists" : "ok";
    } catch {
      return "ok";
    } finally {
      setCheckingEmail(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const emailTrim = email.trim().toLowerCase();
    if (!EMAIL_RE.test(emailTrim)) {
      void showError({
        title: "Correo inválido",
        message: "Ingresa un email válido (ej: tu@correo.com)."
      });
      return;
    }
    if (password.length < 6) {
      void showError({
        title: "Contraseña muy corta",
        message: "La contraseña debe tener al menos 6 caracteres."
      });
      return;
    }
    if (mode === "signup") {
      if (password !== confirmPassword) {
        void showError({
          title: "Contraseñas no coinciden",
          message: "Revisa los campos de contraseña y confirmación."
        });
        return;
      }
      const stat = await verifyEmailNotRegistered(emailTrim);
      if (stat === "exists") {
        void showError({
          title: "Esta cuenta ya está registrada",
          html:
            `El correo <b>${escapeHtml(emailTrim)}</b> ya tiene una cuenta en RifasCenter.<br/>` +
            `Usa <b>"Inicia sesión"</b> arriba o haz clic en <b>"Cambiar a Iniciar Sesión"</b> abajo.`
        });
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: emailTrim,
          password,
          options: {
            emailRedirectTo:
              (typeof window !== "undefined"
                ? window.location.origin
                : "") + `/api/auth/callback?next=${encodeURIComponent(next || redirectTo)}`,
            data: {
              full_name: fullName.trim() || emailTrim.split("@")[0]
            }
          }
        });
        if (error) {
          const msg = error.message || "Error creando cuenta.";
          // Supabase SDK indica "User already registered" en algunos idiomas/casos
          if (/already|registrad|existe|ocupado/i.test(msg)) {
            void showError({
              title: "Esta cuenta ya está registrada",
              html:
                `El correo <b>${escapeHtml(emailTrim)}</b> ya existe. Inicia sesión en su lugar.`
            });
          } else {
            void showError({ title: "No se pudo crear la cuenta", message: msg });
          }
          return;
        }
        const user = data?.user;
        const ses = data?.session;
        if (!ses && user && !user.email_confirmed_at) {
          await showSuccess({
            title: "¡Cuenta creada! 🎉",
            html:
              `Revisa tu correo <b>${escapeHtml(emailTrim)}</b>.<br/>` +
              `Te enviamos un enlace de confirmación para activar tu cuenta y empezar a participar.`,
            timer: 4200
          });
          // Cambiar a modo signin para que inmediatamente pueda loguearse
          setPassword("");
          setConfirmPassword("");
          setMode("signin");
          router.replace(
            `/auth?mode=signin&redirectTo=${encodeURIComponent(redirectTo)}`
          );
          return;
        }
        // Sesión inmediata (si Supabase confirma email automático en modo disable confirmation)
        void showSuccess({
          title: "¡Bienvenido!",
          message: "Sesión iniciada. Redirigiendo…",
          timer: 1800,
          onClose: () => router.replace(redirectTo)
        });
        return;
      }

      // ============= SIGN IN =============
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailTrim,
        password
      });
      if (error) {
        const msg = error.message || "Credenciales incorrectas.";
        // Detectar "Invalid login credentials" vs "Email not confirmed"
        if (/not.*confirm|pendient|verifica|confirmar/i.test(msg)) {
          const goResend = await showConfirm({
            title: "Correo sin confirmar",
            html:
              `Tu cuenta <b>${escapeHtml(emailTrim)}</b> aún no ha sido confirmada.<br/>` +
              `Revisa tu bandeja o reenvía el enlace ahora.`,
            confirmText: "Reenviar enlace",
            cancelText: "Volver",
            level: "warning"
          });
          if (goResend) {
            const { error: e2 } = await supabase.auth.resend({
              type: "signup",
              email: emailTrim,
              options: {
                emailRedirectTo:
                  (typeof window !== "undefined"
                    ? window.location.origin
                    : "") +
                  `/api/auth/callback?next=${encodeURIComponent(next || redirectTo)}`
              }
            });
            if (e2) {
              void showError({
                title: "No se pudo reenviar",
                message: e2.message || "Intenta en 1 minuto."
              });
            } else {
              void showSuccess({
                title: "Enlace reenviado",
                html:
                  `Se envió un nuevo enlace a <b>${escapeHtml(emailTrim)}</b>.<br/>` +
                  `Revisa tu bandeja (y spam) y haz clic para confirmar.`,
                timer: 3800
              });
            }
          }
          return;
        }
        if (/invalid|credencial|incorrect|password|email/i.test(msg)) {
          void showError({
            title: "Credenciales incorrectas",
            html:
              `Email o contraseña no válidos.<br/>` +
              `Prueba nuevamente o usa <b>"Olvidaste tu contraseña?"</b> para recuperar.`
          });
        } else {
          void showError({
            title: "No se pudo iniciar sesión",
            message: msg
          });
        }
        return;
      }
      if (data?.session) {
        void showSuccess({
          title: "¡Bienvenido de vuelta! 🎉",
          html:
            `Has iniciado sesión como <b>${escapeHtml(emailTrim)}</b>. Redirigiendo…`,
          timer: 1600,
          onClose: () => router.replace(redirectTo)
        });
      } else {
        void showInfo({
          title: "Sigue los pasos",
          message:
            "Revisa tu correo para completar el inicio de sesión (enlace mágico o confirmación)."
        });
      }
    } catch (e: unknown) {
      console.error("Auth form error", e);
      void showError({
        title: "Error de conexión",
        message: "Sin conexión al servidor. Intenta nuevamente en 30 segundos."
      });
    } finally {
      setLoading(false);
    }
  }

  const goToMode = (m: Mode, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    router.replace(
      `/auth?mode=${m}&redirectTo=${encodeURIComponent(redirectTo)}`,
      { scroll: false }
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, hsla(348, 97%, 65%, 0.18), transparent 55%), radial-gradient(circle at 85% 10%, hsla(270, 95%, 60%, 0.16), transparent 50%), radial-gradient(circle at 60% 90%, hsla(185, 95%, 55%, 0.12), transparent 55%)"
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-6 sm:mb-10 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-cta shadow-cta text-white transition-transform group-hover:scale-105">
              <Ticket className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight">
              Rifas<span className="text-brand-rose">Center</span>
            </span>
          </Link>

          <Button asChild variant="ghost" size="sm">
            <Link href={redirectTo} onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center py-4">
          <div className="hidden lg:block space-y-8">
            <Badge variant="outline" className="bg-white/70 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-brand-rose" />
              Beta abierta · Regístrate gratis
            </Badge>

            <h1 className="font-display font-black tracking-tight !leading-[1.05]">
              <span className="text-5xl block mb-3 text-slate-900">
                Tu número, tu premio,
              </span>
              <span className="text-5xl md:text-6xl block bg-gradient-to-r from-brand-rose via-fuchsia-500 to-brand-violet bg-clip-text text-transparent">
                tu causa.
              </span>
            </h1>

            <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
              Participa en rifas de premios increíbles o crea la tuya para
              recaudar fondos por la causa que te importa. Con solo una cuenta
              tienes acceso a todo.
            </p>

            <ul className="space-y-3 text-slate-700 max-w-md">
              {[
                "Participa en rifas en 2 minutos",
                "Crea rifas ilimitadas gratis",
                "Pagos seguros vía Mercado Pago",
                "Sorteos 100% transparentes y públicos"
              ].map((i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-rose/10 text-brand-rose">
                    <Lock className="h-3 w-3" />
                  </span>
                  <span className="text-sm font-medium">{i}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full mx-auto max-w-md">
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-1 rounded-[20px] opacity-60 blur-xl"
                style={{
                  background:
                    "linear-gradient(135deg, hsla(348, 97%, 65%, 0.5), hsla(270, 95%, 60%, 0.5))"
                }}
              />
              <div className="relative rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur p-5 sm:p-8 shadow-2xl">
                <div className="mb-6 flex flex-col items-center text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-cta shadow-cta text-white mb-3">
                    <Ticket className="h-6 w-6" strokeWidth={2.5} />
                  </span>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                    {mode === "signup" ? "Crea tu cuenta" : "Inicia sesión"}
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-600">
                    {mode === "signup"
                      ? "En 30 segundos. Sin tarjeta ni letra pequeña."
                      : "Bienvenido de vuelta. Continúa participando."}
                  </p>
                </div>

                {mounted && (
                  <form onSubmit={onSubmit} className="space-y-4">
                    {mode === "signup" && (
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="af-fn"
                          className="text-sm font-medium text-slate-700"
                        >
                          Nombre completo
                        </Label>
                        <Input
                          id="af-fn"
                          autoComplete="name"
                          placeholder="Ej: Alejandro Gómez"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="h-11 text-base rounded-xl border-slate-200 focus:ring-brand-rose/20 focus:border-brand-rose/60"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5 relative">
                      <Label
                        htmlFor="af-email"
                        className="text-sm font-medium text-slate-700"
                      >
                        Correo electrónico
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                          id="af-email"
                          type="email"
                          autoComplete="email"
                          placeholder="tu@correo.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11 pl-10 text-base rounded-xl border-slate-200 focus:ring-brand-rose/20 focus:border-brand-rose/60"
                          disabled={loading}
                        />
                      </div>
                      {checkingEmail && (
                        <div className="text-[11px] font-bold text-brand-violet flex items-center gap-1.5 mt-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Verificando correo…
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="af-pwd"
                          className="text-sm font-medium text-slate-700"
                        >
                          Contraseña
                        </Label>
                        {mode === "signin" && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              void (async () => {
                                if (!EMAIL_RE.test(email.trim().toLowerCase())) {
                                  void showError({
                                    title: "Ingresa tu correo primero",
                                    message:
                                      "Escribe el email para recuperar la contraseña."
                                  });
                                  return;
                                }
                                const { error } =
                                  await supabase.auth.resetPasswordForEmail(
                                    email.trim().toLowerCase(),
                                    {
                                      redirectTo:
                                        (typeof window !== "undefined"
                                          ? window.location.origin
                                          : "") + "/perfil?reset=1"
                                    }
                                  );
                                if (error) {
                                  void showError({
                                    title: "No se pudo enviar",
                                    message:
                                      error.message || "Intenta de nuevo."
                                  });
                                } else {
                                  void showSuccess({
                                    title: "Enlace enviado",
                                    html:
                                      `Revisa <b>${escapeHtml(email.trim().toLowerCase())}</b>.<br/>` +
                                      `Seguí las instrucciones para generar una nueva contraseña.`,
                                    timer: 4000
                                  });
                                }
                              })();
                            }}
                            className="text-xs font-semibold text-brand-rose hover:text-brand-rose/80 transition"
                          >
                            ¿Olvidaste tu contraseña?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          id="af-pwd"
                          type={showPwd ? "text" : "password"}
                          autoComplete={
                            mode === "signin" ? "current-password" : "new-password"
                          }
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-11 pr-11 text-base rounded-xl border-slate-200 focus:ring-brand-rose/20 focus:border-brand-rose/60"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd((s) => !s)}
                          tabIndex={-1}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-lg text-slate-400 hover:text-brand-rose hover:bg-brand-rose/5 transition"
                          aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showPwd ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {mode === "signup" && (
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="af-pwd2"
                          className="text-sm font-medium text-slate-700"
                        >
                          Confirmar contraseña
                        </Label>
                        <Input
                          id="af-pwd2"
                          type={showPwd ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-11 text-base rounded-xl border-slate-200 focus:ring-brand-rose/20 focus:border-brand-rose/60"
                          disabled={loading}
                        />
                      </div>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      disabled={loading || checkingEmail}
                      className={cn(
                        "h-11 w-full rounded-xl font-bold shadow-cta transition text-base !bg-gradient-to-r !from-brand-rose !to-brand-violet text-white hover:!brightness-110 active:scale-[0.98] disabled:opacity-70"
                      )}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {mode === "signup"
                            ? "Creando cuenta…"
                            : "Iniciando sesión…"}
                        </>
                      ) : (
                        <>{mode === "signup" ? "Crear cuenta" : "Entrar"}</>
                      )}
                    </Button>

                    <div className="pt-2 text-sm text-center">
                      {mode === "signup" ? (
                        <>
                          <span className="text-slate-600">
                            ¿Ya tienes cuenta?{" "}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => goToMode("signin", e)}
                            className="font-semibold text-brand-rose hover:text-brand-rose/80 transition"
                          >
                            Inicia sesión
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-600">
                            ¿No tienes cuenta?{" "}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => goToMode("signup", e)}
                            className="font-semibold text-brand-rose hover:text-brand-rose/80 transition"
                          >
                            Regístrate gratis
                          </button>
                        </>
                      )}
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-200/80 text-xs text-slate-500 text-center leading-relaxed">
                      Al continuar aceptas los{" "}
                      <span
                        title="Próximamente"
                        className="inline-flex items-center gap-1 underline decoration-slate-300 text-slate-500 cursor-not-allowed select-none font-medium"
                      >
                        Términos y condiciones
                        <span className="rounded-full bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 not-italic no-underline">
                          Pronto
                        </span>
                      </span>{" "}
                      y la{" "}
                      <span
                        title="Próximamente"
                        className="inline-flex items-center gap-1 underline decoration-slate-300 text-slate-500 cursor-not-allowed select-none font-medium"
                      >
                        Política de privacidad
                        <span className="rounded-full bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 not-italic no-underline">
                          Pronto
                        </span>
                      </span>
                      .
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center text-slate-500">
          Cargando...
        </div>
      }
    >
      <AuthInner />
    </Suspense>
  );
}
