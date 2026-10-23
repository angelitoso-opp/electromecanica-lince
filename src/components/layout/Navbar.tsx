'use client';

import React from 'react';
import { Mic, Menu, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
  onOpenNewOrder?: () => void;
  onOpenVoiceAssistant?: () => void;
  onOpenCommandPalette?: () => void;
}

const routeNames: Record<string, string> = {
  '/': 'Jornada del taller',
  '/ordenes': 'Órdenes de trabajo',
  '/facturas': 'Comprobantes y cobros',
  '/clientes': 'Clientes y flota',
  '/inventario': 'Almacén y stock',
  '/asistente-voz': 'Dictado por voz',
};

export function Navbar({
  onOpenMobileMenu,
  onOpenVoiceAssistant,
  onOpenCommandPalette,
}: NavbarProps) {
  const pathname = usePathname();
  const currentSection = routeNames[pathname] || 'Operación';

  return (
    <header className="app-topbar">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="btn min-[861px]:hidden px-2"
          aria-label="Abrir navegación"
        >
          <Menu className="w-4 h-4" />
        </button>

        <nav aria-label="Ruta actual" className="flex items-center gap-2 text-[13px] truncate">
          <span className="text-[var(--muted)] hidden sm:inline">Electromecánica Lince</span>
          <span className="text-[var(--control)] hidden sm:inline">/</span>
          <span className="font-medium text-[var(--text)] truncate">{currentSection}</span>
        </nav>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Search / Command Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="btn text-[var(--muted)] hover:text-[var(--text)] hidden md:inline-flex items-center gap-2 px-2.5 py-1 text-[12px]"
          title="Búsqueda global (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-[var(--muted)]" />
          <span>Buscar...</span>
          <span className="code-id text-[10px] px-1 py-0.2 rounded bg-[var(--raised)] border border-[var(--border)] text-[var(--muted)]">
            ⌘K
          </span>
        </button>

        <button
          onClick={onOpenCommandPalette}
          className="btn md:hidden px-2 text-[var(--muted)]"
          aria-label="Buscar"
        >
          <Search className="w-4 h-4" />
        </button>

        <span className="pill ok hidden lg:inline-flex">Turno abierto · 4 bahías</span>

        <button
          onClick={onOpenVoiceAssistant}
          className="btn"
          title="Registrar avance o consulta por voz"
        >
          <Mic className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={1.75} />
          <span className="hidden sm:inline">Dictar avance</span>
        </button>
      </div>
    </header>
  );
}
