'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface LowStockAlertProps {
  items: any[];
  fallbackItems?: any[];
}

export function LowStockAlert({ items, fallbackItems = [] }: LowStockAlertProps) {
  const combined = [...items];
  if (combined.length < 5 && fallbackItems.length > 0) {
    const existingIds = new Set(combined.map((i) => i.id));
    for (const item of fallbackItems) {
      if (!existingIds.has(item.id) && combined.length < 5) {
        combined.push(item);
      }
    }
  }
  const displayItems = combined.slice(0, 5);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Control de stock y punto de pedido</h2>
          <p className="text-[13px] text-[var(--muted)] mt-0.5">
            Cobertura actual frente al stock mínimo de seguridad.
          </p>
        </div>
        <Link
          href="/inventario"
          className="text-[13px] font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1 shrink-0"
        >
          <span>Abrir almacén</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Repuesto / SKU</th>
              <th>Cobertura</th>
              <th className="num">Precio</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item) => {
              const isLow = item.stock <= item.minStock;
              return (
                <tr key={item.id}>
                  <td>
                    <div className="font-medium text-[var(--text)] truncate max-w-[195px]">
                      {item.name}
                    </div>
                    <div className="text-[13px] text-[var(--muted)] flex items-center gap-1.5">
                      <code>{item.code}</code>
                      <span>·</span>
                      <span className="truncate max-w-[100px]">
                        {item.location || item.category}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`pill ${isLow ? 'err' : 'ok'}`}>
                        {isLow ? 'Reponer' : 'Óptimo'}
                      </span>
                      <span className="num text-[13px] text-[var(--muted)]">
                        <strong className="text-[var(--text)] font-medium">
                          {item.stock}
                        </strong>
                        /{item.minStock}
                      </span>
                    </div>
                  </td>
                  <td className="num font-medium text-[var(--text)] whitespace-nowrap">
                    {formatCurrency(item.unitPrice ?? item.salePrice ?? 0)}
                  </td>
                </tr>
              );
            })}

            {displayItems.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-[var(--muted)]">
                  Sin repuestos cargados en el catálogo de almacén.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
