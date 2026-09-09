import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Bot, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  TrendingDown, 
  Info 
} from 'lucide-react';
import { CreditCard, CheckingAccount, ExchangeRates } from '../types';
import { generateAiPromptDocument, downloadAiPromptFile } from '../utils/aiPromptGenerator';
import { calculateSummary, getZeroAprStatus, formatMoney, DEFAULT_EXCHANGE_RATES } from '../utils/calculations';

interface AiStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CreditCard[];
  checkingAccounts: CheckingAccount[];
  baseCurrency?: string;
  exchangeRates?: ExchangeRates;
}

export const AiStrategyModal: React.FC<AiStrategyModalProps> = ({
  isOpen,
  onClose,
  cards,
  checkingAccounts,
  baseCurrency = 'USD',
  exchangeRates = DEFAULT_EXCHANGE_RATES,
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'live'>('prompt');
  const [strategy, setStrategy] = useState('Salvar 0% APR + Minimizar Intereses (Recomendada)');
  const [userNotes, setUserNotes] = useState('');
  const [copied, setCopied] = useState(false);

  // Live AI state
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!isOpen) return null;

  const generatedPrompt = generateAiPromptDocument(cards, checkingAccounts, userNotes, baseCurrency, exchangeRates);
  const summary = calculateSummary(cards, checkingAccounts, baseCurrency, exchangeRates);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRunLiveAi = async () => {
    setIsLoadingAi(true);
    setAiError(null);
    setAiAnalysis(null);

    try {
      const res = await fetch('/api/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cards,
          checkingAccounts,
          strategy,
          userNotes,
          baseCurrency,
          exchangeRates,
        }),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
      } else if (data.error === 'NO_API_KEY') {
        setAiError(
          'Para análisis con Gemini en tiempo real dentro de la app, configura tu GEMINI_API_KEY en los secretos. Mientras tanto, puedes descargar o copiar el archivo de instrucciones para usarlo en ChatGPT, Claude o Gemini.'
        );
        setAiAnalysis(generateLocalSmartAdvice(cards, checkingAccounts));
      } else {
        setAiError(data.message || 'No se pudo generar la recomendación.');
      }
    } catch (err: any) {
      setAiError('Error de red al consultar el servidor. Puedes descargar el archivo de instrucciones.');
      setAiAnalysis(generateLocalSmartAdvice(cards, checkingAccounts));
    } finally {
      setIsLoadingAi(false);
    }
  };

  function generateLocalSmartAdvice(cList: CreditCard[], aList: CheckingAccount[]): string {
    const sorted0Apr = [...cList]
      .filter(c => c.zeroAprEndDate && c.currentBalance > 0)
      .sort((a, b) => new Date(a.zeroAprEndDate!).getTime() - new Date(b.zeroAprEndDate!).getTime());

    const sortedByApr = [...cList]
      .filter(c => c.currentBalance > 0)
      .sort((a, b) => (b.aprRate || 0) - (a.aprRate || 0));

    return `### 💡 Plan de Acción Sugerido (Generado Localmente)

1. **Prioridad Absoluta: Pagos Mínimos**
   - Asegúrate de cubrir los pagos mínimos de todas las tarjetas antes de sus fechas límite para evitar penalizaciones y daño a tu historial crediticio. Total necesario consolidado: ${formatMoney(summary.totalMinPayment, baseCurrency)}.

2. **Protección contra vencimiento de 0% APR (México y USA):**
${sorted0Apr.length > 0 ? sorted0Apr.map(c => {
  const status = getZeroAprStatus(c);
  return `   - **${c.name} (${c.country}):** Vence ${c.zeroAprEndDate} (${status.statusText}). Cuota mensual recomendada: ${formatMoney(status.monthlyPaymentNeededToClear, c.currency)}/mes para liquidar el saldo de ${formatMoney(c.currentBalance, c.currency)}.`;
}).join('\n') : '   - No tienes tarjetas con 0% APR en riesgo próximo.'}

3. **Estrategia para el Excedente (Método Avalancha):**
   - Tarjeta con mayor costo financiero: **${sortedByApr[0]?.name || 'N/A'}** (${sortedByApr[0]?.aprRate || 0}% APR). Todo dinero sobrante de tu cuenta corriente después de cubrir los mínimos debe abonarse aquí en su moneda correspondiente.

4. **Estado de Liquidez:**
   - Saldo disponible total en cuentas: ${formatMoney(summary.totalCheckingBalance, baseCurrency)}.
   - ${summary.netCoverage >= 0 ? `Tienes un superávit de +${formatMoney(summary.netCoverage, baseCurrency)} suficiente para cubrir todos los pagos de no interés este mes.` : `Presentas un déficit temporal de -${formatMoney(Math.abs(summary.netCoverage), baseCurrency)} respecto a pagar el 100% de no interés. Cubre los mínimos y enfócate en las tarjetas de 0% APR por vencer.`}`;
  }

  return (
    <div id="ai-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="ai-modal-container"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Asesor de Pagos Eficientes con IA
              </h2>
              <p className="text-xs text-slate-500">
                Genera el archivo con directrices expertas y consulta recomendaciones estratégicas
              </p>
            </div>
          </div>
          <button
            id="close-ai-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/40 px-6 pt-2">
          <button
            id="tab-ai-file-btn"
            type="button"
            onClick={() => setActiveTab('prompt')}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'prompt'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" /> Archivo de Instrucciones y Datos para IA
          </button>
          <button
            id="tab-ai-live-btn"
            type="button"
            onClick={() => setActiveTab('live')}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'live'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" /> Consultar Asesor con IA en Vivo
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Quick config options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label htmlFor="ai-strategy-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Enfoque de la Estrategia
              </label>
              <select
                id="ai-strategy-select"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="Salvar 0% APR + Minimizar Intereses (Recomendada)">
                  Prioridad 1: Liquidar tarjetas antes de fin de 0% APR + Avalancha
                </option>
                <option value="Método Avalancha Estricto (Mayor interés)">
                  Método Avalancha Estricto (Mayor tasa APR primero)
                </option>
                <option value="Método Bola de Nieve (Menor saldo primero)">
                  Método Bola de Nieve (Menor saldo deudor primero)
                </option>
                <option value="Flujo de Caja y Máxima Liquidez">
                  Máxima Liquidez (Proteger saldo en cuenta corriente)
                </option>
              </select>
            </div>

            <div>
              <label htmlFor="ai-notes-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nota adicional para la IA (Opcional)
              </label>
              <input
                id="ai-notes-input"
                type="text"
                placeholder="Ej. Recibo un bono el día 30, deseo liquidar la tarjeta de México primero..."
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          {activeTab === 'prompt' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Archivo generado listo para copiar o descargar:
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    {cards.length} tarjetas + {checkingAccounts.length} cuentas ({baseCurrency})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="copy-ai-prompt-btn"
                    type="button"
                    onClick={handleCopyPrompt}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> ¡Copiado al Portapapeles!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar Texto Completo
                      </>
                    )}
                  </button>

                  <button
                    id="download-ai-prompt-md-btn"
                    type="button"
                    onClick={() => downloadAiPromptFile(cards, checkingAccounts, userNotes, 'md', baseCurrency, exchangeRates)}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar Archivo (.md)
                  </button>

                  <button
                    id="download-ai-prompt-txt-btn"
                    type="button"
                    onClick={() => downloadAiPromptFile(cards, checkingAccounts, userNotes, 'txt', baseCurrency, exchangeRates)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> .txt
                  </button>
                </div>
              </div>

              {/* Code / Text viewer */}
              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono leading-relaxed overflow-x-auto max-h-96 border border-slate-800 whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                  {generatedPrompt}
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">¿Cómo usar este archivo generado?</p>
                  <p className="text-indigo-800 mt-0.5">
                    Puedes pegar este contenido directamente en <strong>ChatGPT, Claude, Google Gemini o DeepSeek</strong>. Ya incluye el rol financiero, las reglas de protección de 0% APR, la ordenación de deudas en México y USA, y la solicitud exacta del calendario de pagos.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Análisis y Estrategia en Tiempo Real</h3>
                  <p className="text-xs text-slate-500">
                    Procesa tus tarjetas actuales y cuentas de fondos para obtener un diagnóstico personalizado
                  </p>
                </div>

                <button
                  id="run-live-ai-btn"
                  type="button"
                  disabled={isLoadingAi}
                  onClick={handleRunLiveAi}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  {isLoadingAi ? 'Analizando con IA...' : 'Generar Sugerencias de Pago'}
                </button>
              </div>

              {aiError && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Aviso de Configuración:</p>
                    <p className="mt-0.5">{aiError}</p>
                  </div>
                </div>
              )}

              {isLoadingAi ? (
                <div className="p-12 text-center rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-800">Analizando vencimientos y tasas de tus tarjetas...</p>
                  <p className="text-xs text-slate-500 mt-1">Calculando distribución óptima de tu saldo disponible</p>
                </div>
              ) : aiAnalysis ? (
                <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="prose prose-sm max-w-none text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                    {aiAnalysis}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
                  <Bot className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800">Listo para analizar tus finanzas</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Haz clic en el botón superior para calcular la mejor forma de pagar tus tarjetas este mes, evitando intereses y protegiendo tus promociones a 0% APR.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50/70">
          <button
            id="close-ai-strategy-modal-footer-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
