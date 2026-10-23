'use client';

import React, { useState } from 'react';
import { Search, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast, ConfirmButton } from '@/components/ui/ToastProvider';

interface InventoryTableProps {
  items: any[];
  categories: string[];
  onOpenNewItem: () => void;
  onEditItem: (item: any) => void;
  onRefresh: () => void;
}

export function InventoryTable({
  items,
  categories,
  onEditItem,
  onRefresh,
}: InventoryTableProps) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      (item.brand || '').toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === 'TODOS' || item.category === selectedCategory;

    const matchesLowStock = !onlyLowStock || item.stock <= item.minStock;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const handleQuickStockChange = async (itemId: string, delta: number) => {
    const current = items.find((i) => i.id === itemId);
    if (!current) return;
    const newStock = Math.max(0, current.stock + delta);

    try {
      await fetch(`/api/inventory/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (itemId: string, name: string) => {
    try {
      const res = await fetch(`/api/inventory/${itemId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Repuesto eliminado', `${name} retirado del inventario`);
        onRefresh();
      } else {
        toast.error('Error', data.error || 'No se pudo eliminar el repuesto');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de red', 'No se pudo conectar para eliminar');
    }
  };

  const lowStockCount = items.filter((i) => i.stock <= i.minStock).length;
  const totalUnits = items.reduce((sum, i) => sum + Number(i.stock || 0), 0);
  const totalSaleValue = items.reduce(
    (sum, i) => sum + Number(i.stock || 0) * Number(i.unitPrice || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Divided KPI Strip */}
      <div className="kpis">
        <button
          type="button"
          onClick={() => setOnlyLowStock(false)}
          className={`kpi text-left cursor-pointer ${
            !onlyLowStock ? 'bg-[var(--raised)]' : ''
          }`}
        >
          <span className="kpi-label">Catálogo total</span>
          <span className="kpi-val">{items.length}</span>
          <span className="kpi-delta">{categories.length} familias de producto</span>
        </button>

        <button
          type="button"
          onClick={() => setOnlyLowStock(true)}
          className={`kpi text-left cursor-pointer ${
            onlyLowStock ? 'bg-[var(--raised)]' : ''
          }`}
        >
          <span className="kpi-label">En punto de pedido</span>
          <span className="kpi-val">{lowStockCount}</span>
          <span className={`kpi-delta ${lowStockCount > 0 ? 'down' : 'up'}`}>
            {lowStockCount > 0
              ? 'Por debajo del stock mínimo'
              : 'Sin quiebres de stock'}
          </span>
        </button>

        <div className="kpi">
          <span className="kpi-label">Existencias físicas</span>
          <span className="kpi-val">{totalUnits}</span>
          <span className="kpi-delta">Unidades disponibles en estantería</span>
        </div>

        <div className="kpi">
          <span className="kpi-label">Valorización a precio venta</span>
          <span className="kpi-val">{formatCurrency(totalSaleValue)}</span>
          <span className="kpi-delta">Potencial comercial en almacén</span>
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
            placeholder="Filtrar por código SKU, descripción o marca..."
            className="input pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="select w-auto"
          >
            <option value="TODOS">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`btn ${onlyLowStock ? 'btn-accent' : ''}`}
          >
            <span>Solo stock bajo ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <section className="panel p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código SKU</th>
                <th>Descripción del repuesto</th>
                <th>Categoría</th>
                <th>Marca</th>
                <th>Estado</th>
                <th className="num">Existencia</th>
                <th className="num">Costo unit.</th>
                <th className="num">Precio venta</th>
                <th className="num">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isLow = item.stock <= item.minStock;

                return (
                  <tr key={item.id}>
                    <td>
                      <code className="font-medium text-[var(--text)]">
                        {item.code}
                      </code>
                    </td>
                    <td>
                      <div className="font-medium text-[var(--text)]">
                        {item.name}
                      </div>
                      {item.location && (
                        <div className="text-[12px] text-[var(--muted)]">
                          Ubicación: {item.location}
                        </div>
                      )}
                    </td>
                    <td className="text-[var(--muted)]">{item.category}</td>
                    <td className="text-[var(--muted)]">
                      {item.brand || 'Genérico'}
                    </td>
                    <td>
                      <span className={`pill ${isLow ? 'err' : 'ok'}`}>
                        {isLow ? `Bajo (mín. ${item.minStock})` : 'Abastecido'}
                      </span>
                    </td>
                    <td className="num">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickStockChange(item.id, -1)}
                          className="btn h-6 w-6 px-0 text-[12px]"
                          title="Descontar 1 unidad"
                        >
                          -
                        </button>
                        <span className="font-medium text-[var(--text)] min-w-[44px] text-center">
                          {item.stock} {item.unit?.slice(0, 3).toLowerCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickStockChange(item.id, 1)}
                          className="btn h-6 w-6 px-0 text-[12px]"
                          title="Ingresar 1 unidad"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="num text-[var(--muted)]">
                      {formatCurrency(item.unitCost)}
                    </td>
                    <td className="num font-medium text-[var(--text)]">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="num">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditItem(item)}
                          className="btn px-2.5 h-7 text-[12px]"
                          title="Editar repuesto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <ConfirmButton
                          label=""
                          confirmLabel="¿Borrar?"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onConfirm={() => handleDeleteItem(item.id, item.name)}
                          className="btn btn-danger px-2.5 h-7 text-[12px]"
                          confirmClassName="btn danger px-2.5 h-7 text-[12px]"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[var(--muted)]">
                    No se encontraron repuestos con el filtro aplicado.
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
