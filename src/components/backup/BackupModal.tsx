'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Upload,
  HardDrive,
  Database,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackupModal({ isOpen, onClose }: BackupModalProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/backup?action=status')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setDbStatus(data);
        }
      })
      .catch((err) => console.error(err));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    window.location.href = '/api/backup';
    toast.success(
      'Copia de seguridad descargada',
      'Guarda este archivo (.db) en un USB o en la nube para mantener tus datos a salvo.'
    );
  };

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) {
      toast.error('Archivo no seleccionado', 'Elige un archivo de respaldo (.db) para restaurar.');
      return;
    }

    if (
      !confirm(
        '¿Estás seguro de restaurar esta copia de seguridad? Se creará un respaldo previo de seguridad antes de aplicar los datos.'
      )
    ) {
      return;
    }

    setRestoring(true);
    try {
      const formData = new FormData();
      formData.append('backupFile', restoreFile);

      const res = await fetch('/api/backup', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Restauración completada', data.message);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        toast.error('Error al restaurar', data.error);
      }
    } catch {
      toast.error('Error de red', 'No se pudo comunicar con el servicio local.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />

      <aside
        data-ui="backup-drawer"
        className="sheet-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Copias de seguridad del taller"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--raised)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <Database className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <span className="font-semibold text-[15px] text-[var(--text)]">
              Copias de seguridad y respaldo local
            </span>
          </div>
          <button onClick={onClose} className="btn px-2" aria-label="Cerrar modal">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[13px]">
          {/* Database Health Card */}
          <section className="p-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="pill ok">Base SQLite activa</span>
              <code className="text-[var(--muted)]">WAL MODE</code>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Ubicación del archivo de datos
              </div>
              <code className="block text-[12px] bg-[var(--raised)] p-2 rounded border border-[var(--border)] break-all select-all text-[var(--text)]">
                {dbStatus?.path || 'Localizando archivo de base de datos...'}
              </code>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[var(--rule)] text-center">
              <div className="p-2 rounded bg-[var(--raised)]">
                <div className="num font-semibold text-[15px] text-[var(--text)]">
                  {dbStatus?.counts?.clients ?? 0}
                </div>
                <div className="text-[11px] text-[var(--muted)]">Clientes</div>
              </div>
              <div className="p-2 rounded bg-[var(--raised)]">
                <div className="num font-semibold text-[15px] text-[var(--text)]">
                  {dbStatus?.counts?.orders ?? 0}
                </div>
                <div className="text-[11px] text-[var(--muted)]">Órdenes</div>
              </div>
              <div className="p-2 rounded bg-[var(--raised)]">
                <div className="num font-semibold text-[15px] text-[var(--text)]">
                  {dbStatus?.counts?.invoices ?? 0}
                </div>
                <div className="text-[11px] text-[var(--muted)]">Comprobantes</div>
              </div>
              <div className="p-2 rounded bg-[var(--raised)]">
                <div className="num font-semibold text-[15px] text-[var(--text)]">
                  {dbStatus?.counts?.inventoryItems ?? 0}
                </div>
                <div className="text-[11px] text-[var(--muted)]">Almacén SKU</div>
              </div>
            </div>
          </section>

          {/* Primary Action: Download 1-Click Backup */}
          <section className="space-y-3">
            <div>
              <h2 className="text-[14px]">1. Descargar copia de seguridad ahora</h2>
              <p className="text-[12px] text-[var(--muted)]">
                Genera un volcado atómico completo de tu taller en un archivo portátil (.db).
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={loading}
              className="btn btn-primary w-full justify-center py-2.5 text-[14px]"
            >
              <Download className="w-4 h-4" />
              <span>Descargar copia de seguridad (.db)</span>
            </button>
          </section>

          {/* Practical Protection Guidelines */}
          <section className="space-y-2 p-3.5 rounded-[var(--r-md)] bg-[var(--raised)] border border-[var(--border)]">
            <div className="text-[12px] font-semibold text-[var(--text)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--positive)]" />
              <span>Recomendaciones para proteger tu taller</span>
            </div>
            <ul className="space-y-1.5 text-[12px] text-[var(--muted)] pl-5 list-disc">
              <li>
                <strong>Memoria USB externa:</strong> Descarga una copia al final de la semana y
                guárdala en un pendrive o disco externo.
              </li>
              <li>
                <strong>Nube personal:</strong> Puedes copiar el archivo descargado a tu Google
                Drive o OneDrive para tener un respaldo fuera del local.
              </li>
              <li>
                <strong>Auto-respaldo en Windows:</strong> Al cerrar la aplicación de escritorio,
                el sistema mantiene respaldos automáticos de los últimos 7 días en tu carpeta de usuario.
              </li>
            </ul>
          </section>

          {/* Restore from Existing Backup */}
          <section className="space-y-3 pt-2 border-t border-[var(--rule)]">
            <div>
              <h2 className="text-[14px]">2. Restaurar una copia previa</h2>
              <p className="text-[12px] text-[var(--muted)]">
                Si formateas la PC o cambias de computadora, selecciona tu archivo de respaldo para recuperar todo.
              </p>
            </div>

            <form onSubmit={handleRestoreSubmit} className="space-y-3">
              <input
                type="file"
                accept=".db,.sqlite,.sqlite3"
                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                className="input-field text-[12px] file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[12px] file:bg-[var(--raised)] file:text-[var(--text)] hover:file:bg-[var(--border)] cursor-pointer"
              />

              <button
                type="submit"
                disabled={!restoreFile || restoring}
                className="btn w-full justify-center py-2 text-[13px]"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {restoring ? 'Restaurando base...' : 'Restaurar base de datos seleccionada'}
                </span>
              </button>
            </form>
          </section>
        </div>
      </aside>
    </>
  );
}
