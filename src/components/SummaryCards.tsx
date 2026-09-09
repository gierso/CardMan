import React, { useState } from 'react';
import { 
  CreditCard as CardIcon, 
  DollarSign, 
  AlertTriangle, 
  Landmark, 
  ShieldAlert, 
  CheckCircle2,
  TrendingDown,
  ArrowRightLeft,
  Settings2,
  Globe2
} from 'lucide-react';
import { formatMoney, CountryFinancialSummary } from '../utils/calculations';
import { CurrencyBreakdown, ExchangeRates, SupportedCountry } from '../types';

interface SummaryCardsProps {
  totalDebt: number;
  totalNoInterestPayment: number;
  totalMinPayment: number;
  totalCheckingBalance: number;
  netCoverage: number;
  coveragePercent: number;
  expiringZeroAprCardsCount: number;
  baseCurrency: string;
  currencyBreakdown: CurrencyBreakdown[];
  countryBreakdown: Record<SupportedCountry, CountryFinancialSummary>;
  exchangeRates: ExchangeRates;
  onUpdateExchangeRate: (rateUsdMxn: number) => void;
  onChangeBaseCurrency: (currency: string) => void;
  onFilterExpiringApr?: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalDebt,
  totalNoInterestPayment,
  totalMinPayment,
  totalCheckingBalance,
  netCoverage,
  coveragePercent,
  expiringZeroAprCardsCount,
  baseCurrency,
  currencyBreakdown,
  countryBreakdown,
  exchangeRates,
  onUpdateExchangeRate,
  onChangeBaseCurrency,
  onFilterExpiringApr,
}) => {
  const [viewMode, setViewMode] = useState<'consolidated' | 'native' | 'country'>('consolidated');
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(exchangeRates.USD_MXN.toString());

  const isSurplus = netCoverage >= 0;

  const handleSaveRate = () => {
    const parsed = parseFloat(rateInput);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateExchangeRate(parsed);
      setIsEditingRate(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Top Controls Bar: View Mode selector & Exchange Rate settings */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            id="view-mode-consolidated-btn"
            type="button"
            onClick={() => setViewMode('consolidated')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'consolidated'
                ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Suma Final Global ({baseCurrency})
          </button>
          <button
            id="view-mode-native-btn"
            type="button"
            onClick={() => setViewMode('native')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'native'
                ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            En su propia moneda (MXN / USD)
          </button>
          <button
            id="view-mode-country-btn"
            type="button"
            onClick={() => setViewMode('country')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'country'
                ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🇲🇽 México vs 🇺🇸 USA
          </button>
        </div>

        {/* Global Currency & Exchange Rate Bar */}
        <div className="flex items-center gap-3 text-xs">
          {/* Base currency selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Moneda consolidada:</span>
            <select
              id="global-base-currency-select"
              value={baseCurrency}
              onChange={(e) => onChangeBaseCurrency(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 font-bold rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="USD">🇺🇸 USD ($)</option>
              <option value="MXN">🇲🇽 MXN ($)</option>
            </select>
          </div>

          {/* Quick inline exchange rate editor */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-slate-500">T.C.:</span>
            {isEditingRate ? (
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-700">1 USD =</span>
                <input
                  id="exchange-rate-input"
                  type="number"
                  step="0.05"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="w-16 px-1.5 py-0.5 border border-indigo-400 rounded text-slate-900 font-bold text-xs"
                />
                <span className="text-slate-700">MXN</span>
                <button
                  id="save-exchange-rate-btn"
                  type="button"
                  onClick={handleSaveRate}
                  className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-semibold hover:bg-indigo-700"
                >
                  OK
                </button>
              </div>
            ) : (
              <button
                id="edit-exchange-rate-btn"
                type="button"
                onClick={() => {
                  setRateInput(exchangeRates.USD_MXN.toString());
                  setIsEditingRate(true);
                }}
                className="flex items-center gap-1 font-semibold text-slate-800 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-2 py-1 rounded border border-slate-200 transition-colors"
                title="Haz clic para modificar el tipo de cambio USD/MXN"
              >
                <span>1 USD = ${exchangeRates.USD_MXN.toFixed(2)} MXN</span>
                <Settings2 className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: SUMA GLOBAL CONSOLIDADA */}
      {viewMode === 'consolidated' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Deuda Total Global */}
          <div id="metric-total-debt" className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deuda Total Global</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatMoney(totalDebt, baseCurrency)}
              </p>
              {/* Native currency sub-breakdown pill */}
              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-[11px]">
                {currencyBreakdown.map(cb => (
                  <span key={cb.currency} className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 font-medium border border-slate-200">
                    {formatMoney(cb.totalDebt, cb.currency)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Pago para no generar intereses */}
          <div id="metric-no-interest" className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pago para no intereses</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-indigo-900 tracking-tight">
                {formatMoney(totalNoInterestPayment, baseCurrency)}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-[11px]">
                {currencyBreakdown.map(cb => (
                  <span key={cb.currency} className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium border border-indigo-100">
                    {formatMoney(cb.totalNoInterestPayment, cb.currency)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Saldo Cuentas Corrientes */}
          <div id="metric-checking-balance" className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cuentas Corrientes</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-emerald-800 tracking-tight">
                {formatMoney(totalCheckingBalance, baseCurrency)}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                {isSurplus ? (
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Superávit de {formatMoney(netCoverage, baseCurrency)}
                  </span>
                ) : (
                  <span className="font-semibold text-rose-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Déficit de {formatMoney(Math.abs(netCoverage), baseCurrency)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 4. Alertas 0% APR */}
          <div 
            id="metric-zero-apr-alerts" 
            className={`rounded-xl p-5 border transition-all ${
              expiringZeroAprCardsCount > 0 
                ? 'bg-amber-50/60 border-amber-300 shadow-2xs' 
                : 'bg-white border-slate-200/90 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Vencimiento 0% APR</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                expiringZeroAprCardsCount > 0 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-extrabold tracking-tight ${
                  expiringZeroAprCardsCount > 0 ? 'text-amber-900' : 'text-slate-900'
                }`}>
                  {expiringZeroAprCardsCount}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {expiringZeroAprCardsCount === 1 ? 'tarjeta por vencer' : 'tarjetas por vencer'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                {expiringZeroAprCardsCount > 0 
                  ? 'Vencen en menos de 60 días. Liquidar antes para evitar recargos.' 
                  : 'Sin promociones 0% con vencimiento próximo.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: EN SU PROPIA MONEDA */}
      {viewMode === 'native' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currencyBreakdown.map((cb) => {
            const netCurr = cb.totalCheckingBalance - cb.totalNoInterestPayment;
            return (
              <div key={cb.currency} className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {cb.currency === 'MXN' ? '🇲🇽' : cb.currency === 'USD' ? '🇺🇸' : cb.currency === 'EUR' ? '🇪🇺' : '🌐'}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{cb.currency} - {cb.currency === 'MXN' ? 'Pesos Mexicanos' : cb.currency === 'USD' ? 'Dólares Americanos' : cb.currency}</h3>
                      <p className="text-[11px] text-slate-500">{cb.cardCount} tarjetas en esta moneda</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {cb.currency}
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Deuda total ({cb.currency}):</span>
                    <span className="font-bold text-rose-700 text-sm">{formatMoney(cb.totalDebt, cb.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Pago No Interés ({cb.currency}):</span>
                    <span className="font-bold text-indigo-700 text-sm">{formatMoney(cb.totalNoInterestPayment, cb.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Pago Mínimo ({cb.currency}):</span>
                    <span className="font-bold text-amber-700">{formatMoney(cb.totalMinPayment, cb.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Fondos disponibles ({cb.currency}):</span>
                    <span className="font-bold text-emerald-700 text-sm">{formatMoney(cb.totalCheckingBalance, cb.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500 font-medium">Balance neto ({cb.currency}):</span>
                    <span className={`font-bold ${netCurr >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {netCurr >= 0 ? `+${formatMoney(netCurr, cb.currency)}` : formatMoney(netCurr, cb.currency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: DESGLOSE MÉXICO VS USA */}
      {viewMode === 'country' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['México', 'USA'] as SupportedCountry[]).map((country) => {
            const summary = countryBreakdown[country];
            const flag = country === 'México' ? '🇲🇽' : '🇺🇸';
            const countryCurrency = country === 'México' ? 'MXN' : 'USD';
            const net = summary.totalCheckingConsolidated - summary.totalDebtConsolidated;

            return (
              <div key={country} className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{flag}</span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{country === 'México' ? 'México' : 'Estados Unidos (USA)'}</h3>
                      <p className="text-xs text-slate-500">
                        {summary.cardsCount} tarjetas • {summary.accountsCount} cuentas bancarias
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
                    Moneda habitual: {countryCurrency}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-100">
                    <span className="text-rose-700 font-semibold block uppercase tracking-wider text-[10px]">Deuda en {country}</span>
                    <span className="text-base font-extrabold text-rose-900 block mt-1">
                      {formatMoney(summary.totalDebtConsolidated, baseCurrency)}
                    </span>
                    <span className="text-[11px] text-rose-600 font-medium">
                      En moneda local: {formatMoney(summary.totalDebtNative, countryCurrency)}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                    <span className="text-emerald-700 font-semibold block uppercase tracking-wider text-[10px]">Fondos en {country}</span>
                    <span className="text-base font-extrabold text-emerald-900 block mt-1">
                      {formatMoney(summary.totalCheckingConsolidated, baseCurrency)}
                    </span>
                    <span className="text-[11px] text-emerald-600 font-medium">
                      En moneda local: {formatMoney(summary.totalCheckingNative, countryCurrency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
