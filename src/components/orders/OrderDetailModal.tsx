'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Share2,
  Send,
  Trash2,
  Edit2,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  formatPlate,
  generateWhatsAppQuoteUrl,
} from '@/lib/utils';
import { useToast, ConfirmButton } from '@/components/ui/ToastProvider';

interface OrderDetailModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: () => void;
  onEditOrder?: (order: any) => void;
}

const statusMap: Record<string, { label: string; tone: string }> = {
  PENDIENTE: { label: 'Pendiente', tone: 'warn' },
  EN_PROCESO: { label: 'En bahía', tone: 'info' },
  ESPERANDO_REPUESTOS: { label: 'Esperando repuestos', tone: 'err' },
  LISTO: { label: 'Listo para entrega', tone: 'ok' },
  ENTREGADO: { label: 'Entregado', tone: '' },
};

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onOrderUpdated,
  onEditOrder,
}: OrderDetailModalProps) {
  const toast = useToast();
  const [currentStatus, setCurrentStatus] = useState(
    order?.status || 'PENDIENTE'
  );
  const [isPaid, setIsPaid] = useState(order?.isPaid || false);
  const [paymentMethod, setPaymentMethod] = useState(
    order?.paymentMethod || 'EFECTIVO'
  );
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Sync state when order prop changes
  useEffect(() => {
    if (order) {
      setCurrentStatus(order.status || 'PENDIENTE');
      setIsPaid(order.isPaid || false);
      setPaymentMethod(order.paymentMethod || 'EFECTIVO');
    }
  }, [order]);

  // Escape listener & body scroll lock
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

  if (!isOpen || !order) return null;

  const statusInfo = statusMap[currentStatus] || statusMap.PENDIENTE;

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentStatus(newStatus);
        onOrderUpdated();
        toast.success(`Estado actualizado`, `Orden ${order.orderNumber} pasó a ${statusMap[newStatus]?.label || newStatus}`);
      } else {
        toast.error('Error', data.error || 'No se pudo actualizar el estado');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión', 'No se pudo actualizar el estado de la orden');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePayment = async (paid: boolean, method: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: paid, paymentMethod: method }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPaid(paid);
        setPaymentMethod(method);
        onOrderUpdated();
        toast.success(paid ? 'Cobro conciliado' : 'Estado de cobro pendiente', `Orden ${order.orderNumber} (${method})`);
      } else {
        toast.error('Error', data.error || 'No se pudo actualizar el pago');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión', 'No se pudo registrar el pago');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSavingNote(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: newNote,
          source: 'MANUAL',
          author: 'Mecánico',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewNote('');
        if (!order.progressNotes) order.progressNotes = [];
        order.progressNotes.unshift(data.note);
        onOrderUpdated();
        toast.success('Bitácora actualizada', 'Se añadió el avance técnico');
      } else {
        toast.error('Error', data.error || 'No se pudo registrar la nota');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión', 'No se pudo guardar la nota');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSendWhatsApp = () => {
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

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Orden eliminada', `Orden ${order.orderNumber} eliminada correctamente`);
        onOrderUpdated();
        onClose();
      } else {
        toast.error('Error', data.error || 'No se pudo eliminar la orden');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de red', 'No se pudo conectar para eliminar');
    }
  };

  return (
    <>
      {/* Slide-over Backdrop */}
      <div className="sheet-overlay" onClick={onClose} />

      {/* Slide-over Right Sheet */}
      <aside
        className="sheet-drawer print:static print:w-full print:border-none print:shadow-none"
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de orden ${order.orderNumber}`}
      >
        {/* Sheet Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--raised)] print:hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <code className="text-[15px] font-medium text-[var(--text)]">
              {order.orderNumber}
            </code>
            <span className={`pill ${statusInfo.tone}`}>
              {statusInfo.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onEditOrder && (
              <button
                type="button"
                onClick={() => onEditOrder(order)}
                className="btn"
                title="Editar diagnóstico, servicios y repuestos"
              >
                <Edit2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}
            <button onClick={handleSendWhatsApp} className="btn" title="Compartir por WhatsApp">
              <Share2 className="w-3.5 h-3.5 text-[var(--positive)]" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn px-2.5"
              title="Imprimir orden"
            >
              <Printer className="w-4 h-4" />
            </button>
            <ConfirmButton
              label="Eliminar"
              confirmLabel="¿Borrar?"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onConfirm={handleDeleteOrder}
              className="btn btn-danger px-2 text-[12px]"
            />
            <button onClick={onClose} className="btn px-2.5 ml-1" aria-label="Cerrar panel">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sheet Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Status & Payment Controls */}
          <div className="p-3.5 rounded-[var(--r-md)] bg-[var(--raised)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-[var(--muted)]">
                Etapa:
              </span>
              <select
                value={currentStatus}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                disabled={updating}
                className="select w-auto min-h-[30px] py-1 text-[13px]"
              >
                <option value="PENDIENTE">Pendiente de revisión</option>
                <option value="EN_PROCESO">En reparación (bahía)</option>
                <option value="ESPERANDO_REPUESTOS">Esperando repuestos</option>
                <option value="LISTO">Listo para entrega</option>
                <option value="ENTREGADO">Entregado al cliente</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-[var(--muted)]">
                Cobro:
              </span>
              <button
                type="button"
                onClick={() => handleUpdatePayment(!isPaid, paymentMethod)}
                className={`btn h-[30px] text-[13px] ${
                  isPaid ? 'btn-accent' : ''
                }`}
              >
                {isPaid ? 'Pagado' : 'Marcar pagado'}
              </button>
              {isPaid && (
                <select
                  value={paymentMethod}
                  onChange={(e) => handleUpdatePayment(true, e.target.value)}
                  className="select w-auto min-h-[30px] py-1 text-[13px]"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="YAPE_PLIN">Yape / Plin</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="TARJETA">Tarjeta</option>
                </select>
              )}
            </div>
          </div>

          {/* Client & Vehicle Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
            <div className="p-3.5 rounded-[var(--r-md)] border border-[var(--border)] space-y-1">
              <div className="text-[11px] font-semibold text-[var(--muted)] tracking-wider uppercase">
                Titular / Cliente
              </div>
              <div className="font-semibold text-[14px] text-[var(--text)]">
                {order.client?.name}
              </div>
              <div className="text-[12px] text-[var(--muted)] num">
                Teléfono: {order.client?.phone}
              </div>
              <div className="text-[12px] text-[var(--muted)]">
                Documento: <code>{order.client?.document || 'Sin registro'}</code>
              </div>
            </div>

            <div className="p-3.5 rounded-[var(--r-md)] border border-[var(--border)] space-y-1">
              <div className="text-[11px] font-semibold text-[var(--muted)] tracking-wider uppercase">
                Unidad atendida
              </div>
              <div className="flex items-center gap-2">
                <code className="px-1.5 py-0.5 rounded bg-[var(--raised)] border border-[var(--border)] font-medium text-[12px]">
                  {formatPlate(order.vehicle?.plate || '')}
                </code>
                <span className="font-semibold text-[14px] text-[var(--text)] truncate">
                  {order.vehicle?.brand} {order.vehicle?.model}
                </span>
              </div>
              <div className="text-[12px] text-[var(--muted)] num">
                Kilometraje:{' '}
                {order.mileageAtService
                  ? `${order.mileageAtService.toLocaleString()} km`
                  : 'No registrado'}
              </div>
              <div className="text-[12px] text-[var(--muted)]">
                Responsable: {order.technicianName || 'Timoteo Pariona'}
              </div>
            </div>
          </div>

          {/* Diagnosis & Symptom */}
          <div className="p-3.5 rounded-[var(--r-md)] border border-[var(--border)] space-y-2">
            <div>
              <div className="text-[11px] font-semibold text-[var(--muted)] tracking-wider uppercase">
                Motivo de ingreso
              </div>
              <p className="text-[13px] text-[var(--text)] mt-1">
                {order.issueDescription || order.diagnosis}
              </p>
            </div>
            {order.diagnostic && (
              <div className="pt-2 border-t border-[var(--rule)]">
                <div className="text-[11px] font-semibold text-[var(--muted)] tracking-wider uppercase">
                  Diagnóstico técnico
                </div>
                <p className="text-[13px] text-[var(--text)] mt-1">
                  {order.diagnostic}
                </p>
              </div>
            )}
          </div>

          {/* Services Table */}
          {order.services?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[13px]">Mano de obra y servicios</h3>
              <div className="border border-[var(--border)] rounded-[var(--r-md)] overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Descripción del servicio</th>
                      <th className="num w-28">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.services.map((s: any) => (
                      <tr key={s.id}>
                        <td>{s.description}</td>
                        <td className="num font-medium">
                          {formatCurrency(s.cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Parts Table */}
          {order.items?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[13px]">Repuestos e insumos</h3>
              <div className="border border-[var(--border)] rounded-[var(--r-md)] overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Repuesto</th>
                      <th className="num w-16">Cant.</th>
                      <th className="num w-24">P. Unit.</th>
                      <th className="num w-28">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((i: any) => (
                      <tr key={i.id}>
                        <td>{i.description}</td>
                        <td className="num">{i.quantity}</td>
                        <td className="num text-[var(--muted)]">
                          {formatCurrency(i.unitPrice)}
                        </td>
                        <td className="num font-medium">
                          {formatCurrency(i.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="p-4 rounded-[var(--r-md)] bg-[var(--raised)] border border-[var(--border)] flex items-center justify-between">
            <div className="space-y-0.5 text-[12px] text-[var(--muted)] num">
              <div>Mano de obra: {formatCurrency(order.laborTotal)}</div>
              <div>Repuestos: {formatCurrency(order.partsTotal)}</div>
              {order.discount > 0 && (
                <div className="text-[var(--negative)]">
                  Descuento aplicado: -{formatCurrency(order.discount)}
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[var(--muted)] block uppercase font-medium">
                Total de la orden
              </span>
              <span className="text-[20px] font-semibold num text-[var(--text)]">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Progress Notes */}
          <div className="space-y-3 print:hidden">
            <h3 className="text-[13px]">Bitácora de avances</h3>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Registrar avance técnico en esta orden..."
                className="input flex-1 text-[13px]"
              />
              <button
                type="submit"
                disabled={savingNote || !newNote.trim()}
                className="btn btn-primary text-[13px]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Anotar</span>
              </button>
            </form>

            <div className="space-y-2">
              {order.progressNotes?.length > 0 ? (
                order.progressNotes.map((note: any) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                      <span className="font-medium text-[var(--text)]">
                        {note.author || 'Mecánico'} ·{' '}
                        <span>
                          {note.source === 'VOZ' ? 'Transcripción por voz' : 'Registro manual'}
                        </span>
                      </span>
                      <span className="num">{formatDate(note.createdAt)}</span>
                    </div>
                    <p className="text-[13px] text-[var(--text)]">{note.note}</p>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-[var(--muted)]">
                  Sin notas adicionales en la bitácora de esta orden.
                </p>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
