import React, { useState, useEffect } from 'react';
import { X, CreditCard as CardIcon, Calendar, DollarSign, Globe, ShieldAlert } from 'lucide-react';
import { CreditCard, SupportedCountry } from '../types';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: CreditCard) => void;
  cardToEdit: CreditCard | null;
  baseCurrency: string;
}

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cardToEdit,
  baseCurrency,
}) => {
  const [name, setName] = useState('');
  const [country, setCountry] = useState<SupportedCountry>('México');
  const [cutOffDay, setCutOffDay] = useState(15);
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [hasZeroApr, setHasZeroApr] = useState(false);
  const [zeroAprEndDate, setZeroAprEndDate] = useState('');
  const [openingDate, setOpeningDate] = useState('');
  const [minPayment, setMinPayment] = useState<number | ''>('');
  const [noInterestPayment, setNoInterestPayment] = useState<number | ''>('');
  const [currentBalance, setCurrentBalance] = useState<number | ''>('');
  const [creditLimit, setCreditLimit] = useState<number | ''>('');
  const [aprRate, setAprRate] = useState<number | ''>('');
  const [currency, setCurrency] = useState(baseCurrency || 'USD');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (cardToEdit) {
      setName(cardToEdit.name);
      setCountry((cardToEdit.country === 'USA' || (cardToEdit.country as any) === 'Estados Unidos') ? 'USA' : 'México');
      setCutOffDay(cardToEdit.cutOffDay || 15);
      setPaymentDueDate(cardToEdit.paymentDueDate || '');
      setHasZeroApr(Boolean(cardToEdit.zeroAprEndDate));
      setZeroAprEndDate(cardToEdit.zeroAprEndDate || '');
      setOpeningDate(cardToEdit.openingDate || '');
      setMinPayment(cardToEdit.minPayment ?? '');
      setNoInterestPayment(cardToEdit.noInterestPayment ?? '');
      setCurrentBalance(cardToEdit.currentBalance ?? '');
      setCreditLimit(cardToEdit.creditLimit ?? '');
      setAprRate(cardToEdit.aprRate ?? '');
      setCurrency(cardToEdit.currency || baseCurrency || 'USD');
      setNotes(cardToEdit.notes || '');
    } else {
      // Default new card
      setName('');
      setCountry('México');
      setCutOffDay(15);
      // Default due date: in 15 days
      const d = new Date();
      d.setDate(d.getDate() + 15);
      setPaymentDueDate(d.toISOString().split('T')[0]);
      setHasZeroApr(false);
      setZeroAprEndDate('');
      setOpeningDate(new Date().toISOString().split('T')[0]);
      setMinPayment('');
      setNoInterestPayment('');
      setCurrentBalance('');
      setCreditLimit('');
      setAprRate(28);
      setCurrency('MXN');
      setNotes('');
    }
  }, [cardToEdit, isOpen, baseCurrency]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCard: CreditCard = {
      id: cardToEdit ? cardToEdit.id : 'card-' + Date.now(),
      name: name.trim(),
      country,
      cutOffDay: Number(cutOffDay) || 15,
      paymentDueDate: paymentDueDate || new Date().toISOString().split('T')[0],
      zeroAprEndDate: hasZeroApr ? zeroAprEndDate : '',
      openingDate: openingDate || undefined,
      minPayment: Number(minPayment) || 0,
      noInterestPayment: Number(noInterestPayment) || 0,
      currentBalance: Number(currentBalance) || 0,
      creditLimit: creditLimit !== '' ? Number(creditLimit) : undefined,
      aprRate: aprRate !== '' ? Number(aprRate) : undefined,
      currency: currency || (country === 'México' ? 'MXN' : 'USD'),
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSave(newCard);
    onClose();
  };


  return (
    <div id="card-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="card-modal-container"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
              <CardIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {cardToEdit ? 'Editar Tarjeta de Crédito' : 'Dar de Alta Tarjeta de Crédito'}
              </h2>
              <p className="text-xs text-slate-500">Completa los datos de corte, pagos y tasa 0% APR</p>
            </div>
          </div>
          <button
            id="close-card-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre y País */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="card-name-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nombre de la Tarjeta o Banco *
              </label>
              <input
                id="card-name-input"
                type="text"
                required
                placeholder="Ej. Chase Sapphire, BBVA Platino, Nu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors text-sm"
              />
            </div>

            <div>
              <label htmlFor="card-country-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                País *
              </label>
              <div className="relative">
                <select
                  id="card-country-select"
                  required
                  value={country}
                  onChange={(e) => {
                    const newCountry = e.target.value as SupportedCountry;
                    setCountry(newCountry);
                    // auto-suggest currency
                    if (newCountry === 'México' && currency === 'USD') {
                      setCurrency('MXN');
                    } else if (newCountry === 'USA' && currency === 'MXN') {
                      setCurrency('USD');
                    }
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors text-sm"
                >
                  <option value="México">🇲🇽 México</option>
                  <option value="USA">🇺🇸 USA (Estados Unidos)</option>
                </select>
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Deudas y Pagos */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Montos en su propia moneda ({currency})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label htmlFor="card-current-balance" className="block text-xs font-medium text-slate-700 mb-1">
                  Cuánto debo (Saldo actual) *
                </label>
                <input
                  id="card-current-balance"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>

              <div>
                <label htmlFor="card-no-interest-payment" className="block text-xs font-medium text-slate-700 mb-1">
                  Pago para no generar intereses *
                </label>
                <input
                  id="card-no-interest-payment"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={noInterestPayment}
                  onChange={(e) => setNoInterestPayment(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-semibold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>

              <div>
                <label htmlFor="card-min-payment" className="block text-xs font-medium text-slate-700 mb-1">
                  Cuánto pago mínimo *
                </label>
                <input
                  id="card-min-payment"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={minPayment}
                  onChange={(e) => setMinPayment(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-semibold text-amber-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div>
                <label htmlFor="card-credit-limit" className="block text-xs font-medium text-slate-600 mb-1">
                  Límite de crédito (Opcional)
                </label>
                <input
                  id="card-credit-limit"
                  type="number"
                  step="0.01"
                  placeholder="Ej. 5000"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label htmlFor="card-apr-rate" className="block text-xs font-medium text-slate-600 mb-1">
                  Tasa APR regular anual (%)
                </label>
                <input
                  id="card-apr-rate"
                  type="number"
                  step="0.1"
                  placeholder="Ej. 29.99"
                  value={aprRate}
                  onChange={(e) => setAprRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label htmlFor="card-currency" className="block text-xs font-medium text-slate-600 mb-1">
                  Moneda de la tarjeta
                </label>
                <select
                  id="card-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="MXN">🇲🇽 MXN - Peso Mexicano ($)</option>
                  <option value="USD">🇺🇸 USD - Dólar Estadounidense ($)</option>
                  <option value="EUR">🇪🇺 EUR - Euro (€)</option>
                  <option value="CAD">🇨🇦 CAD - Dólar Canadiense (C$)</option>
                  <option value="GBP">🇬🇧 GBP - Libra Esterlina (£)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fechas de corte y pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="card-cutoff-day" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Día de corte (del mes) *
              </label>
              <input
                id="card-cutoff-day"
                type="number"
                min="1"
                max="31"
                required
                placeholder="Ej. 15"
                value={cutOffDay}
                onChange={(e) => setCutOffDay(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">Día en que cierra tu estado de cuenta mensual.</p>
            </div>

            <div>
              <label htmlFor="card-payment-due-date" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Fecha límite de pago más próxima *
              </label>
              <div className="relative">
                <input
                  id="card-payment-due-date"
                  type="date"
                  required
                  value={paymentDueDate}
                  onChange={(e) => setPaymentDueDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Día máximo para abonar sin incurrir en mora.</p>
            </div>
          </div>

          {/* Promoción 0% APR */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="has-zero-apr-checkbox" className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  id="has-zero-apr-checkbox"
                  type="checkbox"
                  checked={hasZeroApr}
                  onChange={(e) => setHasZeroApr(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" /> ¿Tiene promoción de 0% APR (meses sin intereses)?
                </span>
              </label>
            </div>

            {hasZeroApr && (
              <div className="pt-1 animate-in fade-in duration-150">
                <label htmlFor="card-zero-apr-end" className="block text-xs font-medium text-slate-700 mb-1">
                  Fecha en que se acaba su 0% APR *
                </label>
                <input
                  id="card-zero-apr-end"
                  type="date"
                  required={hasZeroApr}
                  value={zeroAprEndDate}
                  onChange={(e) => setZeroAprEndDate(e.target.value)}
                  className="w-full sm:w-1/2 px-3.5 py-2 rounded-lg border border-amber-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
                <p className="text-[11px] text-amber-800 mt-1.5">
                  La app y la IA calcularán cuánto abonar cada mes para liquidarla antes de esta fecha y evitar intereses retroactivos.
                </p>
              </div>
            )}
          </div>

          {/* Fecha de apertura & Notas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="card-opening-date" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Fecha de Apertura (Opcional)
              </label>
              <input
                id="card-opening-date"
                type="date"
                value={openingDate}
                onChange={(e) => setOpeningDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label htmlFor="card-notes-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Notas adicionales (Opcional)
              </label>
              <input
                id="card-notes-input"
                type="text"
                placeholder="Ej. Recompensas, cashback, beneficios..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              id="cancel-card-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              id="save-card-btn"
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors"
            >
              {cardToEdit ? 'Guardar Cambios' : 'Registrar Tarjeta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
