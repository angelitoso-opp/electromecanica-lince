'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Wrench,
  FileText,
  Users,
  Package,
  Mic,
  LayoutDashboard,
  ArrowRight,
  X,
  Car,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewOrder?: () => void;
  onOpenVoiceAssistant?: () => void;
}

interface SearchResultOrder {
  id: string;
  orderNumber: string;
  status: string;
  vehicle?: {
    plate: string;
    brand: string;
    model: string;
  };
  client?: {
    name: string;
  };
}

interface SearchResultClient {
  id: string;
  name: string;
  phone?: string;
  vehicles?: Array<{
    plate: string;
    brand: string;
    model: string;
  }>;
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpenNewOrder,
  onOpenVoiceAssistant,
}: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState<SearchResultOrder[]>([]);
  const [clients, setClients] = useState<SearchResultClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setOrders([]);
      setClients([]);
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Search API on query change
  useEffect(() => {
    if (!query.trim()) {
      setOrders([]);
      setClients([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [ordersRes, clientsRes] = await Promise.all([
          fetch(`/api/orders?q=${encodeURIComponent(query.trim())}`).then((r) => r.json()),
          fetch(`/api/clients?q=${encodeURIComponent(query.trim())}`).then((r) => r.json()),
        ]);

        if (ordersRes.success) {
          setOrders(ordersRes.orders?.slice(0, 4) || []);
        }
        if (clientsRes.success) {
          setClients(clientsRes.clients?.slice(0, 3) || []);
        }
      } catch (err) {
        console.error('Error buscando en Command Palette:', err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Navigation actions
  const defaultActions = [
    {
      id: 'act-new-order',
      title: 'Nueva orden de trabajo',
      desc: 'Registrar ingreso y orden de servicio',
      icon: <Wrench className="w-4 h-4 text-[var(--accent)]" />,
      run: () => {
        onClose();
        if (onOpenNewOrder) onOpenNewOrder();
        else router.push('/ordenes');
      },
    },
    {
      id: 'act-voice',
      title: 'Dictar avance por voz',
      desc: 'Transcribir estado o repuestos usados',
      icon: <Mic className="w-4 h-4 text-[var(--accent)]" />,
      run: () => {
        onClose();
        if (onOpenVoiceAssistant) onOpenVoiceAssistant();
        else router.push('/asistente-voz');
      },
    },
    {
      id: 'act-invoices',
      title: 'Comprobantes y Facturación',
      desc: 'Ver facturas emitidas y pendientes',
      icon: <FileText className="w-4 h-4 text-[var(--muted)]" />,
      run: () => {
        onClose();
        router.push('/facturas');
      },
    },
    {
      id: 'act-orders',
      title: 'Órdenes de trabajo',
      desc: 'Bandeja completa de reparaciones',
      icon: <Wrench className="w-4 h-4 text-[var(--muted)]" />,
      run: () => {
        onClose();
        router.push('/ordenes');
      },
    },
    {
      id: 'act-clients',
      title: 'Clientes y Flota',
      desc: 'Directorio de propietarios y vehículos',
      icon: <Users className="w-4 h-4 text-[var(--muted)]" />,
      run: () => {
        onClose();
        router.push('/clientes');
      },
    },
    {
      id: 'act-inventory',
      title: 'Almacén y Stock',
      desc: 'Control de repuestos y lubricantes',
      icon: <Package className="w-4 h-4 text-[var(--muted)]" />,
      run: () => {
        onClose();
        router.push('/inventario');
      },
    },
    {
      id: 'act-home',
      title: 'Panel Principal',
      desc: 'KPIs e indicadores de la jornada',
      icon: <LayoutDashboard className="w-4 h-4 text-[var(--muted)]" />,
      run: () => {
        onClose();
        router.push('/');
      },
    },
  ];

  // Build flattened selectable items list for keyboard navigation
  const items: Array<{ id: string; run: () => void }> = [];

  if (query.trim()) {
    orders.forEach((o) => {
      items.push({
        id: `order-${o.id}`,
        run: () => {
          onClose();
          router.push('/ordenes');
        },
      });
    });
    clients.forEach((c) => {
      items.push({
        id: `client-${c.id}`,
        run: () => {
          onClose();
          router.push('/clientes');
        },
      });
    });
  }

  defaultActions.forEach((act) => {
    items.push({
      id: act.id,
      run: act.run,
    });
  });

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) {
          items[selectedIndex].run();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [items, selectedIndex, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda rápida y comandos"
    >
      <div
        className="modal-card max-w-[560px]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
          <Search className="w-4 h-4 text-[var(--muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por placa, orden, cliente o acción..."
            className="w-full bg-transparent border-0 outline-none text-[14px] text-[var(--text)] placeholder:text-[var(--muted)]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-[var(--muted)] hover:text-[var(--text)]"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="code-id text-[11px] px-1.5 py-0.5 rounded bg-[var(--raised)] text-[var(--muted)] border border-[var(--border)]">
            ESC
          </span>
        </div>

        {/* Content Lists */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-4">
          {/* Matching Orders */}
          {query.trim() && orders.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-[var(--muted)] uppercase">
                Órdenes de Trabajo ({orders.length})
              </p>
              <div className="space-y-0.5">
                {orders.map((o) => {
                  const itemIdx = items.findIndex((it) => it.id === `order-${o.id}`);
                  const isSelected = itemIdx === selectedIndex;
                  return (
                    <button
                      key={o.id}
                      onClick={() => {
                        onClose();
                        router.push('/ordenes');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-[var(--r-md)] flex items-center justify-between text-[13px] ${
                        isSelected ? 'bg-[var(--active)] text-[var(--text)]' : 'hover:bg-[var(--raised)] text-[var(--text)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="code-id font-medium text-[var(--accent)]">{o.orderNumber}</span>
                        {o.vehicle && (
                          <span className="code-id px-1.5 py-0.2 bg-[var(--raised)] border border-[var(--border)] rounded text-[12px]">
                            {o.vehicle.plate}
                          </span>
                        )}
                        <span className="text-[var(--muted)] truncate">
                          {o.client?.name || `${o.vehicle?.brand} ${o.vehicle?.model}`}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--muted)] shrink-0">{o.status}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matching Clients & Vehicles */}
          {query.trim() && clients.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-[var(--muted)] uppercase">
                Clientes y Vehículos ({clients.length})
              </p>
              <div className="space-y-0.5">
                {clients.map((c) => {
                  const itemIdx = items.findIndex((it) => it.id === `client-${c.id}`);
                  const isSelected = itemIdx === selectedIndex;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        onClose();
                        router.push('/clientes');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-[var(--r-md)] flex items-center justify-between text-[13px] ${
                        isSelected ? 'bg-[var(--active)] text-[var(--text)]' : 'hover:bg-[var(--raised)] text-[var(--text)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Car className="w-3.5 h-3.5 text-[var(--muted)] shrink-0" />
                        <span className="font-medium text-[var(--text)] truncate">{c.name}</span>
                        {c.vehicles && c.vehicles.length > 0 && (
                          <span className="code-id text-[11px] text-[var(--muted)] truncate">
                            ({c.vehicles.map((v) => v.plate).join(', ')})
                          </span>
                        )}
                      </div>
                      {c.phone && <span className="text-[12px] text-[var(--muted)] shrink-0">{c.phone}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {query.trim() && !loading && orders.length === 0 && clients.length === 0 && (
            <div className="py-4 text-center text-[13px] text-[var(--muted)]">
              No se encontraron resultados para &ldquo;{query}&rdquo;
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-[var(--muted)] uppercase">
              {query.trim() ? 'Acciones Disponibles' : 'Acciones Rápidas'}
            </p>
            <div className="space-y-0.5">
              {defaultActions.map((act) => {
                const itemIdx = items.findIndex((it) => it.id === act.id);
                const isSelected = itemIdx === selectedIndex;
                return (
                  <button
                    key={act.id}
                    onClick={act.run}
                    className={`w-full text-left px-3 py-2 rounded-[var(--r-md)] flex items-center justify-between text-[13px] ${
                      isSelected ? 'bg-[var(--active)] text-[var(--text)]' : 'hover:bg-[var(--raised)] text-[var(--text)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="shrink-0">{act.icon}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--text)] leading-tight">{act.title}</p>
                        <p className="text-[12px] text-[var(--muted)] leading-tight truncate">{act.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--control)] shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--raised)] flex items-center justify-between text-[11px] text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <span>Usa</span>
            <span className="code-id px-1 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded">↑</span>
            <span className="code-id px-1 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded">↓</span>
            <span>para navegar</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="code-id px-1 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded">↵</span>
            <span>para seleccionar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
