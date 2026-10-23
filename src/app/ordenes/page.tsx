'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { OrderKanban } from '@/components/orders/OrderKanban';
import { OrderDetailModal } from '@/components/orders/OrderDetailModal';
import { OrderFormModal } from '@/components/orders/OrderFormModal';
import { VoiceAssistantModal } from '@/components/voice/VoiceAssistantModal';
import { Plus, Mic } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

function OrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new' || action === 'new_from_voice') {
      setOrderModalOpen(true);
    }
  }, [searchParams]);

  const totalAmount = orders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
  const activeCount = orders.filter((o) =>
    ['PENDIENTE', 'EN_PROCESO', 'ESPERANDO_REPUESTOS'].includes(o.status)
  ).length;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[var(--rule)]">
        <div className="space-y-1">
          <h1>Órdenes de trabajo</h1>
          <p className="text-[13px] text-[var(--muted)]">
            {loading
              ? 'Consultando registro de órdenes...'
              : `${orders.length} órdenes registradas · ${activeCount} en atención activa · ${formatCurrency(
                  totalAmount
                )} acumulado en servicios.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setVoiceModalOpen(true)} className="btn">
            <Mic className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Dictar por voz</span>
          </button>

          <button
            onClick={() => setOrderModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva orden</span>
          </button>
        </div>
      </div>

      {/* Orders View */}
      {loading ? (
        <div className="panel py-12 text-center text-[var(--muted)]">
          Cargando órdenes de trabajo...
        </div>
      ) : (
        <OrderKanban
          orders={orders}
          onSelectOrder={(order) => setSelectedOrder(order)}
        />
      )}

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={() => {
            fetchOrders();
            setSelectedOrder(null);
          }}
        />
      )}

      <OrderFormModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onOrderSaved={() => {
          fetchOrders();
        }}
      />

      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="panel py-12 text-center text-[var(--muted)]">
          Cargando órdenes...
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
