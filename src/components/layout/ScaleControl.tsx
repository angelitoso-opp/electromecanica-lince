'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Type, Minus, Plus, RotateCcw, X, Check } from 'lucide-react';

const MIN_SCALE = 90;
const MAX_SCALE = 130;
const STEP = 5;
const DEFAULT_SCALE = 100;

const PRESETS = [
  { value: 95, label: 'Compacto' },
  { value: 100, label: 'Normal' },
  { value: 115, label: 'Cómodo' },
  { value: 130, label: 'Taller / Senior' },
];

export function ScaleControl() {
  const [scale, setScale] = useState<number>(DEFAULT_SCALE);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Cargar escala guardada al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('elince_ui_scale');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_SCALE && parsed <= MAX_SCALE) {
          applyScale(parsed);
          setScale(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    applyScale(DEFAULT_SCALE);
  }, []);

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const applyScale = (newScale: number) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
    const factor = (clamped / 100).toFixed(2);
    document.documentElement.style.setProperty('--ui-scale', factor);
    document.documentElement.setAttribute('data-ui-scale', String(clamped));
    try {
      localStorage.setItem('elince_ui_scale', String(clamped));
    } catch {
      // ignore
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setScale(val);
    applyScale(val);
  };

  const handleStep = (delta: number) => {
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));
    setScale(next);
    applyScale(next);
  };

  const handlePreset = (val: number) => {
    setScale(val);
    applyScale(val);
  };

  const handleReset = () => {
    setScale(DEFAULT_SCALE);
    applyScale(DEFAULT_SCALE);
  };

  const getScaleLabel = (val: number) => {
    if (val <= 95) return 'Compacto';
    if (val === 100) return 'Estándar';
    if (val <= 115) return 'Cómodo';
    if (val <= 125) return 'Fácil lectura';
    return 'Máximo / Adulto Mayor';
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Botón trigger en el Navbar */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`btn gap-1.5 px-2.5 transition-colors ${
          isOpen ? 'bg-[var(--active)] border-[var(--control)]' : ''
        }`}
        title="Ajustar tamaño de letra y botones (Accesibilidad para el taller)"
        aria-label="Ajustar tamaño de interfaz"
        aria-expanded={isOpen}
      >
        <Type className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span className="font-semibold num text-[12px]">{scale}%</span>
        {scale > 100 && (
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
        )}
      </button>

      {/* Popover desplegable flotante */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 max-w-[90vw] p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-sheet)] shadow-xl animate-scale-in text-[var(--text)]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--rule)]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[var(--raised)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                <Type className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[13px] font-semibold leading-tight">Tamaño de pantalla</h4>
                <p className="text-[11px] text-[var(--muted)] leading-tight">Accesibilidad y botones grandes</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 rounded-md hover:bg-[var(--raised)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)]"
              aria-label="Cerrar ajustes de tamaño"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Medidor visual con Slider y botones +/- */}
          <div className="my-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[var(--muted)] font-medium">Nivel actual:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--raised)] font-medium text-[var(--muted)]">
                  {getScaleLabel(scale)}
                </span>
                <span className="text-[15px] font-bold num text-[var(--accent)]">
                  {scale}%
                </span>
              </div>
            </div>

            {/* Fila con Botón (-), Slider y Botón (+) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleStep(-STEP)}
                disabled={scale <= MIN_SCALE}
                className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--raised)] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center font-bold text-[var(--text)] transition-transform active:scale-95"
                title="Reducir tamaño (-5%)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="flex-1 relative flex items-center">
                <input
                  type="range"
                  min={MIN_SCALE}
                  max={MAX_SCALE}
                  step={STEP}
                  value={scale}
                  onChange={handleSliderChange}
                  className="w-full accent-[var(--accent)] cursor-pointer h-2 bg-[var(--raised)] rounded-lg appearance-none"
                  aria-label="Control deslizante de tamaño"
                />
              </div>

              <button
                type="button"
                onClick={() => handleStep(STEP)}
                disabled={scale >= MAX_SCALE}
                className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--raised)] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center font-bold text-[var(--text)] transition-transform active:scale-95"
                title="Aumentar tamaño (+5%)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex justify-between text-[10px] text-[var(--muted)] px-1 num">
              <span>{MIN_SCALE}% Min</span>
              <span className={scale === 100 ? 'font-bold text-[var(--text)]' : ''}>100%</span>
              <span>{MAX_SCALE}% Max</span>
            </div>
          </div>

          {/* Botones de acceso rápido (Presets) */}
          <div className="space-y-1.5 pt-2 border-t border-[var(--rule)]">
            <span className="text-[11px] font-medium text-[var(--muted)] block">Accesos rápidos:</span>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => {
                const isActive = scale === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handlePreset(p.value)}
                    className={`py-1.5 px-2 rounded-md text-[12px] font-medium border flex items-center justify-between transition-colors ${
                      isActive
                        ? 'bg-[var(--active)] border-[var(--accent)] text-[var(--text)] font-semibold'
                        : 'border-[var(--border)] hover:bg-[var(--raised)] text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className="num text-[11px] opacity-80">{p.value}%</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vista previa en vivo miniatura */}
          <div className="mt-3.5 p-2.5 rounded-lg bg-[var(--ground)] border border-[var(--border)] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--muted)] font-medium">
              <span>Vista previa en vivo:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="btn btn-primary pointer-events-none py-0">
                Guardar orden
              </span>
              <span className="pill ok pointer-events-none">
                En bahía
              </span>
            </div>
          </div>

          {/* Footer con botón de restablecer */}
          <div className="mt-3 pt-2.5 border-t border-[var(--rule)] flex items-center justify-between text-[11px]">
            <span className="text-[var(--muted)] text-[11px]">Guardado automático</span>
            <button
              type="button"
              onClick={handleReset}
              disabled={scale === DEFAULT_SCALE}
              className="text-[var(--accent)] hover:underline flex items-center gap-1 disabled:opacity-40 disabled:no-underline font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer 100%</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
