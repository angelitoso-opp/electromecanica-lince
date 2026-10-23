'use client';

import React, { useState } from 'react';
import { Search, History, Trash2, Edit2, Plus } from 'lucide-react';
import { formatPlate } from '@/lib/utils';
import { useToast, ConfirmButton } from '@/components/ui/ToastProvider';

interface ClientListProps {
  clients: any[];
  onOpenNewClient: () => void;
  onEditClient: (client: any) => void;
  onAddVehicle: (client: any) => void;
  onEditVehicle: (vehicle: any, client: any) => void;
  onOpenVehicleHistory: (vehicle: any, client: any) => void;
  onRefresh: () => void;
}

export function ClientList({
  clients,
  onOpenNewClient,
  onEditClient,
  onAddVehicle,
  onEditVehicle,
  onOpenVehicleHistory,
  onRefresh,
}: ClientListProps) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const handleDeleteClient = async (client: any) => {
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Cliente eliminado', `${client.name} fue retirado de la base de datos`);
        onRefresh();
      } else {
        toast.error('Error', data.error || 'Error al eliminar cliente');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de red', 'No se pudo conectar para eliminar cliente');
    }
  };

  const filteredClients = clients.filter((client) => {
    const q = searchQuery.toLowerCase();
    const matchName = client.name.toLowerCase().includes(q);
    const matchPhone = client.phone.toLowerCase().includes(q);
    const matchDoc = (client.document || '').toLowerCase().includes(q);
    const matchVehicle = (client.vehicles || []).some(
      (v: any) =>
        v.plate.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q)
    );
    return matchName || matchPhone || matchDoc || matchVehicle;
  });

  const totalVehicles = clients.reduce(
    (sum, c) => sum + (c.vehicles?.length || 0),
    0
  );
  const withDoc = clients.filter((c) => Boolean(c.document)).length;
  const multiVehicle = clients.filter((c) => (c.vehicles?.length || 0) > 1).length;

  return (
    <div className="space-y-4">
      {/* KPI Summary Strip */}
      <div className="kpis">
        <div className="kpi">
          <span className="kpi-label">Titulares registrados</span>
          <span className="kpi-val">{clients.length}</span>
          <span className="kpi-delta">Con ficha activa en taller</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Carros registrados</span>
          <span className="kpi-val">{totalVehicles}</span>
          <span className="kpi-delta">Vinculados por número de placa</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Con DNI / RUC validado</span>
          <span className="kpi-val">{withDoc}</span>
          <span className="kpi-delta">Aptos para facturación inmediata</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Titulares con más de un carro</span>
          <span className="kpi-val">{multiVehicle}</span>
          <span className="kpi-delta">Familias o clientes con varios autos</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por cliente, teléfono, DNI/RUC, placa o modelo..."
            className="input pl-9"
          />
        </div>
        <div className="text-[12px] text-[var(--muted)] num">
          Mostrando {filteredClients.length} de {clients.length} titulares
        </div>
      </div>

      {/* Clients Table */}
      <section className="panel p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Titular / Cliente</th>
                <th className="num">Documento</th>
                <th className="num">Teléfono / WhatsApp</th>
                <th>Carros asignados (relación 1 a N)</th>
                <th>Observaciones</th>
                <th className="num">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div className="font-medium text-[var(--text)]">
                      {client.name}
                    </div>
                    {client.email && (
                      <div className="text-[12px] text-[var(--muted)]">
                        {client.email}
                      </div>
                    )}
                  </td>
                  <td className="num">
                    {client.document ? (
                      <code>{client.document}</code>
                    ) : (
                      <span className="text-[var(--muted)]">S/R</span>
                    )}
                  </td>
                  <td className="num">
                    <a
                      href={`https://wa.me/51${client.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--accent)] hover:underline font-medium"
                    >
                      {client.phone}
                    </a>
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      {client.vehicles?.map((v: any) => (
                        <div
                          key={v.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--raised)] text-[12px]"
                        >
                          <code className="font-semibold">{formatPlate(v.plate)}</code>
                          <span className="font-medium text-[var(--text)]">
                            {v.brand} {v.model}
                          </span>
                          {v.mileage && (
                            <span className="text-[var(--muted)] num text-[11px]">
                              ({v.mileage.toLocaleString()} km)
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditVehicle(v, client)}
                            className="btn h-6 px-1.5 text-[11px] ml-0.5"
                            title={`Editar carro ${v.plate}`}
                          >
                            <Edit2 className="w-3 h-3 text-[var(--muted)] hover:text-[var(--accent)]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenVehicleHistory(v, client)}
                            className="btn h-6 px-2 text-[11px]"
                            title="Ver hoja de vida de la unidad"
                          >
                            <History className="w-3 h-3" />
                            <span>Historial</span>
                          </button>
                        </div>
                      ))}

                      {/* Botón rápido para agregar otro carro a este cliente */}
                      <button
                        type="button"
                        onClick={() => onAddVehicle(client)}
                        className="btn h-7 px-2.5 text-[12px] text-[var(--accent)] border-dashed border-[var(--border)] hover:border-[var(--accent)]"
                        title={`Agregar otro carro a ${client.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Carro</span>
                      </button>
                    </div>
                  </td>
                  <td className="text-[12px] text-[var(--muted)] max-w-[200px] truncate">
                    {client.notes || 'Sin observaciones'}
                  </td>
                  <td className="num">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEditClient(client)}
                        className="btn px-2.5 h-7 text-[12px]"
                        title="Editar datos del titular"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span>Editar</span>
                      </button>
                      <ConfirmButton
                        label=""
                        confirmLabel="¿Borrar?"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        onConfirm={() => handleDeleteClient(client)}
                        className="btn btn-danger px-2.5 h-7 text-[12px]"
                        confirmClassName="btn danger px-2.5 h-7 text-[12px]"
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[var(--muted)]">
                    No se encontraron clientes con el criterio de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
