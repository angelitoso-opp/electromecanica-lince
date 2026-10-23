'use client';

import React, { useState, useEffect } from 'react';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { InventoryFormModal } from '@/components/inventory/InventoryFormModal';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setCategories(data.categories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const lowStockCount = items.filter((i) => i.stock <= i.minStock).length;
  const totalValuation = items.reduce(
    (sum, i) => sum + Number(i.stock || 0) * Number(i.unitCost || i.buyPrice || 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[var(--rule)]">
        <div className="space-y-1">
          <h1>Almacén y stock</h1>
          <p className="text-[13px] text-[var(--muted)]">
            {loading
              ? 'Cargando catálogo de repuestos e insumos...'
              : `${items.length} SKU registrados · ${lowStockCount} en punto de reposición · ${formatCurrency(
                  totalValuation
                )} valorizados a costo.`}
          </p>
        </div>

        <button
          onClick={() => {
            setItemToEdit(null);
            setModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo repuesto</span>
        </button>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="panel py-12 text-center text-[var(--muted)]">
          Cargando inventario de repuestos...
        </div>
      ) : (
        <InventoryTable
          items={items}
          categories={categories}
          onOpenNewItem={() => {
            setItemToEdit(null);
            setModalOpen(true);
          }}
          onEditItem={(item) => {
            setItemToEdit(item);
            setModalOpen(true);
          }}
          onRefresh={fetchInventory}
        />
      )}

      {/* Form Modal */}
      <InventoryFormModal
        itemToEdit={itemToEdit}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setItemToEdit(null);
        }}
        onItemSaved={fetchInventory}
      />
    </div>
  );
}
