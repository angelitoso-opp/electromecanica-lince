'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatCurrency, formatDate, formatPlate } from '@/lib/utils';

interface VehicleHistoryModalProps {
  vehicle: any;
  client: any;
  isOpen: boolean;
  onClose: () => void;
}

export function VehicleHistoryModal({
  vehicle,
  client,
  isOpen,
  onClose,
}: VehicleHistoryModalProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Escape listener & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !vehicle) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders?q=${vehicle.plate}`);
        const data = await res.json();
        if (data.success) {
          const match = data.orders.filter(
            (o: any) => o.vehicleId === vehicle.id
          );
          setOrders(match);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, vehicle]);

  if (!isOpen || !vehicle) return null;

  const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <>
      {/* Slide-over Backdrop */}
      <div className="sheet-overlay" onClick={onClose} />

      {/* Slide-over Right Sheet */}
      <aside
        className="sheet-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Hoja de vida técnica de ${vehicle.plate}`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--raised)]">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px]">Hoja de vida técnica</h2>
              <code className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] font-medium text-[12px]">
                {formatPlate(vehicle.plate)}
              </code>
            </div>
            <p className="text-[12px] text-[var(--muted)] mt-0.5 truncate">
              {vehicle.brand} {vehicle.model} ({vehicle.year || 's/a'}) · Titular:{' '}
              {client?.name}
            </p>
          </div>
          <button onClick={onClose} className="btn px-2.5 shrink-0 ml-2" aria-label="Cerrar panel">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-3 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="p-3.5 border-r border-[var(--rule)]">
            <span className="text-[11px] font-semibold text-[var(--muted)] block uppercase">
              Intervenciones
            </span>
            <span className="text-[18px] font-semibold num text-[var(--text)]">
              {orders.length}
            </span>
          </div>
          <div className="p-3.5 border-r border-[var(--rule)]">
            <span className="text-[11px] font-semibold text-[var(--muted)] block uppercase">
              Último km
            </span>
            <span className="text-[18px] font-semibold num text-[var(--text)]">
              {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'S/R'}
            </span>
          </div>
          <div className="p-3.5">
            <span className="text-[11px] font-semibold text-[var(--muted)] block uppercase">
              Facturación
            </span>
            <span className="text-[18px] font-semibold num text-[var(--text)]">
              {formatCurrency(totalSpent)}
            </span>
          </div>
        </div>

        {/* Timeline of services */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <h3 className="text-[13px]">Cronología de mantenimientos</h3>

          {loading ? (
            <div className="py-8 text-center text-[var(--muted)] text-[13px]">
              Consultando historial técnico...
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-3.5 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-[var(--rule)] pb-2">
                    <div className="flex items-center gap-2">
                      <code className="font-medium text-[var(--text)] text-[13px]">
                        {order.orderNumber}
                      </code>
                      <span className="text-[var(--muted)]">·</span>
                      <span className="text-[12px] text-[var(--muted)] num">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <span className="num font-semibold text-[var(--text)] text-[14px]">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>

                  <p className="font-medium text-[13px] text-[var(--text)]">
                    {order.issueDescription || order.diagnosis}
                  </p>

                  {order.diagnostic && (
                    <p className="text-[12px] text-[var(--muted)]">
                      Diagnóstico: {order.diagnostic}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--rule)] text-[12px]">
                    {order.services?.length > 0 && (
                      <div>
                        <span className="text-[var(--muted)] font-medium block mb-1">
                          Mano de obra:
                        </span>
                        <ul className="list-disc list-inside text-[var(--text)] space-y-0.5">
                          {order.services.map((s: any) => (
                            <li key={s.id}>{s.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {order.items?.length > 0 && (
                      <div>
                        <span className="text-[var(--muted)] font-medium block mb-1">
                          Repuestos instalados:
                        </span>
                        <ul className="list-disc list-inside text-[var(--text)] space-y-0.5">
                          {order.items.map((i: any) => (
                            <li key={i.id}>
                              {i.description} (x{i.quantity})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-[var(--muted)] border border-[var(--border)] rounded-[var(--r-md)] text-[13px]">
              No hay órdenes de trabajo previas registradas para esta unidad.
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
