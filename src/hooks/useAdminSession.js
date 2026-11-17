/**
 * useAdminSession — Sesión Única Activa para el Panel de Administración
 *
 * Presupuesto de Firestore:
 *   - 1 lectura  al entrar (checkAdminSession)
 *   - 1 escritura al entrar si toma el control (claimAdminSession)
 *   - 1 listener liviano onSnapshot sobre settings/adminSession
 *   - 1 escritura al salir o por inactividad (releaseAdminSession)
 *
 * Sin polling, sin heartbeats, sin escrituras intermedias.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  checkAdminSession,
  claimAdminSession,
  releaseAdminSession,
  subscribeToAdminSession,
} from '../firebase/config';

const INACTIVITY_MS = 20 * 60 * 1000; // 20 minutos
const THROTTLE_MS = 10_000;            // throttle de eventos de actividad a 10 s

/**
 * @param {object} opts
 * @param {boolean}       opts.enabled       - true cuando el panel está abierto y el usuario ya autenticó
 * @param {object|null}   opts.adminUser     - usuario admin autenticado (con .email, .displayName, .uid)
 * @param {() => void}    opts.onForceClose  - callback para cerrar el panel cuando otra sesión lo toma
 */
export function useAdminSession({ enabled, adminUser, onForceClose }) {
  // 'idle' | 'checking' | 'conflict' | 'active' | 'releasing'
  const [sessionState, setSessionState] = useState('idle');
  const [conflictInfo, setConflictInfo] = useState(null); // { deviceInfo, startedAt }

  const sessionIdRef      = useRef(null);
  const unsubscribeRef    = useRef(null);
  const inactivityRef     = useRef(null);
  const lastActivityRef   = useRef(Date.now());
  const isReleasedRef     = useRef(false);

  // ─── Liberar sesión (1 escritura) ───────────────────────────────────────────
  const release = useCallback(async () => {
    if (isReleasedRef.current) return;
    if (!sessionIdRef.current) return;
    isReleasedRef.current = true;

    // Desuscribir el listener antes de escribir para evitar que reaccione a nuestra propia escritura
    if (typeof unsubscribeRef.current === 'function') {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    clearTimeout(inactivityRef.current);
    await releaseAdminSession(sessionIdRef.current);
    sessionIdRef.current = null;
    setSessionState('idle');
  }, []);

  // ─── Montar el listener onSnapshot + timer de inactividad ───────────────────
  const startSession = useCallback(() => {
    isReleasedRef.current = false;

    // ── 1) listener onSnapshot liviano: reacciona SOLO si el sessionId cambia ──
    unsubscribeRef.current = subscribeToAdminSession((snap) => {
      if (!snap) return;
      const remoteSessionId = snap.sessionId;
      // Si el doc se actualizó con un sessionId distinto al nuestro → nos expulsaron
      if (
        remoteSessionId &&
        sessionIdRef.current &&
        remoteSessionId !== sessionIdRef.current
      ) {
        setSessionState('releasing');
        // Limpiar todo localmente (no escribir: la otra sesión ya está activa)
        if (typeof unsubscribeRef.current === 'function') {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        clearTimeout(inactivityRef.current);
        sessionIdRef.current = null;
        onForceClose?.();
      }
    });

    // ── 2) Timer de inactividad 100% local ──────────────────────────────────
    const resetTimer = () => {
      clearTimeout(inactivityRef.current);
      inactivityRef.current = setTimeout(async () => {
        // 20 min de inactividad → 1 escritura y cierra
        await release();
        onForceClose?.();
      }, INACTIVITY_MS);
    };

    // Throttle: no actualiza el timer más de 1 vez cada THROTTLE_MS
    let lastThrottle = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastThrottle < THROTTLE_MS) return;
      lastThrottle = now;
      lastActivityRef.current = now;
      resetTimer();
    };

    window.addEventListener('mousemove', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity, { passive: true });
    window.addEventListener('touchstart', onActivity, { passive: true });
    window.addEventListener('click', onActivity, { passive: true });

    resetTimer();

    // ── 3) Cierre por pagehide / beforeunload → 1 escritura ─────────────────
    const onPageHide = () => { release(); };
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onPageHide);

    // Guardar cleanup completo
    const cleanup = () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('touchstart', onActivity);
      window.removeEventListener('click', onActivity);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onPageHide);
      clearTimeout(inactivityRef.current);
    };
    return cleanup;
  }, [release, onForceClose]);

  // ─── Tomar control explícitamente (desde el modal de conflicto) ─────────────
  const takeover = useCallback(async () => {
    if (!adminUser) return;
    setSessionState('checking');
    try {
      const { sessionId } = await claimAdminSession(adminUser);
      sessionIdRef.current = sessionId;
      setConflictInfo(null);
      setSessionState('active');
      startSession();
    } catch {
      setSessionState('idle');
    }
  }, [adminUser, startSession]);

  // ─── Cancelar: no entrar al panel ───────────────────────────────────────────
  const cancelEntry = useCallback(() => {
    setConflictInfo(null);
    setSessionState('idle');
    onForceClose?.();
  }, [onForceClose]);

  // ─── Efecto principal: se ejecuta cuando el panel pasa a enabled=true ────────
  useEffect(() => {
    if (!enabled || !adminUser) {
      return undefined;
    }

    let cleanupSession = null;
    let cancelled = false;

    setSessionState('checking');

    (async () => {
      try {
        const snap = await checkAdminSession(); // 1 sola lectura
        if (cancelled) return;

        const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
        const isConflict =
          snap?.isActive === true &&
          snap?.sessionId &&
          Date.now() - (snap?.startedAt || 0) < TWO_HOURS_MS;

        if (isConflict) {
          // Hay otra sesión activa → mostrar modal de conflicto
          setConflictInfo({
            deviceInfo: snap.deviceInfo || 'otro dispositivo',
            startedAt: snap.startedAt,
          });
          setSessionState('conflict');
          return;
        }

        // Sin conflicto: reclamar directamente (1 escritura)
        const { sessionId } = await claimAdminSession(adminUser);
        if (cancelled) return;

        sessionIdRef.current = sessionId;
        setSessionState('active');
        cleanupSession = startSession();
      } catch {
        if (!cancelled) setSessionState('idle');
      }
    })();

    return () => {
      cancelled = true;
      if (typeof cleanupSession === 'function') cleanupSession();
      // Liberar sesión al desmontar o al cerrar el panel
      release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, adminUser]);

  return {
    sessionState,   // 'idle' | 'checking' | 'conflict' | 'active' | 'releasing'
    conflictInfo,   // { deviceInfo, startedAt } cuando hay conflicto
    takeover,       // fn: forzar toma de sesión desde el modal
    cancelEntry,    // fn: cancelar entrada y cerrar el panel
    releaseSession: release, // fn manual para logout
  };
}
