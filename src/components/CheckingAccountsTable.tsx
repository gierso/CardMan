import React, { useState } from 'react';
import { Landmark, Plus, Edit3, Trash2, DollarSign, Wallet } from 'lucide-react';
import { CheckingAccount, ExchangeRates, SupportedCountry } from '../types';
import { formatMoney, convertCurrency } from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';

interface CheckingAccountsTableProps {
  accounts: CheckingAccount[];
  onEditAccount: (account: CheckingAccount) => void;
  onDeleteAccount: (id: string) => void;
  onOpenNewAccount: () => void;
  baseCurrency: string;
  exchangeRates: ExchangeRates;
}

export const CheckingAccountsTable: React.FC<CheckingAccountsTableProps> = ({
  accounts,
  onEditAccount,
  onDeleteAccount,
  onOpenNewAccount,
  baseCurrency,
  exchangeRates,
}) => {
  const [countryFilter, setCountryFilter] = useState<'all' | 'México' | 'USA'>('all');
  const [accountToDelete, setAccountToDelete] = useState<CheckingAccount | null>(null);

  const filteredAccounts = accounts.filter(acc => {
    if (countryFilter === 'all') return true;
    const countryKey: SupportedCountry = (acc.country === 'USA' || (acc.country as any) === 'Estados Unidos') ? 'USA' : 'México';
    return countryKey === countryFilter;
  });

  const totalConsolidated = accounts.reduce((acc, curr) => {
    const converted = convertCurrency(curr.balance || 0, curr.currency || 'USD', baseCurrency, exchangeRates);
    return acc + converted;
  }, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Table Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>Cuentas Corrientes y Fondos Disponibles</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Total Consolidado: {formatMoney(totalConsolidated, baseCurrency)}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cuentas líquidas para pagar tus tarjetas y solventar tus compromisos en México y USA
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Country filter buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              id="filter-accounts-all"
              type="button"
              onClick={() => setCountryFilter('all')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                countryFilter === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas
            </button>
            <button
              id="filter-accounts-mexico"
              type="button"
              onClick={() => setCountryFilter('México')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                countryFilter === 'México'
                  ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇲🇽 México
            </button>
            <button
              id="filter-accounts-usa"
              type="button"
              onClick={() => setCountryFilter('USA')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                countryFilter === 'USA'
                  ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇺🇸 USA
            </button>
          </div>

          <button
            id="table-add-account-btn"
            type="button"
            onClick={onOpenNewAccount}
            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar Cuenta
          </button>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-100">
          <thead className="bg-slate-50/80 text-slate-600 font-bold tracking-wider uppercase text-[11px]">
            <tr>
              <th scope="col" className="py-3 px-4">Banco / Cuenta</th>
              <th scope="col" className="py-3 px-4">País & Tipo</th>
              <th scope="col" className="py-3 px-4">Saldo Disponible</th>
              <th scope="col" className="py-3 px-4">Ingreso Mensual Previsto</th>
              <th scope="col" className="py-3 px-4">Notas</th>
              <th scope="col" className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  <Landmark className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No hay cuentas bancarias que coincidan</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Agrega tu cuenta corriente para calcular la cobertura exacta de tus deudas.
                  </p>
                </td>
              </tr>
            ) : (
              filteredAccounts.map((acc) => {
                const accCurrency = (acc.currency || 'USD').toUpperCase();
                const isDifferentCurrency = accCurrency !== baseCurrency.toUpperCase();
                const convertedBalance = convertCurrency(acc.balance, accCurrency, baseCurrency, exchangeRates);
                const flag = (acc.country === 'USA' || (acc.country as any) === 'Estados Unidos') ? '🇺🇸' : '🇲🇽';

                return (
                  <tr key={acc.id} id={`account-row-${acc.id}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          {acc.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span>{acc.name}</span>
                          <span className="ml-1.5 text-xs px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                            {accCurrency}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                        <span>{flag}</span>
                        <span>{acc.country}</span>
                      </span>
                      <span className="block text-[11px] text-slate-500 capitalize">
                        {acc.accountType || 'Cuenta Corriente'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-extrabold text-emerald-700">
                        {formatMoney(acc.balance, accCurrency)}
                      </div>
                      {isDifferentCurrency && (
                        <div className="text-[11px] text-slate-500 font-medium">
                          ≈ {formatMoney(convertedBalance, baseCurrency)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {acc.monthlyIncome ? (
                        <span className="font-semibold text-slate-700">
                          {formatMoney(acc.monthlyIncome, accCurrency)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No especificado</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {acc.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`edit-account-btn-${acc.id}`}
                          type="button"
                          onClick={() => onEditAccount(acc)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-emerald-700 transition-colors"
                          title="Editar cuenta"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-account-btn-${acc.id}`}
                          type="button"
                          onClick={() => setAccountToDelete(acc)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors"
                          title="Eliminar cuenta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Custom In-App Confirm Dialog (Reliable in iFrames/Preview) */}
      <ConfirmDialog
        isOpen={accountToDelete !== null}
        onClose={() => setAccountToDelete(null)}
        onConfirm={() => {
          if (accountToDelete) {
            onDeleteAccount(accountToDelete.id);
            setAccountToDelete(null);
          }
        }}
        title="¿Eliminar cuenta bancaria?"
        description={`¿Estás seguro de que deseas eliminar la cuenta "${accountToDelete?.name}" (${accountToDelete?.currency})? Esta acción actualizará tu saldo total disponible.`}
        confirmText="Sí, eliminar cuenta"
      />
    </div>
  );
};
