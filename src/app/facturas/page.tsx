'use client';

import React, { useState, useEffect } from 'react';
import { InvoiceTable } from '@/components/invoices/InvoiceTable';
import { InvoiceFormModal } from '@/components/invoices/InvoiceFormModal';
import { InvoicePrintModal } from '@/components/invoices/InvoicePrintModal';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const totalBilled = invoices.reduce((sum, i) => sum + Number(i.total || 0), 0);
  const totalIgv = invoices.reduce((sum, i) => sum + Number(i.igv || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[var(--rule)]">
        <div className="space-y-1">
          <h1>Comprobantes y cobros</h1>
          <p className="text-[13px] text-[var(--muted)]">
            {loading
              ? 'Cargando registro de comprobantes emitidos...'
              : `${invoices.length} comprobantes emitidos · ${formatCurrency(
                  totalBilled
                )} facturado total · ${formatCurrency(
                  totalIgv
                )} de IGV (18%) acumulado.`}
          </p>
        </div>

        <button
          onClick={() => setFormModalOpen(true)}
          className="btn btn-primary"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Emitir comprobante</span>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="panel py-12 text-center text-[var(--muted)]">
          Cargando comprobantes emitidos...
        </div>
      ) : (
        <InvoiceTable
          invoices={invoices}
          onOpenNewInvoice={() => setFormModalOpen(true)}
          onSelectInvoice={(inv) => setSelectedInvoice(inv)}
          onRefresh={fetchInvoices}
        />
      )}

      {/* Modals */}
      <InvoiceFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onInvoiceSaved={fetchInvoices}
      />

      <InvoicePrintModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onDelete={fetchInvoices}
      />
    </div>
  );
}
