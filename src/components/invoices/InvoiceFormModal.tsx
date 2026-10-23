'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/ToastProvider';

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceSaved: () => void;
}

export function InvoiceFormModal({
  isOpen,
  onClose,
  onInvoiceSaved,
}: InvoiceFormModalProps) {
  const toast = useToast();
  const [type, setType] = useState<'BOLETA' | 'FACTURA'>('BOLETA');
  const [clientName, setClientName] = useState('');
  const [clientDoc, setClientDoc] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [selectedOrderId, setSelectedOrderId] = useState('');

  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<
    { description: string; quantity: number; unitPrice: number }[]
  >([
    {
      description: 'Mantenimiento preventivo general',
      quantity: 1,
      unitPrice: 120,
    },
  ]);

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
    if (!isOpen) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchOrders();
  }, [isOpen]);

  const handleSelectWorkOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    setClientName(order.client?.name || '');
    setClientDoc(order.client?.document || '');
    setClientPhone(order.client?.phone || '');

    const newItems: {
      description: string;
      quantity: number;
      unitPrice: number;
    }[] = [];

    (order.services || []).forEach((s: any) => {
      newItems.push({
        description: s.description,
        quantity: 1,
        unitPrice: s.cost,
      });
    });

    (order.items || []).forEach((i: any) => {
      newItems.push({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      });
    });

    if (newItems.length > 0) {
      setItems(newItems);
    }
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const total = items.reduce(
    (sum, item) =>
      sum + (item.quantity || 1) * (parseFloat(item.unitPrice as any) || 0),
    0
  );
  const subtotal = type === 'FACTURA' ? +(total / 1.18).toFixed(2) : total;
  const igv = type === 'FACTURA' ? +(total - subtotal).toFixed(2) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientDoc.trim()) {
      setErrorMsg('Nombre / Razón Social y Documento / RUC son obligatorios.');
      return;
    }

    if (type === 'FACTURA' && clientDoc.length !== 11) {
      setErrorMsg('El RUC para una Factura debe contener 11 dígitos.');
      return;
    }

    const validItems = items.filter((i) => i.description.trim() !== '');
    if (validItems.length === 0) {
      setErrorMsg('Agrega al menos un concepto o trabajo a facturar.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          clientName,
          clientDoc,
          clientAddress,
          clientPhone,
          workOrderId: selectedOrderId || null,
          items: validItems,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          'Comprobante emitido',
          `${type === 'FACTURA' ? 'Factura' : 'Boleta'} registrada exitosamente`
        );
        onInvoiceSaved();
        onClose();
      } else {
        setErrorMsg(data.error || 'Error al emitir comprobante');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de conexión al emitir comprobante');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-3xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--raised)]">
          <div>
            <h2>Emitir comprobante electrónico</h2>
            <p className="text-[12px] text-[var(--muted)]">
              Generación de Facturas (RUC) y Boletas de Venta (DNI) vinculadas a órdenes.
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

          {/* Type Toggle */}
          <div className="inline-flex rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--raised)] p-1 gap-1">
            <button
              type="button"
              onClick={() => setType('BOLETA')}
              className={`px-3.5 py-1.5 rounded-[6px] text-[12px] font-medium cursor-pointer ${
                type === 'BOLETA'
                  ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]'
                  : 'text-[var(--muted)]'
              }`}
            >
              Boleta de Venta (DNI)
            </button>
            <button
              type="button"
              onClick={() => setType('FACTURA')}
              className={`px-3.5 py-1.5 rounded-[6px] text-[12px] font-medium cursor-pointer ${
                type === 'FACTURA'
                  ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]'
                  : 'text-[var(--muted)]'
              }`}
            >
              Factura Electrónica (RUC)
            </button>
          </div>

          {/* Load from Work Order */}
          <div className="p-4 rounded-[var(--r-md)] border border-[var(--border)] space-y-2">
            <label className="block text-[12px] font-medium text-[var(--text)]">
              Importar conceptos desde una orden de trabajo (opcional)
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => handleSelectWorkOrder(e.target.value)}
              className="select"
            >
              <option value="">Seleccionar orden existente...</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber} · {o.vehicle?.brand} {o.vehicle?.model} (
                  {o.vehicle?.plate}) · {o.client?.name} (
                  {formatCurrency(o.totalAmount)})
                </option>
              ))}
            </select>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                {type === 'FACTURA'
                  ? 'Razón social (empresa) *'
                  : 'Nombre completo del cliente *'}
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder={
                  type === 'FACTURA'
                    ? 'Transportes Los Andes S.A.C.'
                    : 'Juan Pérez'
                }
                className="input"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                {type === 'FACTURA'
                  ? 'RUC (11 dígitos) *'
                  : 'DNI / Documento (8 dígitos) *'}
              </label>
              <input
                type="text"
                required
                value={clientDoc}
                onChange={(e) => setClientDoc(e.target.value)}
                placeholder={type === 'FACTURA' ? '20601234567' : '45678912'}
                className="input num"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Dirección fiscal
              </label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Av. Industrial 123, Lima"
                className="input"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[var(--muted)] mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="987654321"
                className="input num"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="p-4 rounded-[var(--r-md)] border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              <h3>Conceptos a facturar</h3>
              <button type="button" onClick={addItem} className="btn">
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir concepto</span>
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(idx, 'description', e.target.value)
                  }
                  placeholder="Descripción del servicio o repuesto"
                  className="input flex-1"
                />
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(idx, 'quantity', parseInt(e.target.value) || 1)
                  }
                  className="input w-20 text-center num"
                />
                <div className="flex items-center gap-1 w-28">
                  <span className="text-[12px] text-[var(--muted)]">S/</span>
                  <input
                    type="number"
                    step="0.5"
                    value={item.unitPrice || ''}
                    onChange={(e) =>
                      updateItem(
                        idx,
                        'unitPrice',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0.00"
                    className="input text-right num"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="btn px-2 text-[var(--muted)] hover:text-[var(--negative)]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Totals Breakdown */}
          <div className="p-4 rounded-[var(--r-md)] bg-[var(--raised)] border border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label className="text-[12px] font-medium text-[var(--muted)]">
                Medio de pago:
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="select w-auto"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="YAPE_PLIN">Yape / Plin</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="TARJETA">Tarjeta</option>
              </select>
            </div>

            <div className="text-right space-y-0.5 num">
              {type === 'FACTURA' && (
                <>
                  <div className="text-[12px] text-[var(--muted)]">
                    Op. gravada: {formatCurrency(subtotal)}
                  </div>
                  <div className="text-[12px] text-[var(--muted)]">
                    I.G.V. (18%): {formatCurrency(igv)}
                  </div>
                </>
              )}
              <div className="text-[20px] font-semibold text-[var(--text)]">
                Total: {formatCurrency(total)}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving
                ? 'Emitiendo...'
                : `Emitir ${type === 'FACTURA' ? 'Factura' : 'Boleta'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
