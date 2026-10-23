'use client';

import React, { useState, useEffect } from 'react';
import { StatCards, KpiFilterType } from '@/components/dashboard/StatCards';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { OrderDetailModal } from '@/components/orders/OrderDetailModal';
import { OrderFormModal } from '@/components/orders/OrderFormModal';
import { VoiceAssistantModal } from '@/components/voice/VoiceAssistantModal';
import { useToast, ConfirmButton } from '@/components/ui/ToastProvider';
import { Mic, Plus, RotateCcw } from 'lucide-react';
import { formatCurrency, formatPlate } from '@/lib/utils';

const stageLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente de diagnóstico',
  EN_PROCESO: 'En reparación (bahías)',
  ESPERANDO_REPUESTOS: 'Esperando repuestos',
  LISTO: 'Listo para entrega',
  ENTREGADO: 'Entregado y cerrado',
};

export default function DashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [kpiFilter, setKpiFilter] = useState<KpiFilterType>('TODOS');
  const [hoveredOrder, setHoveredOrder] = useState<any | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleClearSampleData = async () => {
    try {
      const res = await fetch('/api/admin/clear-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepInventory: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          'Datos de prueba eliminados',
          'Clientes, órdenes y facturas demo reseteados (catálogo preservado)'
        );
        fetchStats();
      } else {
        toast.error('Error', data.error || 'Error al limpiar datos');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión', 'No se pudo contactar con el servidor');
    }
  };

  const rawRecentOrders = stats?.recentOrders || [];

  // Filter recent orders according to the active KPI card
  const filteredRecentOrders = rawRecentOrders.filter((order: any) => {
    if (kpiFilter === 'ACTIVAS') {
      return order.status !== 'ENTREGADO';
    }
    if (kpiFilter === 'POR_COBRAR') {
      return !order.isPaid;
    }
    if (kpiFilter === 'BAJO_STOCK') {
      return (order.items && order.items.length > 0);
    }
    return true;
  });

  const chartOrders = rawRecentOrders.slice(0, 6);
  const maxOrderTotal = Math.max(
    600,
    ...chartOrders.map((o: any) => Number(o.totalAmount || 0))
  );
  const yMax = Math.ceil(maxOrderTotal / 200) * 200;
  const yTicks = [0, Math.round(yMax * 0.33), Math.round(yMax * 0.66), yMax];

  const highestOrder =
    chartOrders.length > 0
      ? chartOrders.reduce((prev: any, curr: any) =>
          Number(curr.totalAmount || 0) > Number(prev.totalAmount || 0) ? curr : prev
        )
      : null;

  const totalOrdersCount = Math.max(
    1,
    (stats?.ordersByStatus || []).reduce((acc: number, s: any) => acc + s.count, 0)
  );

  return (
    <div className="space-y-5 min-w-0">
      {/* Page Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-[var(--rule)]">
        <div className="space-y-1 min-w-0">
          <h1>Jornada del taller</h1>
          <p className="text-[13px] text-[var(--muted)]">
            {loading
              ? 'Sincronizando estado de bahías, caja y almacén local...'
              : `${stats?.activeOrders || 0} órdenes activas en bahía · ${formatCurrency(
                  stats?.totalRevenue || 0
                )} facturados (${formatCurrency(
                  stats?.pendingCollection || 0
                )} por cobrar) · ${stats?.lowStockCount || 0} SKU en punto de pedido.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <ConfirmButton
            label="Limpiar prueba"
            confirmLabel="¿Borrar demo?"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onConfirm={handleClearSampleData}
            className="btn btn-danger"
            confirmClassName="btn danger"
          />

          <button onClick={() => setVoiceModalOpen(true)} className="btn">
            <Mic className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Dictar por voz</span>
          </button>

          <button
            onClick={() => setOrderModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva orden</span>
          </button>
        </div>
      </div>

      {/* Divided KPI Strip with Interactive Filter Tabs */}
      <StatCards
        activeFilter={kpiFilter}
        onSelectFilter={(tab) => setKpiFilter(tab)}
        stats={{
          totalClients: stats?.totalClients || 0,
          totalVehicles: stats?.totalVehicles || 0,
          activeOrders: stats?.activeOrders || 0,
          readyOrders: stats?.readyOrders || 0,
          lowStockCount: stats?.lowStockCount || 0,
          inventoryCount: stats?.inventoryCount || 0,
          totalRevenue: stats?.totalRevenue || 0,
          totalCollected: stats?.totalCollected || 0,
          pendingCollection: stats?.pendingCollection || 0,
        }}
      />

      {/* Signature Workshop Chart + Bay Stage Pipeline */}
      <section className="panel">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Revenue Breakdown Chart with Interactive Hover Readout */}
          <div className="lg:col-span-8 min-w-0">
            <div className="panel-head">
              <div className="min-w-0 flex-1">
                <h2>Desglose económico por orden de trabajo</h2>
                <p className="text-[13px] text-[var(--muted)] mt-0.5 truncate">
                  {hoveredOrder ? (
                    <span className="text-[var(--text)]">
                      <strong className="code-id font-semibold text-[var(--accent)]">
                        {hoveredOrder.orderNumber}
                      </strong>{' '}
                      ({formatPlate(hoveredOrder.vehicle?.plate || '')}) ·{' '}
                      <span className="font-medium">{hoveredOrder.client?.name}</span> · M.O:{' '}
                      <span className="num font-semibold text-[var(--accent)]">
                        {formatCurrency(hoveredOrder.laborTotal)}
                      </span>{' '}
                      · Repuestos:{' '}
                      <span className="num font-semibold text-[#64748b]">
                        {formatCurrency(hoveredOrder.partsTotal)}
                      </span>{' '}
                      · Total:{' '}
                      <span className="num font-semibold text-[var(--positive)]">
                        {formatCurrency(hoveredOrder.totalAmount)}
                      </span>
                    </span>
                  ) : (
                    'Pasa el cursor sobre una barra para ver detalle de cliente, mano de obra y repuestos.'
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-[var(--muted)] shrink-0">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ background: '#1b6c80' }}
                  />
                  Mano de obra ({formatCurrency(stats?.laborRevenue || 0)})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ background: '#94a3b8' }}
                  />
                  Repuestos ({formatCurrency(stats?.partsRevenue || 0)})
                </span>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 640 215"
                className="w-full h-[215px] block select-none"
                role="img"
                aria-label="Gráfico de ingresos por orden de trabajo"
              >
                {/* Horizontal gridlines & Y ticks */}
                {yTicks.map((tick, idx) => {
                  const y = 175 - (tick / (yMax || 1)) * 140;
                  return (
                    <g key={idx}>
                      <line
                        x1="64"
                        y1={y}
                        x2="620"
                        y2={y}
                        stroke="#edf0f2"
                        strokeDasharray={idx === 0 ? undefined : '3 3'}
                        strokeWidth="1"
                      />
                      <text
                        x="56"
                        y={y + 4}
                        textAnchor="end"
                        fill="#55585c"
                        fontSize="11"
                      >
                        S/ {tick}
                      </text>
                    </g>
                  );
                })}

                {/* Bars per order */}
                {chartOrders.map((order: any, i: number) => {
                  const slotWidth = 540 / Math.max(chartOrders.length, 1);
                  const xCenter = 74 + i * slotWidth + slotWidth / 2;
                  const barW = 22;

                  const labor = Number(order.laborTotal || 0);
                  const parts = Number(order.partsTotal || 0);
                  const laborH = Math.max(2, (labor / (yMax || 1)) * 140);
                  const partsH = Math.max(2, (parts / (yMax || 1)) * 140);

                  const laborY = 175 - laborH;
                  const partsY = 175 - partsH;
                  const isHighest = highestOrder && highestOrder.id === order.id;
                  const isHovered = hoveredOrder && hoveredOrder.id === order.id;

                  return (
                    <g
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      onMouseEnter={() => setHoveredOrder(order)}
                      onMouseLeave={() => setHoveredOrder(null)}
                      onFocus={() => setHoveredOrder(order)}
                      onBlur={() => setHoveredOrder(null)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Orden ${order.orderNumber}, total ${formatCurrency(
                        order.totalAmount
                      )}`}
                      className="cursor-pointer outline-none"
                    >
                      {/* Background highlight on hover */}
                      {isHovered && (
                        <rect
                          x={xCenter - barW - 6}
                          y={20}
                          width={barW * 2 + 16}
                          height={165}
                          rx="4"
                          fill="var(--raised)"
                          opacity="0.6"
                        />
                      )}

                      {/* Labor bar */}
                      <rect
                        x={xCenter - barW - 2}
                        y={laborY}
                        width={barW}
                        height={laborH}
                        rx="3"
                        fill={isHovered ? '#155565' : '#1b6c80'}
                      />

                      {/* Parts bar */}
                      <rect
                        x={xCenter + 2}
                        y={partsY}
                        width={barW}
                        height={partsH}
                        rx="3"
                        fill={isHovered ? '#64748b' : '#94a3b8'}
                      />

                      {isHighest && (
                        <g>
                          <text
                            x={xCenter}
                            y={Math.min(laborY, partsY) - 8}
                            textAnchor="middle"
                            fill="#131416"
                            fontSize="11"
                            fontWeight="600"
                          >
                            Máx: {formatCurrency(order.totalAmount)}
                          </text>
                        </g>
                      )}

                      <text
                        x={xCenter}
                        y="193"
                        textAnchor="middle"
                        fill="#131416"
                        fontSize="11"
                        fontWeight="500"
                      >
                        {formatPlate(order.vehicle?.plate || order.orderNumber)}
                      </text>
                      <text
                        x={xCenter}
                        y="207"
                        textAnchor="middle"
                        fill="#55585c"
                        fontSize="11"
                      >
                        {order.orderNumber}
                      </text>
                    </g>
                  );
                })}

                {chartOrders.length === 0 && (
                  <text
                    x="340"
                    y="110"
                    textAnchor="middle"
                    fill="#55585c"
                    fontSize="13"
                  >
                    Sin órdenes activas para graficar en este periodo
                  </text>
                )}
              </svg>
            </div>
          </div>

          {/* Right: Bay Occupancy & Stage Breakdown */}
          <div className="lg:col-span-4 lg:border-l lg:border-[var(--rule)] lg:pl-6 space-y-4 min-w-0">
            <div>
              <h2>Ocupación por etapa de servicio</h2>
              <p className="text-[13px] text-[var(--muted)] mt-0.5">
                Distribución actual de vehículos según estado operativo.
              </p>
            </div>

            <div className="space-y-3">
              {(stats?.ordersByStatus || []).map((row: any) => {
                const label = stageLabels[row.status] || row.status;
                const pct = Math.round((row.count / totalOrdersCount) * 100);

                let barColor = 'var(--accent)';
                if (row.status === 'LISTO') barColor = 'var(--positive)';
                if (row.status === 'ESPERANDO_REPUESTOS') barColor = 'var(--negative)';
                if (row.status === 'PENDIENTE') barColor = 'var(--warning)';

                return (
                  <div key={row.status} className="space-y-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[var(--text)]">{label}</span>
                      <span className="num font-medium text-[var(--muted)]">
                        {row.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--rule)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(pct, row.count > 0 ? 8 : 0)}%`,
                          background: barColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[var(--rule)] flex items-center justify-between text-[13px]">
              <span className="text-[var(--muted)]">Comprobantes emitidos</span>
              <span className="num font-medium text-[var(--text)]">
                {stats?.invoicesCount || 0} documentos SUNAT / internos
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Paired Row: Recent Orders & Warehouse Stock Control */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 min-w-0">
          <RecentOrders
            orders={filteredRecentOrders}
            onSelectOrder={(order) => setSelectedOrder(order)}
          />
        </div>

        <div className="lg:col-span-5 min-w-0">
          <LowStockAlert
            items={stats?.lowStockItems || []}
            fallbackItems={stats?.allInventory || []}
          />
        </div>
      </div>

      {/* Modals & Inspection Sheets */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={() => {
            fetchStats();
            setSelectedOrder(null);
          }}
        />
      )}

      <OrderFormModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onOrderSaved={() => {
          fetchStats();
        }}
      />

      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
      />
    </div>
  );
}
