"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { Ticket, ArrowLeft, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function AuthInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const modeParam = searchParams.get("mode");
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState<string>("");
  const [navigating, setNavigating] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, _session) => {
      if (event === "SIGNED_IN" && navigating === false) {
        setNavigating(true);
        setTimeout(() => {
          router.replace(redirectTo);
        }, 100);
      }
    });
    return () => subscription.unsubscribe();
  }, [mounted, supabase, redirectTo, navigating, router]);

  const handleBack = (e: React.MouseEvent) => {
    if (typeof window !== "undefined" && window.history.length > 2) {
      e.preventDefault();
      window.history.back();
    }
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
              Rifas
              <span className="text-brand-rose">Center</span>
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
                    {modeParam === "signup"
                      ? "Crea tu cuenta"
                      : "Inicia sesión"}
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-600">
                    {modeParam === "signup"
                      ? "En 30 segundos. Sin tarjeta ni letra pequeña."
                      : "Bienvenido de vuelta. Continúa participando."}
                  </p>
                </div>

                {mounted && origin && (
                  <div
                    className={cn(
                      "w-full",
                      "[&_supabase-auth]:w-full",
                      "[&_button[type='submit']]:shadow-cta",
                      "[&_button[type='submit']]:!bg-gradient-to-r [&_button[type='submit']]:!from-brand-rose [&_button[type='submit']]:!to-brand-violet",
                      "[&_button[type='submit']]:!border-0 [&_button[type='submit']]:!text-white",
                      "[&_button[type='submit']]:hover:!brightness-110",
                      "[&_button[type='submit']]:!font-semibold [&_button[type='submit']]:!h-11 [&_button[type='submit']]:!text-base [&_button[type='submit']]:!rounded-xl",
                      "[&_input[type='email']]:!h-11 [&_input[type='email']]:!text-base [&_input[type='email']]:!rounded-xl [&_input[type='email']]:!border-slate-200 [&_input[type='email']]:focus:!ring-2 [&_input[type='email']]:focus:!ring-brand-rose/20 [&_input[type='email']]:focus:!border-brand-rose/60",
                      "[&_input[type='password']]:!h-11 [&_input[type='password']]:!text-base [&_input[type='password']]:!rounded-xl [&_input[type='password']]:!border-slate-200 [&_input[type='password']]:focus:!ring-2 [&_input[type='password']]:focus:!ring-brand-rose/20 [&_input[type='password']]:focus:!border-brand-rose/60",
                      "[&_a]:!text-brand-rose [&_a]:hover:!text-brand-rose/80 [&_a]:!font-medium [&_a]:!text-sm",
                      "[&_label]:!text-sm [&_label]:!font-medium [&_label]:!text-slate-700",
                      "[&_div[role='alert']]:!rounded-xl [&_div[role='alert']]:!p-3 [&_div[role='alert']]:!text-sm",
                      "[&_hr]:!my-6 [&_hr]:!border-slate-200",
                      "[&_supabase-auth]:[&_h1]:!hidden"
                    )}
                  >
                    {/* Supabase Auth UI — componente de confianza del SDK oficial */}
                    <Auth
                      supabaseClient={supabase as never}
                      appearance={({
                        theme: "default",
                        variables: {
                          default: {
                            colors: {
                              brand: "hsl(348 83% 47%)",
                              brandAccent: "hsl(348 83% 40%)",
                              brandButtonText: "white",
                              defaultButtonBackground: "white",
                              defaultButtonBackgroundHover: "hsl(0 0% 98%)",
                              defaultButtonBorder: "hsl(210 20% 96%)",
                              defaultButtonText: "hsl(222 47% 11%)",
                              dividerBackground: "hsl(210 20% 96%)",
                              inputBackground: "white",
                              inputBorder: "hsl(210 20% 90%)",
                              inputBorderHover: "hsl(348 83% 72%)",
                              inputBorderFocus: "hsl(348 83% 57%)",
                              inputText: "hsl(222 47% 11%)",
                              inputLabelText: "hsl(215 16% 35%)",
                              inputPlaceholder: "hsl(215 16% 65%)",
                              messageText: "hsl(215 16% 35%)",
                              messageDangerBackground: "hsl(0 86% 97%)",
                              messageDangerText: "hsl(0 75% 35%)",
                              messageSuccessBackground: "hsl(145 80% 96%)",
                              messageSuccessText: "hsl(160 84% 22%)",
                              messageInfoBackground: "hsl(200 90% 96%)",
                              messageInfoText: "hsl(210 90% 32%)",
                              anchorTextColor: "hsl(348 83% 47%)",
                              anchorTextHoverColor: "hsl(348 83% 40%)"
                            },
                            borderRadius: {
                              buttonBorderRadius: "10px",
                              inputBorderRadius: "10px",
                              cardBorderRadius: "16px"
                            },
                            fonts: {
                              bodyFontFamily:
                                "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
                              buttonFontFamily:
                                "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
                              inputFontFamily:
                                "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
                              labelFontFamily:
                                "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
                              titleFontFamily:
                                "'Poppins', 'Inter', ui-sans-serif, system-ui"
                            }
                          }
                        },
                        className: {
                          anchor:
                            "text-sm font-medium text-brand-rose hover:text-brand-rose/80",
                          button:
                            "font-sans font-semibold transition-all duration-200 active:scale-[0.98]",
                          label: "text-sm font-medium",
                          input:
                            "text-base bg-white border-slate-200 transition-colors",
                          divider: "my-6",
                          loader: "text-brand-rose",
                          message: "rounded-xl p-3 text-sm",
                          container: "w-full"
                        }
                      } as never)}
                      providers={[]}
                      redirectTo={`${origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`}
                      onlyThirdPartyProviders={false}
                      socialLayout="vertical"
                      view={modeParam === "signup" ? "sign_up" : "sign_in"}
                      showLinks
                      localization={{
                        variables: {
                          sign_up: {
                            email_label: "Correo electrónico",
                            password_label: "Contraseña",
                            email_input_placeholder: "tu@correo.com",
                            password_input_placeholder: "••••••••",
                            button_label: "Crear cuenta",
                            loading_button_label: "Creando cuenta...",
                            social_provider_text: "Continuar con {{provider}}",
                            link_text: "¿No tienes cuenta? Regístrate",
                            confirmation_text:
                              "Te enviaremos un enlace de confirmación."
                          },
                          sign_in: {
                            email_label: "Correo electrónico",
                            password_label: "Contraseña",
                            email_input_placeholder: "tu@correo.com",
                            password_input_placeholder: "••••••••",
                            button_label: "Entrar",
                            loading_button_label: "Entrando...",
                            social_provider_text: "Entrar con {{provider}}",
                            link_text: "¿Ya tienes cuenta? Inicia sesión",
                            forgot_password_link: "¿Olvidaste tu contraseña?"
                          },
                          magic_link: {
                            button_label: "Enviar enlace mágico",
                            loading_button_label: "Enviando..."
                          },
                          forgotten_password: {
                            button_label: "Enviar instrucciones",
                            loading_button_label: "Enviando..."
                          },
                          update_password: {
                            button_label: "Actualizar contraseña",
                            loading_button_label: "Actualizando..."
                          }
                        }
                      } as never}
                    />
                  </div>
                )}

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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
