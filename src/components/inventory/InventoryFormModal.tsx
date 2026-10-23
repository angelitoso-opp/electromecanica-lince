'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useToast, ConfirmButton } from '@/components/ui/ToastProvider';

interface InventoryFormModalProps {
  itemToEdit?: any;
  isOpen: boolean;
  onClose: () => void;
  onItemSaved: () => void;
}

const CATEGORIES = [
  'Lubricantes',
  'Filtros',
  'Frenos',
  'Suspensión',
  'Motor',
  'Eléctrico',
  'Transmisión',
  'Refrigeración',
  'Varios',
];

const UNITS = ['UNIDAD', 'GALON', 'LITRO', 'JUEGO', 'PAR', 'METRO'];

export function InventoryFormModal({
  itemToEdit,
  isOpen,
  onClose,
  onItemSaved,
}: InventoryFormModalProps) {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Lubricantes');
  const [brand, setBrand] = useState('');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('3');
  const [unit, setUnit] = useState('UNIDAD');
  const [unitCost, setUnitCost] = useState('0');
  const [unitPrice, setUnitPrice] = useState('0');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

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

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (itemToEdit) {
      setCode(itemToEdit.code || '');
      setName(itemToEdit.name || '');
      setCategory(itemToEdit.category || 'Lubricantes');
      setBrand(itemToEdit.brand || '');
      setStock(itemToEdit.stock?.toString() || '0');
      setMinStock(itemToEdit.minStock?.toString() || '3');
      setUnit(itemToEdit.unit || 'UNIDAD');
      setUnitCost(itemToEdit.unitCost?.toString() || '0');
      setUnitPrice(itemToEdit.unitPrice?.toString() || '0');
      setLocation(itemToEdit.location || '');
      setNotes(itemToEdit.notes || '');
    } else {
      setCode(`REP-${Date.now().toString().slice(-6)}`);
      setName('');
      setCategory('Lubricantes');
      setBrand('');
      setStock('0');
      setMinStock('3');
      setUnit('UNIDAD');
      setUnitCost('0');
      setUnitPrice('0');
      setLocation('');
      setNotes('');
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category) {
      setErrorMsg('Nombre y categoría son obligatorios.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const url = itemToEdit
        ? `/api/inventory/${itemToEdit.id}`
        : '/api/inventory';
      const method = itemToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          name,
          category,
          brand,
          stock: parseInt(stock) || 0,
          minStock: parseInt(minStock) || 3,
          unit,
          unitCost: parseFloat(unitCost) || 0,
          unitPrice: parseFloat(unitPrice) || 0,
          location,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          itemToEdit ? 'Repuesto actualizado' : 'Repuesto registrado',
          `${name} guardado en inventario`
        );
        onItemSaved();
        onClose();
      } else {
        setErrorMsg(data.error || 'Error al guardar repuesto');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToEdit) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/inventory/${itemToEdit.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Repuesto eliminado', `${name} retirado del inventario`);
        onItemSaved();
        onClose();
      } else {
        setErrorMsg(data.error || 'Error al eliminar repuesto');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de conexión al eliminar');
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
            <h2>
              {itemToEdit ? 'Editar repuesto de almacén' : 'Registrar nuevo repuesto'}
            </h2>
            <p className="text-[12px] text-[var(--muted)]">
              Control de código SKU, existencias mínimas, costos y precio de venta.
            </p>
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
                Código SKU *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej. FIL-ACE-01"
                className="input"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Categoría *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[12px] text-[var(--muted)] mb-1">
              Descripción del repuesto / insumo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Aceite Sintético 10W-30 (Galón)"
              className="input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Marca / Fabricante
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Bosch, Castrol..."
                className="input"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Unidad de medida
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="select"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Ubicación física
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Estante A-2"
                className="input"
              />
            </div>
          </div>

          <div className="p-4 rounded-[var(--r-md)] bg-[var(--raised)] border border-[var(--border)] grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Stock actual
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="input text-center num"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Stock mínimo
              </label>
              <input
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="input text-center num"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Costo compra (S/)
              </label>
              <input
                type="number"
                step="0.5"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="input text-right num"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--text)] font-medium mb-1">
                Precio venta (S/)
              </label>
              <input
                type="number"
                step="0.5"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="input text-right num"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between gap-2 border-t border-[var(--rule)]">
            {itemToEdit ? (
              <ConfirmButton
                label="Eliminar repuesto"
                confirmLabel="¿Confirmar eliminación?"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onConfirm={handleDelete}
                className="btn btn-danger"
              />
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="btn">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Guardando...' : 'Guardar repuesto'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
