import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CreditCard, CheckingAccount } from '../types';
import { parseCardsCsv, exportCardsToCsv, exportAccountsToCsv, downloadSampleCardsCsv } from '../utils/csv';

interface CsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCards: (newCards: CreditCard[]) => void;
  cards: CreditCard[];
  checkingAccounts: CheckingAccount[];
}

export const CsvModal: React.FC<CsvModalProps> = ({
  isOpen,
  onClose,
  onImportCards,
  cards,
  checkingAccounts,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [dragActive, setDragActive] = useState(false);
  const [previewCards, setPreviewCards] = useState<CreditCard[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    setErrorMessage('');
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Por favor selecciona un archivo con extensión .csv');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setErrorMessage('El archivo está vacío.');
        return;
      }

      const { cards, errors } = parseCardsCsv(text);
      if (errors.length > 0) {
        setErrorMessage(errors.join(', '));
      }
      if (cards.length === 0) {
        setErrorMessage('No se pudieron reconocer tarjetas en el archivo CSV. Verifica el formato o descarga la plantilla de ejemplo.');
      } else {
        setPreviewCards(cards);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (previewCards.length > 0) {
      onImportCards(previewCards);
      setPreviewCards([]);
      setFileName('');
      onClose();
    }
  };

  return (
    <div id="csv-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="csv-modal-container"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Importar y Exportar CSV</h2>
              <p className="text-xs text-slate-500">Maneja tus tarjetas masivamente con hojas de cálculo</p>
            </div>
          </div>
          <button
            id="close-csv-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-slate-200 bg-slate-50/40 px-6 pt-2">
          <button
            id="tab-import-csv-btn"
            type="button"
            onClick={() => setActiveTab('import')}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" /> Importar desde CSV
          </button>
          <button
            id="tab-export-csv-btn"
            type="button"
            onClick={() => setActiveTab('export')}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" /> Exportar a CSV / Plantillas
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'import' ? (
            <div className="space-y-4">
              {/* Drop area */}
              <div
                id="csv-drop-zone"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {fileName ? `Archivo seleccionado: ${fileName}` : 'Haz clic o arrastra tu archivo .CSV aquí'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Reconoce automáticamente columnas de banco, fechas de corte, 0% APR, deuda y pagos.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Preview table */}
              {previewCards.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {previewCards.length} tarjetas detectadas listas para importar:
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewCards([])}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Descartar
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                      <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2.5">Tarjeta / Banco</th>
                          <th className="p-2.5">País</th>
                          <th className="p-2.5">Corte</th>
                          <th className="p-2.5">F. Pago</th>
                          <th className="p-2.5">Fin 0% APR</th>
                          <th className="p-2.5">Deuda</th>
                          <th className="p-2.5">No Interés</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {previewCards.map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-medium text-slate-900">{c.name}</td>
                            <td className="p-2.5">{c.country}</td>
                            <td className="p-2.5">Día {c.cutOffDay}</td>
                            <td className="p-2.5">{c.paymentDueDate}</td>
                            <td className="p-2.5 text-amber-700 font-medium">{c.zeroAprEndDate || '—'}</td>
                            <td className="p-2.5 font-semibold text-slate-900">${c.currentBalance}</td>
                            <td className="p-2.5 text-emerald-700 font-semibold">${c.noInterestPayment}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  id="download-sample-template-btn"
                  type="button"
                  onClick={downloadSampleCardsCsv}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar Plantilla CSV de Ejemplo
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                  >
                    Cerrar
                  </button>
                  <button
                    id="confirm-csv-import-btn"
                    type="button"
                    disabled={previewCards.length === 0}
                    onClick={handleConfirmImport}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition-colors ${
                      previewCards.length > 0
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    Confirmar Importación ({previewCards.length})
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-1">Exportar Tarjetas de Crédito</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Genera un archivo CSV compatible con Excel, Google Sheets o Apple Numbers con todas las {cards.length} tarjetas registradas.
                </p>
                <button
                  id="export-cards-csv-btn"
                  type="button"
                  onClick={() => exportCardsToCsv(cards)}
                  className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" /> Exportar {cards.length} Tarjetas a CSV
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-1">Exportar Cuentas Corrientes y Fondos</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Descarga un reporte CSV con los saldos disponibles y cuentas bancarias registradas.
                </p>
                <button
                  id="export-accounts-csv-btn"
                  type="button"
                  onClick={() => exportAccountsToCsv(checkingAccounts)}
                  className="px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" /> Exportar {checkingAccounts.length} Cuentas a CSV
                </button>
              </div>

              <div className="pt-2">
                <button
                  id="download-template-csv-btn2"
                  type="button"
                  onClick={downloadSampleCardsCsv}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar Plantilla CSV Limpia (Formato Excel)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
