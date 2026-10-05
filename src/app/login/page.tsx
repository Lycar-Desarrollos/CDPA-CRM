"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { ArrowRight, CheckCircle2, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { Logo, Spinner } from "@/components/ui";

function traducirError(code: string) {
  const map: Record<string, string> = {
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "No existe una cuenta con ese correo.",
    "auth/wrong-password": "Contraseña incorrecta.",
    "auth/email-already-in-use": "Ese correo ya está registrado.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/invalid-email": "Correo inválido.",
    "auth/operation-not-allowed": "Este método de acceso no está habilitado en Firebase Authentication → Sign-in method.",
    "auth/configuration-not-found": "Habilita Firebase Authentication (Email/Contraseña) en la consola.",
    "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
    "auth/popup-blocked": "El navegador bloqueó la ventana emergente. Permite pop-ups e intenta de nuevo.",
    "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase Authentication → Configuración → Dominios autorizados.",
    "auth/account-exists-with-different-credential": "Ya existe una cuenta con ese correo usando otro método de acceso.",
  };
  return map[code] ?? "Ocurrió un error. Intenta de nuevo.";
}

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (modo === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (nombre) await updateProfile(cred.user, { displayName: nombre });
      }
      toast.success("¡Bienvenido!");
    } catch (err) {
      toast.error(traducirError((err as { code?: string }).code ?? ""));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      toast.success("¡Bienvenido!");
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") toast.error(traducirError(code));
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!email) return toast.info("Escribe tu correo para enviarte el enlace.");
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Te enviamos un correo para restablecer tu contraseña.");
    } catch (err) {
      toast.error(traducirError((err as { code?: string }).code ?? ""));
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel visual */}
      <div className="relative hidden overflow-hidden bg-slate-950 lg:block">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-600/40 blur-[120px]" />
        <div className="absolute -right-20 bottom-0 h-[400px] w-[400px] rounded-full bg-cyan-500/20 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo dark />
          <div>
            <h1 className="text-5xl leading-tight font-extrabold tracking-tight text-white">
              Contratos de renta,
              <br />
              <span className="bg-gradient-to-r from-brand-300 to-cyan-300 bg-clip-text text-transparent">
                en minutos.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-slate-400">
              Gestiona clientes, flota y contratos con folio automático, inspección digital y firma en pantalla.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Folios consecutivos automáticos",
                "Diagrama de daños y nivel de gasolina",
                "Firma digital y pagaré con importe en letra",
                "Impresión / PDF lista para entregar",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-brand-400" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} CHIP Rent a Car</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="animate-fade-up w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {modo === "login" ? "Inicia sesión" : "Crea tu cuenta"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {modo === "login" ? "Accede al panel de contratos." : "Registra un usuario para tu equipo."}
          </p>

          <button type="button" onClick={google} disabled={busy} className="btn-secondary mt-8 w-full py-3">
            <svg viewBox="0 0 48 48" className="h-5 w-5">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            Continuar con Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">
            <div className="h-px flex-1 bg-slate-200" /> o con tu correo <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {modo === "registro" && (
              <div className="relative">
                <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="input pl-10" placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-10"
                type="email"
                required
                placeholder="correo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-10"
                type="password"
                required
                minLength={6}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {modo === "login" && (
              <div className="flex justify-end">
                <button type="button" onClick={reset} className="text-xs font-semibold text-brand-600 hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
            <button className="btn-primary w-full py-3" disabled={busy}>
              {busy ? <Spinner className="h-4 w-4 border-white border-t-transparent" /> : null}
              {modo === "login" ? "Entrar" : "Crear cuenta"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            {modo === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              onClick={() => setModo(modo === "login" ? "registro" : "login")}
              className="font-semibold text-brand-600 hover:underline"
            >
              {modo === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
