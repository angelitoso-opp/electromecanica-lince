'use client';

import React, { useState } from 'react';
import { Share2, Search, Eye } from 'lucide-react';
import {
  formatCurrency,
  formatPlate,
  formatShortDate,
  generateWhatsAppQuoteUrl,
} from '@/lib/utils';

interface OrderKanbanProps {
  orders: any[];
  onSelectOrder: (order: any) => void;
}

const COLUMNS = [
  { id: 'PENDIENTE', title: 'Pendiente', tone: 'warn' },
  { id: 'EN_PROCESO', title: 'En bahía', tone: 'info' },
  { id: 'ESPERANDO_REPUESTOS', title: 'Esp. repuesto', tone: 'err' },
  { id: 'LISTO', title: 'Listo entrega', tone: 'ok' },
  { id: 'ENTREGADO', title: 'Entregado', tone: '' },
];

export function OrderKanban({ orders, onSelectOrder }: OrderKanbanProps) {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('TODOS');

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      order.orderNumber.toLowerCase().includes(q) ||
      (order.vehicle?.plate || '').toLowerCase().includes(q) ||
      (order.client?.name || '').toLowerCase().includes(q) ||
      (order.technicianName || '').toLowerCase().includes(q);

    const matchesStatus =
      selectedStatus === 'TODOS' || order.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleShareWhatsApp = (e: React.MouseEvent, order: any) => {
    e.stopPropagation();
    const url = generateWhatsAppQuoteUrl({
      clientPhone: order.client?.phone || '',
      clientName: order.client?.name || '',
      plate: order.vehicle?.plate || '',
      vehicleModel: `${order.vehicle?.brand || ''} ${order.vehicle?.model || ''}`,
      orderNumber: order.orderNumber,
      services: order.services || [],
      items: order.items || [],
      total: order.totalAmount,
    });
    window.open(url, '_blank');
  };

  const countByStatus = (st: string) =>
    orders.filter((o) => o.status === st).length;

  return (
    <div className="space-y-4">
      {/* Count Cards that Filter */}
      <div className="kpis">
        <button
          type="button"
          onClick={() => setSelectedStatus('TODOS')}
          className={`kpi text-left cursor-pointer ${
            selectedStatus === 'TODOS' ? 'bg-[var(--raised)]' : ''
          }`}
        >
          <span className="kpi-label">Todas las órdenes</span>
          <span className="kpi-val">{orders.length}</span>
          <span className="kpi-delta">Historial activo del taller</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('EN_PROCESO')}
          className={`kpi text-left cursor-pointer ${
            selectedStatus === 'EN_PROCESO' ? 'bg-[var(--raised)]' : ''
          }`}
        >
          <span className="kpi-label">En bahía (reparación)</span>
          <span className="kpi-val">{countByStatus('EN_PROCESO')}</span>
          <span className="kpi-delta">
            + {countByStatus('PENDIENTE')} pendientes de diagnóstico
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('ESPERANDO_REPUESTOS')}
          className={`kpi text-left cursor-pointer ${
            selectedStatus === 'ESPERANDO_REPUESTOS' ? 'bg-[var(--raised)]' : ''
          }`}
        >
          <span className="kpi-label">Esperando repuestos</span>
          <span className="kpi-val">{countByStatus('ESPERANDO_REPUESTOS')}</span>
          <span className="kpi-delta warn">Seguimiento con almacén</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('LISTO')}
          className={`kpi text-left cursor-pointer ${
            selectedStatus === 'LISTO' ? 'bg-[var(--raised)]' : ''
          }`}
        >
          <span className="kpi-label">Listos para entrega</span>
          <span className="kpi-val">{countByStatus('LISTO')}</span>
          <span className="kpi-delta up">
            {countByStatus('ENTREGADO')} entregados previamente
          </span>
        </button>
      </div>

      {/* Filter & View Mode Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por placa, orden, cliente o técnico..."
            className="input pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="select w-auto"
            aria-label="Filtrar por estado"
          >
            <option value="TODOS">Todos los estados ({orders.length})</option>
            <option value="PENDIENTE">Pendientes ({countByStatus('PENDIENTE')})</option>
            <option value="EN_PROCESO">En bahía ({countByStatus('EN_PROCESO')})</option>
            <option value="ESPERANDO_REPUESTOS">
              Esperando repuesto ({countByStatus('ESPERANDO_REPUESTOS')})
            </option>
            <option value="LISTO">Listos ({countByStatus('LISTO')})</option>
            <option value="ENTREGADO">Entregados ({countByStatus('ENTREGADO')})</option>
          </select>

          <div className="inline-flex rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--raised)] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-[6px] text-[12px] font-medium cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]'
                  : 'text-[var(--muted)]'
              }`}
            >
              Tabla
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-[6px] text-[12px] font-medium cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]'
                  : 'text-[var(--muted)]'
              }`}
            >
              Tablero
            </button>
          </div>
        </div>
      </div>

      {/* LIST / TABLE VIEW */}
      {viewMode === 'list' ? (
        <section className="panel p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Orden / Placa</th>
                  <th>Vehículo</th>
                  <th>Cliente</th>
                  <th>Trabajo solicitado</th>
                  <th>Estado</th>
                  <th>Pago</th>
                  <th className="num">Total</th>
                  <th className="num">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const col =
                    COLUMNS.find((c) => c.id === order.status) || COLUMNS[0];
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
                          <code className="px-1.5 py-0.5 rounded bg-[var(--raised)] border border-[var(--border)]">
                            {formatPlate(order.vehicle?.plate || '')}
                          </code>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-[var(--text)]">
                          {order.vehicle?.brand} {order.vehicle?.model}
                        </div>
                        <div className="text-[12px] text-[var(--muted)]">
                          Técnico: {order.technicianName || 'Timoteo Pariona'}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-[var(--text)]">
                          {order.client?.name}
                        </div>
                        <div className="text-[12px] text-[var(--muted)] num">
                          {order.client?.phone}
                        </div>
                      </td>
                      <td className="max-w-[260px]">
                        <div className="truncate text-[var(--text)]">
                          {order.issueDescription || order.diagnosis}
                        </div>
                        <div className="text-[12px] text-[var(--muted)]">
                          Ingreso: {formatShortDate(order.createdAt)}
                        </div>
                      </td>
                      <td>
                        <span className={`pill ${col.tone}`}>{col.title}</span>
                      </td>
                      <td>
                        <span className={`pill ${order.isPaid ? 'ok' : 'warn'}`}>
                          {order.isPaid ? 'Pagado' : 'Por cobrar'}
                        </span>
                      </td>
                      <td className="num font-medium text-[var(--text)]">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td
                        className="num"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectOrder(order)}
                            className="btn px-2.5 h-7 text-[12px]"
                            title="Abrir detalle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleShareWhatsApp(e, order)}
                            className="btn px-2.5 h-7 text-[12px]"
                            title="Enviar proforma por WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5 text-[var(--positive)]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-[var(--muted)]">
                      No se encontraron órdenes con los criterios seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 items-start">
          {COLUMNS.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.id);

            return (
              <div key={col.id} className="panel p-3 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--rule)]">
                  <span className={`pill ${col.tone}`}>{col.title}</span>
                  <span className="num text-[12px] font-medium text-[var(--muted)]">
                    {colOrders.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {colOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className="p-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--raised)] space-y-2 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <code>{order.orderNumber}</code>
                        <button
                          type="button"
                          onClick={(e) => handleShareWhatsApp(e, order)}
                          className="text-[var(--muted)] hover:text-[var(--text)] p-1"
                          title="Enviar proforma por WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <code className="px-1.5 py-0.5 rounded bg-[var(--raised)] border border-[var(--border)] font-medium">
                            {formatPlate(order.vehicle?.plate || '')}
                          </code>
                          <span className="font-medium text-[12px] truncate">
                            {order.vehicle?.brand} {order.vehicle?.model}
                          </span>
                        </div>
                      </div>

                      <p className="text-[12px] text-[var(--muted)] line-clamp-2">
                        {order.issueDescription || order.diagnosis}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--rule)] text-[12px]">
                        <span className="text-[var(--muted)] truncate max-w-[100px]">
                          {order.client?.name}
                        </span>
                        <span className="num font-medium text-[var(--text)]">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {colOrders.length === 0 && (
                    <div className="py-6 text-center text-[12px] text-[var(--muted)]">
                      Sin unidades en esta etapa
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
