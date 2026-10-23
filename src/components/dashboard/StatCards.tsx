'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';

export type KpiFilterType = 'TODOS' | 'ACTIVAS' | 'FACTURADO' | 'POR_COBRAR' | 'BAJO_STOCK';

interface StatCardsProps {
  stats: {
    totalClients: number;
    totalVehicles: number;
    activeOrders: number;
    readyOrders?: number;
    lowStockCount: number;
    inventoryCount?: number;
    totalRevenue: number;
    totalCollected: number;
    pendingCollection?: number;
  };
  activeFilter?: KpiFilterType;
  onSelectFilter?: (filter: KpiFilterType) => void;
  onOpenLowStock?: () => void;
}

export function StatCards({
  stats,
  activeFilter = 'TODOS',
  onSelectFilter,
}: StatCardsProps) {
  const pending =
    stats.pendingCollection !== undefined
      ? stats.pendingCollection
      : Math.max(0, stats.totalRevenue - stats.totalCollected);

  const collectionRate =
    stats.totalRevenue > 0
      ? Math.round((stats.totalCollected / stats.totalRevenue) * 100)
      : 100;

  const handleCardClick = (target: KpiFilterType) => {
    if (!onSelectFilter) return;
    onSelectFilter(activeFilter === target ? 'TODOS' : target);
  };

  return (
    <section
      aria-label="Indicadores clave del taller con filtrado interactivo"
      className="kpis"
      role="tablist"
    >
      {/* 1. Bahía / Órdenes Activas */}
      <button
        type="button"
        role="tab"
        aria-selected={activeFilter === 'ACTIVAS'}
        onClick={() => handleCardClick('ACTIVAS')}
        className={`kpi text-left cursor-pointer relative ${
          activeFilter === 'ACTIVAS'
            ? 'bg-[var(--raised)] shadow-none before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-[var(--accent)]'
            : ''
        }`}
        title="Filtrar por órdenes activas en bahía"
      >
        <span className="kpi-label">Órdenes activas en bahía</span>
        <span className="kpi-val">{stats.activeOrders}</span>
        <span className="kpi-delta">
          {stats.readyOrders || 0} listas para entrega · {stats.totalVehicles} vehículos registrados
        </span>
      </button>

      {/* 2. Facturación Acumulada */}
      <button
        type="button"
        role="tab"
        aria-selected={activeFilter === 'FACTURADO'}
        onClick={() => handleCardClick('FACTURADO')}
        className={`kpi text-left cursor-pointer relative ${
          activeFilter === 'FACTURADO'
            ? 'bg-[var(--raised)] shadow-none before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-[var(--accent)]'
            : ''
        }`}
        title="Ver total facturado y clientes"
      >
        <span className="kpi-label">Facturado acumulado</span>
        <span className="kpi-val">{formatCurrency(stats.totalRevenue)}</span>
        <span className="kpi-delta">
          {stats.totalClients} clientes en cartera activa
        </span>
      </button>

      {/* 3. Cobros / Pendiente */}
      <button
        type="button"
        role="tab"
        aria-selected={activeFilter === 'POR_COBRAR'}
        onClick={() => handleCardClick('POR_COBRAR')}
        className={`kpi text-left cursor-pointer relative ${
          activeFilter === 'POR_COBRAR'
            ? 'bg-[var(--raised)] shadow-none before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-[var(--accent)]'
            : ''
        }`}
        title="Filtrar por órdenes con cobro pendiente"
      >
        <span className="kpi-label">Cobrado efectivo</span>
        <span className="kpi-val">{formatCurrency(stats.totalCollected)}</span>
        <span className={`kpi-delta ${pending > 0 ? 'warn' : 'up'}`}>
          {pending > 0
            ? `${formatCurrency(pending)} por cobrar (${collectionRate}% recaudado)`
            : '100% conciliado en caja'}
        </span>
      </button>

      {/* 4. Stock / Repuestos */}
      <button
        type="button"
        role="tab"
        aria-selected={activeFilter === 'BAJO_STOCK'}
        onClick={() => handleCardClick('BAJO_STOCK')}
        className={`kpi text-left cursor-pointer relative ${
          activeFilter === 'BAJO_STOCK'
            ? 'bg-[var(--raised)] shadow-none before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-[var(--accent)]'
            : ''
        }`}
        title="Filtrar repuestos que requieren reposición"
      >
        <span className="kpi-label">Repuestos bajo mínimo</span>
        <span className="kpi-val">{stats.lowStockCount}</span>
        <span className={`kpi-delta ${stats.lowStockCount > 0 ? 'down' : 'up'}`}>
          {stats.lowStockCount > 0
            ? `Requieren reposición · ${stats.inventoryCount || 0} SKU totales`
            : `Abastecimiento óptimo (${stats.inventoryCount || 0} SKU)`}
        </span>
      </button>
    </section>
  );
}
