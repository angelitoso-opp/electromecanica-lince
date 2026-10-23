'use client';

import React, { useEffect } from 'react';
import { X, Printer, Share2, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { printInvoiceDocument } from '@/lib/printReceipt';
import { useToast, ConfirmButton } from '@/components/ui/ToastProvider';

interface InvoicePrintModalProps {
  invoice: any;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

export function InvoicePrintModal({
  invoice,
  isOpen,
  onClose,
  onDelete,
}: InvoicePrintModalProps) {
  const toast = useToast();

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

  if (!isOpen || !invoice) return null;

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Comprobante eliminado', `Se eliminó el comprobante ${invoice.invoiceNumber}`);
        if (onDelete) onDelete();
        onClose();
      } else {
        toast.error('Error', data.error || 'Error al eliminar comprobante');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión', 'No se pudo conectar para eliminar');
    }
  };

  const handlePrint = () => {
    printInvoiceDocument(invoice);
  };

  const handleSendWhatsApp = () => {
    let text = `*COMPROBANTE DE PAGO ELECTRONICO*\n`;
    text += `*ELECTROMECANICA LINCE*\n`;
    text += `Jr. Soledad 330, Lince · Tel: (01) 704-3157\n`;
    text += `------------------------------------\n`;
    text += `*${
      invoice.type === 'FACTURA' ? 'Factura Electronica' : 'Boleta de Venta'
    }:* ${invoice.invoiceNumber}\n`;
    text += `Cliente: *${invoice.clientName}*\n`;
    text += `Doc / RUC: ${invoice.clientDoc}\n`;
    text += `Fecha: ${formatDate(invoice.issueDate || invoice.createdAt)}\n`;
    text += `------------------------------------\n`;
    (invoice.items || []).forEach((item: any) => {
      text += `- ${item.description} (x${item.quantity}) : ${formatCurrency(
        item.subtotal
      )}\n`;
    });
    text += `------------------------------------\n`;
    if (invoice.type === 'FACTURA') {
      text += `OP. GRAVADA: ${formatCurrency(invoice.subtotal)}\n`;
      text += `I.G.V. (18%): ${formatCurrency(invoice.igv)}\n`;
    }
    text += `*TOTAL: ${formatCurrency(invoice.total)}*\n\n`;
    text += `Gracias por su preferencia.`;

    let phone = (invoice.clientPhone || '').replace(/\D/g, '');
    if (phone.length === 9) phone = `51${phone}`;

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
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
        aria-label={`Comprobante ${invoice.invoiceNumber}`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--raised)] print:hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            <code className="text-[15px] font-medium text-[var(--text)]">
              {invoice.invoiceNumber}
            </code>
            <span
              className={`pill ${
                invoice.type === 'FACTURA' ? 'info' : 'ok'
              }`}
            >
              {invoice.type === 'FACTURA' ? 'Factura' : 'Boleta'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={handleSendWhatsApp} className="btn" title="Enviar por WhatsApp">
              <Share2 className="w-3.5 h-3.5 text-[var(--positive)]" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn px-2.5"
              title="Imprimir comprobante"
            >
              <Printer className="w-4 h-4" />
            </button>
            <ConfirmButton
              label="Eliminar"
              confirmLabel="¿Borrar?"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onConfirm={handleDelete}
              className="btn btn-danger px-2 text-[12px]"
            />
            <button onClick={onClose} className="btn px-2.5 ml-1" aria-label="Cerrar panel">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-[var(--border)] pb-4 gap-4">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--text)]">Electromecánica Lince</h2>
              <p className="text-[12px] text-[var(--muted)]">
                Diagnóstico Computarizado & Electromecánica Automotriz Integral
              </p>
              <p className="text-[12px] text-[var(--muted)]">
                Jr. Soledad 330, Lince, Lima · Tel: (01) 704-3157
              </p>
            </div>

            <div className="p-3 rounded-[var(--r-md)] bg-[var(--raised)] border border-[var(--border)] text-center min-w-[200px]">
              <div className="text-[11px] font-semibold text-[var(--muted)] uppercase">
                R.U.C. <code>20601234567</code>
              </div>
              <div className="font-semibold text-[13px] text-[var(--text)] mt-0.5">
                {invoice.type === 'FACTURA'
                  ? 'Factura Electrónica'
                  : 'Boleta de Venta'}
              </div>
              <code className="text-[13px] font-medium text-[var(--text)] block mt-1">
                {invoice.invoiceNumber}
              </code>
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-[var(--r-md)] border border-[var(--border)]">
            <div>
              <span className="text-[11px] font-semibold text-[var(--muted)] block uppercase">
                {invoice.type === 'FACTURA' ? 'Razón social' : 'Titular'}
              </span>
              <span className="font-semibold text-[14px] text-[var(--text)]">
                {invoice.clientName}
              </span>
              {invoice.clientAddress && (
                <span className="text-[12px] text-[var(--muted)] block mt-0.5">
                  {invoice.clientAddress}
                </span>
              )}
            </div>

            <div className="space-y-1 text-[12px]">
              <div>
                <span className="text-[var(--muted)]">
                  {invoice.type === 'FACTURA' ? 'RUC:' : 'DNI:'}
                </span>{' '}
                <code className="font-medium text-[var(--text)]">
                  {invoice.clientDoc}
                </code>
              </div>
              <div>
                <span className="text-[var(--muted)]">Fecha de emisión:</span>{' '}
                <span className="num text-[var(--text)]">
                  {formatDate(invoice.issueDate || invoice.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-[var(--muted)]">Medio de pago:</span>{' '}
                <span className="text-[var(--text)]">
                  {invoice.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Table Items */}
          <div className="rounded-[var(--r-md)] border border-[var(--border)] overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="num w-16">Cant.</th>
                  <th>Descripción / Concepto</th>
                  <th className="num w-28">P. Unitario</th>
                  <th className="num w-28">Importe</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item: any) => (
                  <tr key={item.id}>
                    <td className="num">{item.quantity}</td>
                    <td>{item.description}</td>
                    <td className="num text-[var(--muted)]">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="num font-medium">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Total */}
          <div className="flex justify-end pt-1">
            <div className="w-64 space-y-1.5 p-3.5 rounded-[var(--r-md)] bg-[var(--raised)] border border-[var(--border)] num">
              {invoice.type === 'FACTURA' && (
                <>
                  <div className="flex justify-between text-[12px] text-[var(--muted)]">
                    <span>Op. gravada:</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[12px] text-[var(--muted)]">
                    <span>I.G.V. (18%):</span>
                    <span>{formatCurrency(invoice.igv)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-1.5 border-t border-[var(--border)] text-[14px] font-semibold text-[var(--text)]">
                <span>Importe total:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
