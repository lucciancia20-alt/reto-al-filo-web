import React, { useState } from 'react';
import {
  AlertCircle,
  Mail,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export default function AdminLoginView({
  firebaseReady,
  authLoading,
  emailInput,
  setEmailInput,
  passwordInput,
  setPasswordInput,
  authError,
  authInfo,
  onGoogleSignIn,
  onEmailSignIn,
  onPasswordReset,
}) {
  const [inputsEditable, setInputsEditable] = useState(false);

  const unlockAutofill = (e) => {
    setInputsEditable(true);
    e.currentTarget.removeAttribute('readOnly');
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6 flex items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <span className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 inline-flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </span>
          <h3 className="mt-3 font-display text-xl font-extrabold text-white">
            Acceso de Organización
          </h3>
          <p className="mt-1 text-xs text-stone-400">
            Ingresá con tu cuenta autorizada de Google o con correo electrónico y contraseña para
            editar la carrera en vivo.
          </p>
        </div>

        {!firebaseReady && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              Firebase no está configurado en este entorno. Verificá las variables de entorno de
              Firebase.
            </span>
          </div>
        )}

        {/* Acceso directo con Google */}
        <button
          type="button"
          onClick={onGoogleSignIn}
          disabled={authLoading || !firebaseReady}
          className="w-full min-h-[46px] inline-flex items-center justify-center gap-3 rounded-xl bg-zinc-950 border border-orange-500/80 hover:border-orange-400 text-orange-400 font-semibold text-sm px-4 py-3 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
            />
          </svg>
          <span>{authLoading ? 'Verificando con Google...' : 'Ingresar con Google'}</span>
        </button>

        {/* Divisor */}
        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-stone-800" />
          <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
            o ingresá con tu correo y contraseña
          </span>
          <div className="flex-grow border-t border-stone-800" />
        </div>

        {/* Acceso con Correo electrónico y Contraseña */}
        <form
          onSubmit={onEmailSignIn}
          autoComplete="on"
          className="rounded-2xl bg-stone-950/80 border border-stone-800 p-4 space-y-3"
        >
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-semibold text-stone-300 mb-1"
            >
              Correo electrónico autorizado
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-orange-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                readOnly={!inputsEditable}
                onFocus={unlockAutofill}
                onClick={unlockAutofill}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder=""
                required
                disabled={!firebaseReady || authLoading}
                className="w-full rounded-xl bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none pl-10 pr-3.5 py-2.5 text-sm font-mono font-semibold text-white placeholder:text-stone-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-stone-300 mb-1"
            >
              Contraseña
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-orange-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                readOnly={!inputsEditable}
                onFocus={unlockAutofill}
                onClick={unlockAutofill}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder=""
                required
                minLength={6}
                disabled={!firebaseReady || authLoading}
                className="w-full rounded-xl bg-stone-900 border border-orange-500/60 focus:border-orange-400 focus:outline-none pl-10 pr-3.5 py-2.5 text-sm font-mono font-semibold text-white placeholder:text-stone-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!firebaseReady || authLoading}
            className="w-full min-h-[44px] rounded-xl bg-zinc-950 border border-orange-500/80 hover:border-orange-400 text-orange-400 font-display font-semibold uppercase text-xs sm:text-sm py-2.5 cursor-pointer transition-colors disabled:opacity-50"
          >
            {authLoading ? 'Ingresando...' : 'Ingresar con Correo'}
          </button>

          <div className="text-center pt-0.5">
            <button
              type="button"
              onClick={onPasswordReset}
              disabled={!firebaseReady || authLoading}
              className="text-xs text-orange-400 hover:text-orange-300 underline underline-offset-2 cursor-pointer disabled:opacity-50"
            >
              ¿Olvidaste tu contraseña? Enviar enlace por mail
            </button>
          </div>
        </form>

        {authError && (
          <div
            role="alert"
            className="rounded-xl bg-rose-500/15 border border-rose-500/35 p-3 text-xs text-rose-200 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{authError}</span>
          </div>
        )}

        {authInfo && (
          <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/35 p-3 text-xs text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{authInfo}</span>
          </div>
        )}
      </div>
    </div>
  );
}
