'use client';

import React, { useState, useEffect } from 'react';
import { ClientList } from '@/components/clients/ClientList';
import { ClientFormModal } from '@/components/clients/ClientFormModal';
import { VehicleFormModal } from '@/components/clients/VehicleFormModal';
import { VehicleHistoryModal } from '@/components/clients/VehicleHistoryModal';
import { Plus } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Client modal states
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<any | null>(null);

  // Vehicle modal states (para agregar o editar un carro específico)
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [selectedClientForVehicle, setSelectedClientForVehicle] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [vehicleToEdit, setVehicleToEdit] = useState<any | null>(null);

  // Vehicle history modal states
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

  const handleOpenNewClient = () => {
    setClientToEdit(null);
    setClientModalOpen(true);
  };

  const handleEditClient = (client: any) => {
    setClientToEdit(client);
    setClientModalOpen(true);
  };

  const handleAddVehicle = (client: any) => {
    setSelectedClientForVehicle({ id: client.id, name: client.name });
    setVehicleToEdit(null);
    setVehicleModalOpen(true);
  };

  const handleEditVehicle = (vehicle: any, client: any) => {
    setSelectedClientForVehicle({ id: client.id, name: client.name });
    setVehicleToEdit(vehicle);
    setVehicleModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[var(--rule)]">
        <div className="space-y-1">
          <h1>Clientes y carros</h1>
          <p className="text-[13px] text-[var(--muted)]">
            {loading
              ? 'Cargando padrón de clientes y vehículos...'
              : `${clients.length} titulares registrados · ${totalVehicles} carros con historial técnico por placa.`}
          </p>
        </div>

        <button
          onClick={handleOpenNewClient}
          className="btn btn-primary"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Registrar cliente y carro</span>
        </button>
      </div>

      {/* Clients List */}
      {loading ? (
        <div className="panel py-12 text-center text-[var(--muted)]">
          Cargando clientes y carros...
        </div>
      ) : (
        <ClientList
          clients={clients}
          onOpenNewClient={handleOpenNewClient}
          onEditClient={handleEditClient}
          onAddVehicle={handleAddVehicle}
          onEditVehicle={handleEditVehicle}
          onOpenVehicleHistory={(vehicle, client) => {
            setSelectedVehicleData({ vehicle, client });
          }}
          onRefresh={fetchClients}
        />
      )}

      {/* Modal: Registro y Edición de Cliente */}
      <ClientFormModal
        isOpen={clientModalOpen}
        clientToEdit={clientToEdit}
        onClose={() => {
          setClientModalOpen(false);
          setClientToEdit(null);
        }}
        onClientSaved={fetchClients}
      />

      {/* Modal: Registro y Edición de Carro (1 a N) */}
      <VehicleFormModal
        isOpen={vehicleModalOpen}
        client={selectedClientForVehicle}
        vehicleToEdit={vehicleToEdit}
        onClose={() => {
          setVehicleModalOpen(false);
          setSelectedClientForVehicle(null);
          setVehicleToEdit(null);
        }}
        onVehicleSaved={fetchClients}
      />

      {/* Modal: Hoja de Vida / Historial del Vehículo */}
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
