'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatCurrency, formatPlate, formatShortDate } from '@/lib/utils';

interface RecentOrdersProps {
  orders: any[];
  onSelectOrder: (order: any) => void;
}

const statusMap: Record<string, { label: string; tone: string }> = {
  PENDIENTE: { label: 'Pendiente', tone: 'warn' },
  EN_PROCESO: { label: 'En bahía', tone: 'info' },
  ESPERANDO_REPUESTOS: { label: 'Esp. repuesto', tone: 'err' },
  LISTO: { label: 'Listo', tone: 'ok' },
  ENTREGADO: { label: 'Entregado', tone: '' },
};

export function RecentOrders({ orders, onSelectOrder }: RecentOrdersProps) {
  const visibleOrders = orders.slice(0, 5);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Órdenes de trabajo recientes</h2>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">
            Selecciona una fila para abrir hoja técnica, repuestos y bitácora.
          </p>
        </div>
        <Link
          href="/ordenes"
          className="text-[13px] font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1"
        >
          <span>Ver tablero completo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Orden / Placa</th>
              <th>Vehículo y cliente</th>
              <th>Estado</th>
              <th>Ingreso</th>
              <th className="num">Importe</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((order) => {
              const status = statusMap[order.status] || statusMap.PENDIENTE;
              return (
                <tr
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="cursor-pointer"
                >
                  <td>
                    <div className="flex items-center gap-2">
                      <code className="font-medium text-[var(--text)]">
                        {order.orderNumber}
                      </code>
                      <code className="px-1.5 py-0.5 rounded bg-[var(--raised)] border border-[var(--border)] text-[var(--text)]">
                        {formatPlate(order.vehicle?.plate || '')}
                      </code>
                    </div>
                  </td>
                  <td>
                    <div className="font-medium text-[var(--text)] truncate max-w-[230px]">
                      {order.vehicle?.brand} {order.vehicle?.model}
                    </div>
                    <div className="text-[13px] text-[var(--muted)] truncate max-w-[230px]">
                      {order.client?.name}
                    </div>
                  </td>
                  <td>
                    <span className={`pill ${status.tone}`}>{status.label}</span>
                  </td>
                  <td className="text-[var(--muted)] num">
                    {formatShortDate(order.createdAt)}
                  </td>
                  <td className="num font-medium text-[var(--text)]">
                    {formatCurrency(order.totalAmount)}
                  </td>
                </tr>
              );
            })}

            {visibleOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[var(--muted)]">
                  No hay órdenes activas registradas. Usa el botón «Nueva orden» para registrar un ingreso.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
