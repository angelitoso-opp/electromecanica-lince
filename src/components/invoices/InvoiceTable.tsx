'use client';

import React, { useState } from 'react';
import { Search, Share2, Eye, Trash2, FileDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast, ConfirmButton } from '@/components/ui/ToastProvider';
import { printInvoiceDocument } from '@/lib/printReceipt';

interface InvoiceTableProps {
  invoices: any[];
  onOpenNewInvoice: () => void;
  onSelectInvoice: (invoice: any) => void;
  onRefresh?: () => void;
}

export function InvoiceTable({
  invoices,
  onSelectInvoice,
  onRefresh,
}: InvoiceTableProps) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('TODOS');

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !searchQuery ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.clientName.toLowerCase().includes(q) ||
      inv.clientDoc.toLowerCase().includes(q);

    const matchType = selectedType === 'TODOS' || inv.type === selectedType;

    return matchSearch && matchType;
  });

  const activeInvoices = invoices.filter((i) => i.status !== 'ANULADA');
  const totalFacturado = activeInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const totalIgv = activeInvoices.reduce((sum, i) => sum + (i.igv || 0), 0);
  const facturasCount = activeInvoices.filter((i) => i.type === 'FACTURA').length;
  const boletasCount = activeInvoices.filter((i) => i.type === 'BOLETA').length;

  const handleShareWhatsApp = (e: React.MouseEvent, inv: any) => {
    e.stopPropagation();
    let text = `*COMPROBANTE DE PAGO ELECTRONICO*\n`;
    text += `*ELECTROMECANICA LINCE*\n`;
    text += `Jr. Soledad 330, Lince · Tel: (01) 704-3157\n`;
    text += `------------------------------------\n`;
    text += `*${
      inv.type === 'FACTURA' ? 'Factura Electronica' : 'Boleta de Venta'
    }:* ${inv.invoiceNumber}\n`;
    text += `Cliente: *${inv.clientName}*\n`;
    text += `Doc / RUC: ${inv.clientDoc}\n`;
    text += `Fecha: ${formatDate(inv.issueDate || inv.createdAt)}\n`;
    text += `------------------------------------\n`;
    (inv.items || []).forEach((item: any) => {
      text += `- ${item.description} (x${item.quantity}) : ${formatCurrency(
        item.subtotal
      )}\n`;
    });
    text += `------------------------------------\n`;
    if (inv.type === 'FACTURA') {
      text += `OP. GRAVADA: ${formatCurrency(inv.subtotal)}\n`;
      text += `I.G.V. (18%): ${formatCurrency(inv.igv)}\n`;
    }
    text += `*TOTAL A PAGAR:* *${formatCurrency(inv.total)}*\n\n`;
    text += `Gracias por su preferencia.`;

    let phone = (inv.clientPhone || '').replace(/\D/g, '');
    if (phone.length === 9) phone = `51${phone}`;

    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleDeleteInvoice = async (inv: any) => {
    try {
      const res = await fetch(`/api/invoices/${inv.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Comprobante anulado', `Se anuló el comprobante ${inv.invoiceNumber}`);
        if (onRefresh) onRefresh();
      } else {
        toast.error('Error', data.error || 'Error al anular comprobante');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de red', 'No se pudo conectar para anular comprobante');
    }
  };

  return (
    <div className="space-y-4">
      {/* Divided KPI Strip */}
      <div className="kpis">
        <button
          type="button"
          onClick={() => setSelectedType('TODOS')}
          className={`kpi text-left cursor-pointer ${
            selectedType === 'TODOS' ? 'bg-[var(--raised)]' : ''
          }`}
        >
          <span className="kpi-label">Comprobantes emitidos</span>
          <span className="kpi-val">{invoices.length}</span>
          <span className="kpi-delta">
            {facturasCount} facturas · {boletasCount} boletas
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedType('FACTURA')}
          className={`kpi text-left cursor-pointer ${
            selectedType === 'FACTURA' ? 'bg-[var(--raised)]' : ''
          }`}
        >
          <span className="kpi-label">Facturas electrónicas (RUC)</span>
          <span className="kpi-val">{facturasCount}</span>
          <span className="kpi-delta">Con desglose de IGV 18%</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedType('BOLETA')}
          className={`kpi text-left cursor-pointer ${
            selectedType === 'BOLETA' ? 'bg-[var(--raised)]' : ''
          }`}
        >
          <span className="kpi-label">Boletas de venta (DNI)</span>
          <span className="kpi-val">{boletasCount}</span>
          <span className="kpi-delta">Personas naturales</span>
        </button>

        <div className="kpi">
          <span className="kpi-label">Recaudación facturada</span>
          <span className="kpi-val">{formatCurrency(totalFacturado)}</span>
          <span className="kpi-delta">
            IGV incluido: {formatCurrency(totalIgv)}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por serie, razón social o RUC/DNI..."
            className="input pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="select w-auto"
          >
            <option value="TODOS">Todos los tipos ({invoices.length})</option>
            <option value="FACTURA">Facturas ({facturasCount})</option>
            <option value="BOLETA">Boletas ({boletasCount})</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <section className="panel p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Serie y número</th>
                <th>Tipo</th>
                <th>Cliente / Razón social</th>
                <th>Documento</th>
                <th>Fecha</th>
                <th>Medio de pago</th>
                <th className="num">Total</th>
                <th className="num">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => {
                const isFactura = inv.type === 'FACTURA';
                return (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv)}
                    className="cursor-pointer"
                  >
                    <td>
                      <code className="font-medium text-[var(--text)]">
                        {inv.invoiceNumber}
                      </code>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className={`pill ${isFactura ? 'info' : 'ok'}`}>
                          {isFactura ? 'Factura' : 'Boleta'}
                        </span>
                        {inv.status === 'ANULADA' && (
                          <span className="pill danger text-[10px]">ANULADA</span>
                        )}
                      </div>
                    </td>
                    <td className={`font-medium text-[var(--text)] ${inv.status === 'ANULADA' ? 'line-through opacity-60' : ''}`}>
                      {inv.clientName}
                    </td>
                    <td>
                      <code>{inv.clientDoc}</code>
                    </td>
                    <td className="text-[var(--muted)] num">
                      {formatDate(inv.issueDate || inv.createdAt)}
                    </td>
                    <td className="text-[var(--muted)]">{inv.paymentMethod}</td>
                    <td className={`num font-medium text-[var(--text)] ${inv.status === 'ANULADA' ? 'line-through opacity-60' : ''}`}>
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="num" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectInvoice(inv)}
                          className="btn px-2.5 h-7 text-[12px]"
                          title="Ver detalle del comprobante"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            printInvoiceDocument(inv);
                          }}
                          className="btn px-2 h-7 text-[12px]"
                          title="Descargar comprobante en PDF"
                        >
                          <FileDown className="w-3.5 h-3.5 text-[var(--accent)]" />
                          <span className="hidden xl:inline">PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleShareWhatsApp(e, inv)}
                          className="btn px-2.5 h-7 text-[12px]"
                          title="Enviar por WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5 text-[var(--positive)]" />
                        </button>
                        {inv.status !== 'ANULADA' && (
                          <ConfirmButton
                            label=""
                            confirmLabel="¿Anular?"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            onConfirm={() => handleDeleteInvoice(inv)}
                            className="btn btn-danger px-2.5 h-7 text-[12px]"
                            confirmClassName="btn danger px-2.5 h-7 text-[12px]"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[var(--muted)]">
                    No hay comprobantes emitidos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
