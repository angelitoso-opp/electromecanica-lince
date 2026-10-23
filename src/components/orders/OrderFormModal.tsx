'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { formatCurrency, formatPlate } from '@/lib/utils';
import { useToast } from '@/components/ui/ToastProvider';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSaved: () => void;
}

export function OrderFormModal({
  isOpen,
  onClose,
  onOrderSaved,
}: OrderFormModalProps) {
  const toast = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);

  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVehicleBrand, setNewVehicleBrand] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehicleMileage, setNewVehicleMileage] = useState('');

  const [issueDescription, setIssueDescription] = useState('');
  const [diagnostic, setDiagnostic] = useState('');
  const [technicianName, setTechnicianName] = useState('Timoteo Pariona');
  const [mileageAtService, setMileageAtService] = useState('');
  const [status, setStatus] = useState('PENDIENTE');
  const [discount, setDiscount] = useState('0');

  const [services, setServices] = useState<{ description: string; cost: number }[]>([
    { description: '', cost: 0 },
  ]);
  const [items, setItems] = useState<
    { inventoryItemId: string; description: string; quantity: number; unitPrice: number }[]
  >([]);

  // Escape key listener & body scroll lock
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
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const [resClients, resInv] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/inventory'),
        ]);
        const dataClients = await resClients.json();
        const dataInv = await resInv.json();

        if (dataClients.success) setClients(dataClients.clients);
        if (dataInv.success) setInventory(dataInv.items);

        const voicePrefillStr = sessionStorage.getItem('voice_prefill_order');
        if (voicePrefillStr) {
          sessionStorage.removeItem('voice_prefill_order');
          const prefill = JSON.parse(voicePrefillStr);

          if (prefill.matchedClient && prefill.matchedVehicle) {
            setSelectedClientId(prefill.matchedClient.id);
            setSelectedVehicleId(prefill.matchedVehicle.id);
          } else if (prefill.plate) {
            setIsNewClient(true);
            setNewVehiclePlate(prefill.plate);
            if (prefill.vehicleBrand) setNewVehicleBrand(prefill.vehicleBrand);
            if (prefill.vehicleModel) setNewVehicleModel(prefill.vehicleModel);
          }

          if (prefill.mileage) {
            setMileageAtService(prefill.mileage.toString());
          }
          if (prefill.suggestedServices?.length > 0) {
            setServices(prefill.suggestedServices);
          }
          if (prefill.suggestedItems?.length > 0) {
            setItems(prefill.suggestedItems);
          }
          if (prefill.rawTranscript) {
            setIssueDescription(prefill.rawTranscript);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [isOpen]);

  const currentClient = clients.find((c) => c.id === selectedClientId);
  const clientVehicles = currentClient ? currentClient.vehicles : [];

  const addService = () => {
    setServices([...services, { description: '', cost: 0 }]);
  };
  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };
  const updateService = (index: number, field: string, value: any) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      { inventoryItemId: '', description: '', quantity: 1, unitPrice: 0 },
    ]);
  };
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  const handleSelectInventoryItem = (index: number, itemId: string) => {
    const found = inventory.find((i) => i.id === itemId);
    const updated = [...items];
    if (found) {
      updated[index] = {
        inventoryItemId: found.id,
        description: `${found.name} (${found.brand || 'Genérico'})`,
        quantity: 1,
        unitPrice: found.unitPrice,
      };
    } else {
      updated[index] = {
        inventoryItemId: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
      };
    }
    setItems(updated);
  };
  const updateItemQty = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, qty);
    setItems(updated);
  };
  const updateItemPrice = (index: number, price: number) => {
    const updated = [...items];
    updated[index].unitPrice = Math.max(0, price);
    setItems(updated);
  };

  const laborTotal = services.reduce(
    (sum, s) => sum + (parseFloat(s.cost as any) || 0),
    0
  );
  const partsTotal = items.reduce(
    (sum, i) => sum + (i.quantity || 1) * (parseFloat(i.unitPrice as any) || 0),
    0
  );
  const discountVal = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, laborTotal + partsTotal - discountVal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    let finalClientId = selectedClientId;
    let finalVehicleId = selectedVehicleId;

    if (!issueDescription.trim()) {
      setErrorMsg('Ingresa el motivo de ingreso o falla reportada.');
      return;
    }

    setSaving(true);

    try {
      if (isNewClient) {
        if (!newClientName || !newClientPhone || !newVehiclePlate) {
          setErrorMsg(
            'Completa el nombre, teléfono y placa para el nuevo cliente.'
          );
          setSaving(false);
          return;
        }

        const resClient = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newClientName,
            phone: newClientPhone,
            vehicle: {
              plate: newVehiclePlate,
              brand: newVehicleBrand,
              model: newVehicleModel,
              mileage: newVehicleMileage,
            },
          }),
        });

        const dataClient = await resClient.json();
        if (!dataClient.success) {
          setErrorMsg(dataClient.error || 'Error al registrar el cliente');
          setSaving(false);
          return;
        }

        finalClientId = dataClient.client.id;
        finalVehicleId = dataClient.client.vehicles[0].id;
      } else {
        if (!finalClientId || !finalVehicleId) {
          setErrorMsg('Selecciona un cliente y su vehículo.');
          setSaving(false);
          return;
        }
      }

      const validServices = services.filter((s) => s.description.trim() !== '');
      const validItems = items.filter((i) => i.description.trim() !== '');

      const resOrder = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: finalClientId,
          vehicleId: finalVehicleId,
          issueDescription,
          diagnostic,
          mileageAtService,
          technicianName,
          status,
          discount: discountVal,
          services: validServices,
          items: validItems,
        }),
      });

      const dataOrder = await resOrder.json();
      if (dataOrder.success) {
        toast.success('Orden de trabajo registrada', `Orden ${dataOrder.order?.orderNumber || ''} creada exitosamente`);
        onOrderSaved();
        onClose();
      } else {
        setErrorMsg(dataOrder.error || 'Error al guardar la orden');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al guardar la orden');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-4xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--raised)]">
          <div>
            <h2>Nueva orden de trabajo</h2>
            <p className="text-[12px] text-[var(--muted)]">
              Registra el ingreso de unidad, diagnóstico técnico, repuestos y mano de obra.
            </p>
          </div>
          <button onClick={onClose} className="btn px-2.5" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-5 overflow-y-auto space-y-5 flex-1"
        >
          {errorMsg && (
            <div className="p-3 rounded-[var(--r-md)] bg-[#fdecec] border border-[#f1cfd1] text-[var(--negative)] text-[12px]">
              {errorMsg}
            </div>
          )}

          {/* 1. Cliente y Vehículo */}
          <div className="p-4 rounded-[var(--r-md)] border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              <h3>Cliente y vehículo</h3>
              <button
                type="button"
                onClick={() => {
                  setIsNewClient(!isNewClient);
                  setSelectedClientId('');
                  setSelectedVehicleId('');
                }}
                className="text-[12px] font-medium text-[var(--accent)] hover:underline cursor-pointer"
              >
                {isNewClient
                  ? 'Seleccionar cliente registrado'
                  : '+ Registrar cliente y vehículo nuevo'}
              </button>
            </div>

            {!isNewClient ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[var(--muted)] mb-1">
                    Cliente titular
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value);
                      setSelectedVehicleId('');
                    }}
                    className="select"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] text-[var(--muted)] mb-1">
                    Vehículo / Placa
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    disabled={!selectedClientId}
                    className="select disabled:opacity-50"
                  >
                    <option value="">Seleccionar unidad...</option>
                    {clientVehicles.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {formatPlate(v.plate)} · {v.brand} {v.model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[12px] text-[var(--muted)] mb-1">
                    Nombre del cliente *
                  </label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[var(--muted)] mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="Ej. 987654321"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[var(--muted)] mb-1">
                    Placa del vehículo *
                  </label>
                  <input
                    type="text"
                    value={newVehiclePlate}
                    onChange={(e) =>
                      setNewVehiclePlate(e.target.value.toUpperCase())
                    }
                    placeholder="Ej. ABC-123"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[var(--muted)] mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={newVehicleBrand}
                    onChange={(e) => setNewVehicleBrand(e.target.value)}
                    placeholder="Toyota, Nissan..."
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[var(--muted)] mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    placeholder="Hilux, Yaris..."
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[var(--muted)] mb-1">
                    Kilometraje actual
                  </label>
                  <input
                    type="number"
                    value={newVehicleMileage}
                    onChange={(e) => setNewVehicleMileage(e.target.value)}
                    placeholder="85000"
                    className="input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Falla y Diagnóstico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text)] mb-1">
                Motivo de ingreso / síntoma *
              </label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Falla reportada por el cliente o mantenimiento programado..."
                rows={3}
                className="textarea resize-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text)] mb-1">
                Diagnóstico técnico preliminar
              </label>
              <textarea
                value={diagnostic}
                onChange={(e) => setDiagnostic(e.target.value)}
                placeholder="Inspección del mecánico, piezas por reemplazar..."
                rows={3}
                className="textarea resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Técnico responsable
              </label>
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Kilometraje de ingreso (km)
              </label>
              <input
                type="number"
                value={mileageAtService}
                onChange={(e) => setMileageAtService(e.target.value)}
                placeholder="78500"
                className="input"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Etapa inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="select"
              >
                <option value="PENDIENTE">Pendiente de revisión</option>
                <option value="EN_PROCESO">En reparación (bahía)</option>
                <option value="ESPERANDO_REPUESTOS">Esperando repuestos</option>
                <option value="LISTO">Listo para entrega</option>
              </select>
            </div>
          </div>

          {/* 3. Servicios / Mano de Obra */}
          <div className="p-4 rounded-[var(--r-md)] border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              <h3>Mano de obra y servicios</h3>
              <button type="button" onClick={addService} className="btn">
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir servicio</span>
              </button>
            </div>

            {services.map((service, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={service.description}
                  onChange={(e) =>
                    updateService(idx, 'description', e.target.value)
                  }
                  placeholder="Descripción del trabajo (ej. Afinamiento electrónico, cambio de pastillas)"
                  className="input flex-1"
                />
                <div className="flex items-center gap-1.5 w-32">
                  <span className="text-[12px] text-[var(--muted)]">S/</span>
                  <input
                    type="number"
                    step="0.5"
                    value={service.cost || ''}
                    onChange={(e) => updateService(idx, 'cost', e.target.value)}
                    placeholder="0.00"
                    className="input text-right num"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeService(idx)}
                  className="btn px-2 text-[var(--muted)] hover:text-[var(--negative)]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* 4. Repuestos */}
          <div className="p-4 rounded-[var(--r-md)] border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              <h3>Repuestos e insumos de almacén</h3>
              <button type="button" onClick={addItem} className="btn">
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir repuesto</span>
              </button>
            </div>

            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
              >
                <div className="sm:col-span-5">
                  <select
                    value={item.inventoryItemId}
                    onChange={(e) =>
                      handleSelectInventoryItem(idx, e.target.value)
                    }
                    className="select"
                  >
                    <option value="">Seleccionar de almacén...</option>
                    {inventory.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.name} (Stock: {inv.stock}) ·{' '}
                        {formatCurrency(inv.unitPrice)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx].description = e.target.value;
                      setItems(updated);
                    }}
                    placeholder="Descripción del ítem"
                    className="input"
                  />
                </div>

                <div className="sm:col-span-1">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItemQty(idx, parseInt(e.target.value) || 1)
                    }
                    className="input text-center num"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-1">
                  <span className="text-[12px] text-[var(--muted)]">S/</span>
                  <input
                    type="number"
                    step="0.5"
                    value={item.unitPrice || ''}
                    onChange={(e) =>
                      updateItemPrice(idx, parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    className="input text-right num"
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="btn px-2 text-[var(--muted)] hover:text-[var(--negative)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 5. Totales */}
          <div className="p-4 rounded-[var(--r-md)] bg-[var(--raised)] border border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-[12px]">
              <div>
                <span className="text-[var(--muted)] block">Mano de obra</span>
                <span className="font-semibold num text-[var(--text)]">
                  {formatCurrency(laborTotal)}
                </span>
              </div>
              <div>
                <span className="text-[var(--muted)] block">Repuestos</span>
                <span className="font-semibold num text-[var(--text)]">
                  {formatCurrency(partsTotal)}
                </span>
              </div>
              <div>
                <span className="text-[var(--muted)] block">Descuento (S/)</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="input w-24 min-h-[28px] py-0.5 text-right num"
                />
              </div>
            </div>

            <div className="text-right">
              <span className="text-[12px] text-[var(--muted)] block">
                Importe total
              </span>
              <span className="text-[22px] font-semibold num text-[var(--text)]">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Guardando...' : 'Guardar orden de trabajo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
