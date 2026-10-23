'use client';

import React, { useState, useEffect } from 'react';
import { X, Car } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { formatPlate } from '@/lib/utils';

interface ClientFormModalProps {
  clientToEdit?: any | null;
  isOpen: boolean;
  onClose: () => void;
  onClientSaved: () => void;
}

export function ClientFormModal({
  clientToEdit,
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

  // Initial car fields (only used when creating a new client)
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

  // Sync fields when clientToEdit changes or modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (clientToEdit) {
      setName(clientToEdit.name || '');
      setPhone(clientToEdit.phone || '');
      setDocument(clientToEdit.document || '');
      setEmail(clientToEdit.email || '');
      setNotes(clientToEdit.notes || '');
      setPlate('');
      setBrand('');
      setModel('');
      setYear('');
      setColor('');
      setMileage('');
    } else {
      setName('');
      setPhone('');
      setDocument('');
      setEmail('');
      setNotes('');
      setPlate('');
      setBrand('');
      setModel('');
      setYear('');
      setColor('');
      setMileage('');
    }
    setErrorMsg('');
  }, [clientToEdit, isOpen]);

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
      if (clientToEdit) {
        // Modo Edición del titular
        const res = await fetch(`/api/clients/${clientToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            document: document.trim() || null,
            email: email.trim() || null,
            notes: notes.trim() || null,
          }),
        });

        const data = await res.json();
        if (data.success) {
          toast.success('Cliente actualizado', `${name} se actualizó correctamente`);
          onClientSaved();
          onClose();
        } else {
          setErrorMsg(data.error || 'Error al actualizar el cliente');
        }
      } else {
        // Modo Creación: nuevo cliente + carro inicial opcional
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            document: document.trim() || null,
            email: email.trim() || null,
            notes: notes.trim() || null,
            vehicle: plate.trim()
              ? {
                  plate: plate.toUpperCase().trim(),
                  brand: brand.trim(),
                  model: model.trim(),
                  year: year ? parseInt(year) : null,
                  color: color.trim() || null,
                  mileage: mileage ? parseInt(mileage) : null,
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
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al procesar el cliente');
    } finally {
      setSaving(false);
    }
  };

  const clientVehicles = clientToEdit?.vehicles || [];

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--raised)]">
          <div>
            <h2>{clientToEdit ? 'Editar datos del cliente' : 'Registrar cliente y carro'}</h2>
            <p className="text-[12px] text-[var(--muted)]">
              {clientToEdit
                ? 'Modifica los datos personales, de contacto y notas del titular.'
                : 'Guarda los datos de contacto del cliente y opcionalmente su primer carro.'}
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

          <div>
            <label className="block text-[12px] text-[var(--muted)] mb-1">
              Observaciones del titular
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferencias de repuestos, horarios de entrega, etc."
              className="input"
            />
          </div>

          {/* Section for Cars */}
          {clientToEdit ? (
            <div className="p-3.5 rounded-[var(--r-md)] bg-[var(--raised)] border border-[var(--border)] space-y-2">
              <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--text)]">
                <Car className="w-4 h-4 text-[var(--accent)]" />
                <span>Carros registrados bajo este titular ({clientVehicles.length})</span>
              </div>
              {clientVehicles.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {clientVehicles.map((v: any) => (
                    <div
                      key={v.id}
                      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--r-md)] border border-[var(--border)] bg-white text-[12px]"
                    >
                      <code className="font-semibold">{formatPlate(v.plate)}</code>
                      <span className="text-[var(--text)]">
                        {v.brand} {v.model}
                      </span>
                      {v.mileage && (
                        <span className="text-[var(--muted)] num">
                          ({v.mileage.toLocaleString()} km)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-[var(--muted)]">
                  Este cliente no tiene carros registrados aún. Puedes agregarle uno usando el botón <strong>+ Carro</strong> en la lista principal.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-4 border-t border-[var(--rule)]">
              <div className="flex items-center justify-between">
                <h3>Primer carro del cliente (opcional)</h3>
                <span className="text-[12px] text-[var(--muted)]">Podrás agregar más carros luego</span>
              </div>

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
                    placeholder="Yaris, Accent..."
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
                    placeholder="2018"
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
                    placeholder="Gris plata"
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
                    placeholder="85000"
                    className="input num"
                  />
                </div>
              </div>
            </div>
          )}

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
                : clientToEdit
                ? 'Guardar cambios'
                : 'Registrar cliente y carro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
