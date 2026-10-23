'use client';

import React, { useState, useEffect } from 'react';
import { ClientList } from '@/components/clients/ClientList';
import { ClientFormModal } from '@/components/clients/ClientFormModal';
import { VehicleHistoryModal } from '@/components/clients/VehicleHistoryModal';
import { Plus } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [selectedVehicleData, setSelectedVehicleData] = useState<{
    vehicle: any;
    client: any;
  } | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data.success) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const totalVehicles = clients.reduce(
    (sum, c) => sum + (c.vehicles?.length || 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[var(--rule)]">
        <div className="space-y-1">
          <h1>Clientes y flota</h1>
          <p className="text-[13px] text-[var(--muted)]">
            {loading
              ? 'Cargando padrón de clientes y vehículos...'
              : `${clients.length} titulares registrados · ${totalVehicles} unidades con historial técnico por placa.`}
          </p>
        </div>

        <button
          onClick={() => setClientModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Registrar cliente y unidad</span>
        </button>
      </div>

      {/* Clients List */}
      {loading ? (
        <div className="panel py-12 text-center text-[var(--muted)]">
          Cargando clientes y vehículos...
        </div>
      ) : (
        <ClientList
          clients={clients}
          onOpenNewClient={() => setClientModalOpen(true)}
          onOpenVehicleHistory={(vehicle, client) => {
            setSelectedVehicleData({ vehicle, client });
          }}
          onRefresh={fetchClients}
        />
      )}

      {/* Modals */}
      <ClientFormModal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onClientSaved={fetchClients}
      />

      {selectedVehicleData && (
        <VehicleHistoryModal
          vehicle={selectedVehicleData.vehicle}
          client={selectedVehicleData.client}
          isOpen={!!selectedVehicleData}
          onClose={() => setSelectedVehicleData(null)}
        />
      )}
    </div>
  );
}
