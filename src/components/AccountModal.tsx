import React, { useState, useEffect } from 'react';
import { X, Landmark, DollarSign, Globe } from 'lucide-react';
import { CheckingAccount, SupportedCountry } from '../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: CheckingAccount) => void;
  accountToEdit: CheckingAccount | null;
  baseCurrency: string;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accountToEdit,
  baseCurrency,
}) => {
  const [name, setName] = useState('');
  const [country, setCountry] = useState<SupportedCountry>('México');
  const [accountType, setAccountType] = useState<'corriente' | 'ahorros' | 'nomina'>('corriente');
  const [balance, setBalance] = useState<number | ''>('');
  const [monthlyIncome, setMonthlyIncome] = useState<number | ''>('');
  const [currency, setCurrency] = useState(baseCurrency || 'USD');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setCountry((accountToEdit.country === 'USA' || (accountToEdit.country as any) === 'Estados Unidos') ? 'USA' : 'México');
      setAccountType(accountToEdit.accountType || 'corriente');
      setBalance(accountToEdit.balance ?? '');
      setMonthlyIncome(accountToEdit.monthlyIncome ?? '');
      setCurrency(accountToEdit.currency || baseCurrency || 'USD');
      setNotes(accountToEdit.notes || '');
    } else {
      setName('');
      setCountry('México');
      setAccountType('corriente');
      setBalance('');
      setMonthlyIncome('');
      setCurrency('MXN');
      setNotes('');
    }
  }, [accountToEdit, isOpen, baseCurrency]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const account: CheckingAccount = {
      id: accountToEdit ? accountToEdit.id : 'acc-' + Date.now(),
      name: name.trim(),
      country,
      accountType,
      balance: Number(balance) || 0,
      monthlyIncome: monthlyIncome !== '' ? Number(monthlyIncome) : undefined,
      currency: currency || (country === 'México' ? 'MXN' : 'USD'),
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSave(account);
    onClose();
  };


  return (
    <div id="account-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="account-modal-container"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {accountToEdit ? 'Editar Cuenta Bancaria' : 'Dar de Alta Cuenta Corriente'}
              </h2>
              <p className="text-xs text-slate-500">Registra tus fondos disponibles para abonar a deudas</p>
            </div>
          </div>
          <button
            id="close-account-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="account-name-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre de la Cuenta o Banco *
            </label>
            <input
              id="account-name-input"
              type="text"
              required
              placeholder="Ej. Chase Checking, BBVA Nómina, Santander Débito"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="account-country-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                País *
              </label>
              <div className="relative">
                <select
                  id="account-country-select"
                  required
                  value={country}
                  onChange={(e) => {
                    const newCountry = e.target.value as SupportedCountry;
                    setCountry(newCountry);
                    if (newCountry === 'México' && currency === 'USD') {
                      setCurrency('MXN');
                    } else if (newCountry === 'USA' && currency === 'MXN') {
                      setCurrency('USD');
                    }
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 bg-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="México">🇲🇽 México</option>
                  <option value="USA">🇺🇸 USA</option>
                </select>
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="account-type-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tipo de Cuenta
              </label>
              <select
                id="account-type-select"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="corriente">Cuenta Corriente</option>
                <option value="nomina">Cuenta de Nómina</option>
                <option value="ahorros">Ahorros / Débito</option>
              </select>
            </div>

            <div>
              <label htmlFor="account-currency-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Moneda
              </label>
              <select
                id="account-currency-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-800 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="MXN">🇲🇽 MXN - Peso Mexicano ($)</option>
                <option value="USD">🇺🇸 USD - Dólar ($)</option>
                <option value="EUR">🇪🇺 EUR - Euro (€)</option>
                <option value="CAD">🇨🇦 CAD - Canadiense (C$)</option>
                <option value="GBP">🇬🇧 GBP - Libra (£)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label htmlFor="account-balance-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Saldo Disponible Actual *
              </label>
              <div className="relative">
                <input
                  id="account-balance-input"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-slate-900 font-bold text-emerald-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label htmlFor="account-monthly-income" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Depósito/Ingreso Mensual
              </label>
              <div className="relative">
                <input
                  id="account-monthly-income"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="account-notes-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Notas u Observaciones (Opcional)
            </label>
            <input
              id="account-notes-input"
              type="text"
              placeholder="Ej. Cuenta asignada para pago automático de servicios..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              id="cancel-account-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              id="save-account-btn"
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors"
            >
              {accountToEdit ? 'Guardar Cambios' : 'Registrar Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
