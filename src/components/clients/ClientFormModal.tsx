'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSaved: () => void;
}

export function ClientFormModal({
  isOpen,
  onClose,
  onClientSaved,
}: ClientFormModalProps) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMsg('Nombre y teléfono son obligatorios.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          document,
          email,
          notes,
          vehicle: plate.trim()
            ? {
                plate: plate.toUpperCase().trim(),
                brand,
                model,
                year,
                color,
                mileage,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Cliente registrado', `${name} guardado correctamente`);
        onClientSaved();
        onClose();
      } else {
        setErrorMsg(data.error || 'Error al guardar cliente');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al guardar cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--raised)]">
          <div>
            <h2>Registrar cliente y unidad</h2>
            <p className="text-[12px] text-[var(--muted)]">
              Guarda los datos de contacto del titular y su vehículo principal.
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

          {/* Client Details */}
          <div className="space-y-3">
            <h3>Información del titular</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] text-[var(--muted)] mb-1">
                  Nombre completo / Razón social *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[var(--muted)] mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. 987654321"
                  className="input num"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[var(--muted)] mb-1">
                  DNI / RUC / Documento
                </label>
                <input
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  placeholder="Ej. 45678912"
                  className="input num"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[var(--muted)] mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@correo.com"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="space-y-3 pt-4 border-t border-[var(--rule)]">
            <h3>Vehículo principal (opcional)</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] text-[var(--muted)] mb-1">
                  Placa
                </label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="ABC-123"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[var(--muted)] mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Toyota, Hyundai..."
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
                  placeholder="Yaris, Tucson..."
                  className="input"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[var(--muted)] mb-1">
                  Año
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2019"
                  className="input num"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[var(--muted)] mb-1">
                  Color
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Plata, Gris..."
                  className="input"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[var(--muted)] mb-1">
                  Kilometraje actual
                </label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="75000"
                  className="input num"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[12px] text-[var(--muted)] mb-1">
              Observaciones del titular
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferencias de repuestos, horarios de entrega..."
              className="input"
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
              {saving ? 'Guardando...' : 'Guardar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
