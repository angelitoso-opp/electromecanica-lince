'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, ArrowRight } from 'lucide-react';
import { formatCurrency, formatPlate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: () => void;
}

export function VoiceAssistantModal({
  isOpen,
  onClose,
}: VoiceAssistantModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-PE';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

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

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.info(
        'Dictado no soportado',
        'Tu navegador no soporta reconocimiento de voz nativo. Puedes escribir el texto en el área inferior.'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setParsedResult(null);
      setErrorMsg('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleProcessVoice = async (textToProcess?: string) => {
    const text = textToProcess || transcript;
    if (!text.trim()) {
      setErrorMsg('Por favor dicta o escribe un mensaje primero.');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/ai/parse-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });
      const data = await res.json();

      if (data.success) {
        setParsedResult(data.parsed);
      } else {
        setErrorMsg(data.error || 'No se pudo interpretar el audio.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al comunicarse con el asistente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyToNewOrder = () => {
    if (!parsedResult) return;
    sessionStorage.setItem('voice_prefill_order', JSON.stringify(parsedResult));
    onClose();
    router.push('/ordenes?action=new_from_voice');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--raised)]">
          <div>
            <div className="flex items-center gap-2">
              <h2>Dictado técnico por voz</h2>
              <span className={`pill ${isListening ? 'err' : 'info'}`}>
                {isListening ? 'Grabando' : 'IA Taller'}
              </span>
            </div>
            <p className="text-[12px] text-[var(--muted)] mt-0.5">
              Dicta avances, placas o repuestos utilizados sin usar el teclado.
            </p>
          </div>
          <button onClick={onClose} className="btn px-2.5" aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="p-4 rounded-[var(--r-md)] bg-[var(--raised)] border border-[var(--border)] flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="font-medium text-[var(--text)]">
                {isListening
                  ? 'Escuchando reporte del mecánico...'
                  : 'Pulsa el botón para iniciar la captura de voz'}
              </div>
              <p className="text-[12px] text-[var(--muted)]">
                Ejemplo: «Al Toyota placa ABC-123 se le cambió pastillas de freno y 4 cuartos de aceite, mano de obra 50 soles.»
              </p>
            </div>
            <button
              type="button"
              onClick={toggleListening}
              className={`btn shrink-0 ${
                isListening ? 'btn-danger' : 'btn-primary'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Detener</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Dictar ahora</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <label className="font-medium text-[var(--text)]">
                Texto dictado o redactado
              </label>
              {transcript && (
                <button
                  type="button"
                  onClick={() => setTranscript('')}
                  className="text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Habla con el micrófono o escribe aquí los trabajos realizados..."
              rows={3}
              className="textarea resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleProcessVoice()}
              disabled={isProcessing || !transcript.trim()}
              className="btn btn-accent"
            >
              {isProcessing
                ? 'Analizando reporte...'
                : 'Interpretar y extraer datos'}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-[var(--r-md)] bg-[#fdecec] border border-[#f1cfd1] text-[var(--negative)] text-[12px]">
              {errorMsg}
            </div>
          )}

          {parsedResult && (
            <div className="p-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface)] space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--rule)] pb-2">
                <h3>Datos extraídos automáticamente</h3>
                <span className="pill ok">Listo</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-[var(--r-md)] bg-[var(--raised)] border border-[var(--border)]">
                  <span className="text-[12px] text-[var(--muted)] block">
                    Vehículo / Placa
                  </span>
                  <code className="font-medium text-[14px] text-[var(--text)]">
                    {parsedResult.plate
                      ? formatPlate(parsedResult.plate)
                      : 'No detectada'}
                  </code>
                  {parsedResult.matchedVehicle && (
                    <p className="text-[12px] text-[var(--positive)] mt-0.5">
                      Registrado: {parsedResult.matchedVehicle.brand}{' '}
                      {parsedResult.matchedVehicle.model} (
                      {parsedResult.matchedClient?.name})
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-[var(--r-md)] bg-[var(--raised)] border border-[var(--border)]">
                  <span className="text-[12px] text-[var(--muted)] block">
                    Kilometraje detectado
                  </span>
                  <span className="font-semibold text-[14px] num text-[var(--text)]">
                    {parsedResult.mileage
                      ? `${parsedResult.mileage.toLocaleString()} km`
                      : 'No especificado'}
                  </span>
                </div>
              </div>

              {parsedResult.suggestedServices?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[12px] font-medium text-[var(--muted)] block">
                    Mano de obra:
                  </span>
                  {parsedResult.suggestedServices.map((s: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded bg-[var(--raised)] text-[12px]"
                    >
                      <span>{s.description}</span>
                      <span className="num font-medium">
                        {formatCurrency(s.cost)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {parsedResult.suggestedItems?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[12px] font-medium text-[var(--muted)] block">
                    Repuestos reconocidos:
                  </span>
                  {parsedResult.suggestedItems.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded bg-[var(--raised)] text-[12px]"
                    >
                      <span>
                        {item.description} (x{item.quantity})
                      </span>
                      <span className="num font-medium">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleApplyToNewOrder}
                className="btn btn-primary w-full"
              >
                <span>Crear orden con estos datos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
