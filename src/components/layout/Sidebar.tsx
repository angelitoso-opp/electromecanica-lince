'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  ClipboardList,
  FileText,
  Users,
  Package,
  Mic,
  ChevronsUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  meta?: string;
}

const primaryNav: NavItem[] = [
  { name: 'Jornada del taller', href: '/', icon: LayoutGrid },
  { name: 'Órdenes de trabajo', href: '/ordenes', icon: ClipboardList },
  { name: 'Comprobantes', href: '/facturas', icon: FileText },
];

const catalogNav: NavItem[] = [
  { name: 'Clientes y flota', href: '/clientes', icon: Users },
  { name: 'Almacén y stock', href: '/inventario', icon: Package },
  { name: 'Dictado por voz', href: '/asistente-voz', icon: Mic, meta: 'IA' },
];

export function Sidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const renderLink = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
        className="nav-item"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Icon className="w-4 h-4 shrink-0" strokeWidth={1.65} />
          <span className="truncate">{item.name}</span>
        </span>
        {item.meta && (
          <code className="px-1.5 py-0.5 rounded bg-[var(--raised)] text-[var(--muted)] border border-[var(--border)]">
            {item.meta}
          </code>
        )}
      </Link>
    );
  };

  return (
    <aside className={cn('app-sidebar', className)}>
      {/* Brand Header */}
      <div className="px-2.5 pt-1 pb-2 flex items-center justify-between">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5 no-underline">
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
        </Link>
        <code className="text-[var(--muted)]">LINCE</code>
      </div>

      {/* Scope Switcher */}
      <div className="px-1.5 mb-2">
        <div className="w-full px-2.5 py-2 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-[var(--text)] truncate">
              Electromecánica Lince
            </div>
            <div className="text-[13px] text-[var(--muted)] truncate">
              Jr. Soledad 330 · Taller & Bahías
            </div>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
        </div>
      </div>

      {/* Primary Modules */}
      <div className="nav-group">Operación</div>
      <nav className="flex flex-col gap-0.5" aria-label="Operación">
        {primaryNav.map(renderLink)}
      </nav>

      {/* Catalogs & Voice */}
      <div className="nav-group">Catálogos y taller</div>
      <nav className="flex flex-col gap-0.5" aria-label="Catálogos y taller">
        {catalogNav.map(renderLink)}
      </nav>

      <div className="flex-1" />

      {/* Bottom Operational Status */}
      <div className="mt-4 mx-1.5 p-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[var(--text)]">
            Bitácora por voz
          </span>
          <span className="pill ok">Activa</span>
        </div>
        <p className="text-[13px] text-[var(--muted)] leading-snug">
          Dicta avances indicando la placa del vehículo atendido.
        </p>
      </div>

      <div className="px-2.5 pt-3 pb-1 flex items-center justify-between text-[13px] text-[var(--muted)]">
        <span>Base local SQLite</span>
        <code>v2.4</code>
      </div>
    </aside>
  );
}
