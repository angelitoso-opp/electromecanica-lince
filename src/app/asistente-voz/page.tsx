'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, ArrowRight } from 'lucide-react';
import { formatCurrency, formatPlate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';

export default function VoiceAssistantPage() {
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

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.info(
        'Dictado no soportado',
        'Tu navegador no soporta reconocimiento de voz nativo. Puedes escribir o seleccionar una plantilla de dictado.'
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
      setErrorMsg('Por favor dicta o escribe el reporte técnico primero.');
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
      setErrorMsg('Error al comunicarse con el motor de análisis.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyToNewOrder = () => {
    if (!parsedResult) return;
    sessionStorage.setItem('voice_prefill_order', JSON.stringify(parsedResult));
    router.push('/ordenes?action=new_from_voice');
  };

  const sampleVoiceInputs = [
    'Al Toyota Yaris placa ABC-123 le cambiamos pastillas de freno delanteras, 4 cuartos de aceite Castrol y filtro de aceite, mano de obra 50 soles.',
    'Vino María Fernández con su Nissan Sentra placa B4M-230 marcando 82 mil km para afinamiento y cambio de cuatro bujías NGK, cobramos 70 soles de mano de obra.',
    'Al vehículo placa PER-456 con 95000 km le realizamos alineación y balanceo, cambio de faja y purgado de líquido de frenos Bosch, mano de obra 90 soles.',
    'Atendimos a Don Carlos Mendoza, le pusimos dos galones de aceite Castrol 20W-50 y rectificación de discos de freno, total de servicio 80 soles.',
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[var(--rule)]">
        <div className="space-y-1">
          <h1>Dictado por voz y extracción técnica</h1>
          <p className="text-[13px] text-[var(--muted)]">
            Captura manos libres para mecánicos en bahía: identifica placa, kilometraje, mano de obra y descuenta repuestos del almacén.
          </p>
        </div>

        <span className={`pill ${isListening ? 'err' : 'ok'}`}>
          {isListening ? 'Grabando micrófono' : 'Motor de voz listo'}
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Capture Console */}
        <section className="panel lg:col-span-7 space-y-4">
          <div className="panel-head">
            <div>
              <h2>Consola de captura de audio</h2>
              <p className="text-[13px] text-[var(--muted)] mt-0.5">
                Dicta mencionando la placa de la unidad, trabajos efectuados e insumos empleados.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleListening}
              className={`btn ${isListening ? 'btn-danger' : 'btn-primary'}`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Detener dictado</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Iniciar micrófono</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <label className="font-medium text-[var(--text)]">
                Transcripción del reporte técnico
              </label>
              {transcript && (
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('');
                    setParsedResult(null);
                  }}
                  className="text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                >
                  Limpiar texto
                </button>
              )}
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Habla frente al micrófono o redacta el avance técnico aquí..."
              rows={4}
              className="textarea resize-none text-[13px]"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => handleProcessVoice()}
              disabled={isProcessing || !transcript.trim()}
              className="btn btn-accent"
            >
              {isProcessing
                ? 'Cotejando con padrón y almacén...'
                : 'Procesar y estructurar reporte'}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-[var(--r-md)] bg-[#fdecec] border border-[#f1cfd1] text-[var(--negative)] text-[13px]">
              {errorMsg}
            </div>
          )}

          {/* Quick Sample Dictations */}
          <div className="pt-3 border-t border-[var(--rule)] space-y-2">
            <span className="text-[13px] font-medium text-[var(--muted)] block">
              Plantillas de prueba para simulación rápida:
            </span>
            <div className="space-y-2">
              {sampleVoiceInputs.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTranscript(sample);
                    handleProcessVoice(sample);
                  }}
                  className="w-full p-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--raised)] hover:bg-[var(--active)] text-left text-[13px] text-[var(--text)] cursor-pointer block"
                >
                  «{sample}»
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right: Structured Extraction Output */}
        <section className="panel lg:col-span-5 space-y-4">
          <div className="panel-head">
            <div>
              <h2>Ficha estructurada extraída</h2>
              <p className="text-[13px] text-[var(--muted)] mt-0.5">
                Previsualización antes de generar la orden de trabajo.
              </p>
            </div>
            {parsedResult && <span className="pill ok">Cotejado</span>}
          </div>

          {parsedResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--raised)]">
                  <span className="text-[11px] font-semibold text-[var(--muted)] block uppercase">
                    Placa identificada
                  </span>
                  <code className="text-[15px] font-medium text-[var(--text)]">
                    {parsedResult.plate
                      ? formatPlate(parsedResult.plate)
                      : 'Sin placa'}
                  </code>
                  {parsedResult.matchedVehicle && (
                    <span className="text-[12px] text-[var(--positive)] block mt-0.5">
                      {parsedResult.matchedVehicle.brand}{' '}
                      {parsedResult.matchedVehicle.model}
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--raised)]">
                  <span className="text-[11px] font-semibold text-[var(--muted)] block uppercase">
                    Kilometraje
                  </span>
                  <span className="text-[15px] font-semibold num text-[var(--text)]">
                    {parsedResult.mileage
                      ? `${parsedResult.mileage.toLocaleString()} km`
                      : 'No indicado'}
                  </span>
                </div>
              </div>

              {parsedResult.suggestedServices?.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-[13px]">Mano de obra detectada</h3>
                  <div className="border border-[var(--border)] rounded-[var(--r-md)] overflow-hidden">
                    <table className="data-table">
                      <tbody>
                        {parsedResult.suggestedServices.map(
                          (s: any, idx: number) => (
                            <tr key={idx}>
                              <td>{s.description}</td>
                              <td className="num font-medium">
                                {formatCurrency(s.cost)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {parsedResult.suggestedItems?.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-[13px]">Repuestos vinculados en almacén</h3>
                  <div className="border border-[var(--border)] rounded-[var(--r-md)] overflow-hidden">
                    <table className="data-table">
                      <tbody>
                        {parsedResult.suggestedItems.map(
                          (item: any, idx: number) => (
                            <tr key={idx}>
                              <td>
                                {item.description} (x{item.quantity})
                              </td>
                              <td className="num font-medium">
                                {formatCurrency(item.subtotal)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleApplyToNewOrder}
                className="btn btn-primary w-full"
              >
                <span>Abrir orden de trabajo con estos datos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--raised)] text-[13px] text-[var(--muted)] space-y-2">
              <p className="font-medium text-[var(--text)]">
                Esperando transcripción de voz o selección de plantilla
              </p>
              <p>
                Al procesar un dictado, el sistema cruza la placa contra el padrón de vehículos y busca coincidencias exactas en el inventario de repuestos.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
