'use client';

import React, { useState, useEffect } from 'react';
import { X, Car } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { formatPlate } from '@/lib/utils';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleSaved: () => void;
  client: { id: string; name: string } | null;
  vehicleToEdit?: any | null;
}

export function VehicleFormModal({
  isOpen,
  onClose,
  onVehicleSaved,
  client,
  vehicleToEdit,
}: VehicleFormModalProps) {
  const toast = useToast();
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [vin, setVin] = useState('');
  const [mileage, setMileage] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Escape key listener & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    if (vehicleToEdit) {
      setPlate(vehicleToEdit.plate || '');
      setBrand(vehicleToEdit.brand || '');
      setModel(vehicleToEdit.model || '');
      setYear(vehicleToEdit.year?.toString() || '');
      setColor(vehicleToEdit.color || '');
      setVin(vehicleToEdit.vin || '');
      setMileage(vehicleToEdit.mileage?.toString() || '');
    } else {
      setPlate('');
      setBrand('');
      setModel('');
      setYear('');
      setColor('');
      setVin('');
      setMileage('');
    }
    setErrorMsg('');
  }, [vehicleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) {
      setErrorMsg('La placa vehicular es obligatoria.');
      return;
    }

    if (!vehicleToEdit && !client?.id) {
      setErrorMsg('No se ha especificado el titular para asignar el vehículo.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const plateNormalized = plate.toUpperCase().trim();

      if (vehicleToEdit) {
        // Actualizar vehículo existente
        const res = await fetch(`/api/vehicles/${vehicleToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plate: plateNormalized,
            brand: brand.trim(),
            model: model.trim(),
            year: year ? parseInt(year) : null,
            color: color.trim() || null,
            vin: vin.trim() || null,
            mileage: mileage ? parseInt(mileage) : null,
          }),
        });

        const data = await res.json();
        if (data.success) {
          toast.success(
            'Carro actualizado',
            `Vehículo ${formatPlate(plateNormalized)} modificado correctamente`
          );
          onVehicleSaved();
          onClose();
        } else {
          setErrorMsg(data.error || 'Error al actualizar el vehículo');
        }
      } else {
        // Crear nuevo vehículo para el cliente
        const res = await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plate: plateNormalized,
            brand: brand.trim(),
            model: model.trim(),
            year: year ? parseInt(year) : null,
            color: color.trim() || null,
            vin: vin.trim() || null,
            mileage: mileage ? parseInt(mileage) : null,
            clientId: client!.id,
          }),
        });

        const data = await res.json();
        if (data.success) {
          toast.success(
            'Carro registrado',
            `Vehículo ${formatPlate(plateNormalized)} asignado a ${client!.name}`
          );
          onVehicleSaved();
          onClose();
        } else {
          setErrorMsg(data.error || 'Error al registrar el vehículo');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al guardar el vehículo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--raised)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--r-md)] bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h2>
                {vehicleToEdit
                  ? `Editar carro · ${formatPlate(vehicleToEdit.plate)}`
                  : `Agregar carro a ${client?.name || 'cliente'}`}
              </h2>
              <p className="text-[12px] text-[var(--muted)]">
                {vehicleToEdit
                  ? `Ficha técnica de la unidad asignada a ${client?.name || 'titular'}`
                  : `Registra un nuevo vehículo bajo el nombre de ${client?.name || 'este titular'}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn px-2.5" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-5 overflow-y-auto space-y-4 flex-1"
        >
          {errorMsg && (
            <div className="p-3 rounded-[var(--r-md)] bg-[#fdecec] border border-[#f1cfd1] text-[var(--negative)] text-[12px]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Placa vehicular *
              </label>
              <input
                type="text"
                required
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="ABC-123"
                className="input font-semibold"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Marca del fabricante
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Toyota, Hyundai, Nissan..."
                className="input"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Modelo
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Corolla, Yaris, Hilux..."
                className="input"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Año de fabricación
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2018"
                className="input num"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Color de carrocería
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Blanco, Gris, Rojo..."
                className="input"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Kilometraje actual (km)
              </label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="85000"
                className="input num"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] text-[var(--muted)] mb-1">
              Número de Chasis / VIN (opcional)
            </label>
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              placeholder="17 dígitos alfanuméricos..."
              className="input uppercase text-[12px]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--rule)]">
            <button type="button" onClick={onClose} className="btn">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving
                ? 'Guardando...'
                : vehicleToEdit
                ? 'Guardar cambios'
                : 'Registrar carro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
