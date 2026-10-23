'use client';

import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';

interface SingleAccountLoginProps {
  onAuthenticated: () => void;
}

export function SingleAccountLogin({ onAuthenticated }: SingleAccountLoginProps) {
  const [username, setUsername] = useState('lince');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Ingresa la clave o PIN de acceso del taller.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.authenticated) {
        onAuthenticated();
      } else {
        setError(data.error || 'Credenciales incorrectas.');
      }
    } catch {
      setError('No se pudo conectar con el servicio local del taller.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--ground)] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar Info */}
      <header className="max-w-[440px] w-full mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="24" height="24" rx="6" fill="#131416" />
            <path
              d="M7.5 16.5L14.5 9.5M14.5 9.5C13.8 7.8 14.6 6 16.2 5.6C16.7 5.5 17.2 5.5 17.6 5.7L15.9 7.4L16.6 8.1L18.3 6.4C18.5 6.8 18.5 7.3 18.4 7.8C18 9.4 16.2 10.2 14.5 9.5ZM6.2 15.2L8.8 17.8"
              stroke="#FFFFFF"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-semibold text-[15px] tracking-tight text-[var(--text)]">
            Electromecánica Lince
          </span>
        </div>
        <code className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
          ESTACIÓN LOCAL
        </code>
      </header>

      {/* Main Single-Account Access Panel */}
      <main className="max-w-[440px] w-full mx-auto my-auto py-8">
        <section
          data-ui="login-panel"
          className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] p-6 space-y-5"
        >
          <div className="space-y-1.5 border-b border-[var(--rule)] pb-4">
            <div className="flex items-center justify-between">
              <span className="pill info">Software a medida · 1 cuenta</span>
              <code className="text-[var(--muted)]">PE-LIM-LINCE</code>
            </div>
            <h1 className="pt-1">Acceso de operador titular</h1>
            <p className="text-[13px] text-[var(--muted)]">
              Jr. Soledad 330, Lince · Base de datos SQLite local independiente.
            </p>
          </div>

          {/* Active Operator Identity Box */}
          <div className="p-3 rounded-[var(--r-md)] bg-[var(--raised)] border border-[var(--border)] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Cuenta única asignada
              </div>
              <div className="text-[14px] font-semibold text-[var(--text)] truncate">
                Timoteo Pariona Ramírez
              </div>
              <div className="text-[12px] text-[var(--muted)] truncate">
                Titular & Jefe de Taller · Electromecánica Lince
              </div>
            </div>
            <ShieldCheck className="w-5 h-5 text-[var(--accent)] shrink-0" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="workshop-user"
                className="block text-[12px] font-medium text-[var(--muted)]"
              >
                Identificador de cuenta
              </label>
              <input
                id="workshop-user"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="lince"
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="workshop-pass"
                  className="block text-[12px] font-medium text-[var(--muted)]"
                >
                  Clave o PIN de taller
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('lince');
                    setPassword('lince2026');
                    setError('');
                  }}
                  className="text-[11px] text-[var(--accent)] hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  Usar clave titular
                </button>
              </div>
              <div className="relative">
                <input
                  id="workshop-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-9"
                  placeholder="Ingresa clave (lince2026) o PIN (1234)"
                  autoFocus
                  autoComplete="current-password"
                />
                <KeyRound className="w-4 h-4 text-[var(--muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-[var(--r-md)] bg-[#fef2f2] border border-[#fecaca] text-[12px] text-[var(--negative)] font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center py-2.5 text-[14px]"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{loading ? 'Abriendo estación...' : 'Ingresar al sistema del taller'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-3 border-t border-[var(--rule)] flex items-center justify-between text-[12px] text-[var(--muted)]">
            <span>Credencial local:</span>
            <code>lince / lince2026 (PIN: 1234)</code>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-[440px] w-full mx-auto flex items-center justify-between text-[12px] text-[var(--muted)] pb-2">
        <span>Electromecánica Lince · Tel: (01) 704-3157</span>
        <code>SQLite Local · Sin Nube</code>
      </footer>
    </div>
  );
}
