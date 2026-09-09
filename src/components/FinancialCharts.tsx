import React, { useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  PieChart as PieIcon, 
  BarChart3, 
  CalendarClock, 
  Layers, 
  Info,
  DollarSign
} from 'lucide-react';
import { CreditCard, CheckingAccount, ExchangeRates, SupportedCountry } from '../types';
import { convertCurrency, formatMoney, getDaysDifference } from '../utils/calculations';

interface FinancialChartsProps {
  cards: CreditCard[];
  accounts: CheckingAccount[];
  baseCurrency: string;
  rates: ExchangeRates;
}

const PALETTE = [
  '#4f46e5', // indigo-600
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
];

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  cards,
  accounts,
  baseCurrency,
  rates,
}) => {
  const [activeTab, setActiveTab] = useState<'debt-dist' | 'country-comparison' | 'timeline' | 'coverage'>('debt-dist');

  // Prepare Data 1: Debt distribution by card (in base currency)
  const debtDistData = cards
    .filter(c => Number(c.currentBalance) > 0)
    .map(c => {
      const convertedBalance = convertCurrency(Number(c.currentBalance) || 0, c.currency, baseCurrency, rates);
      return {
        name: c.name,
        currency: c.currency,
        nativeBalance: Number(c.currentBalance) || 0,
        value: Math.round(convertedBalance * 100) / 100,
        country: c.country,
      };
    })
    .sort((a, b) => b.value - a.value);

  const totalConsolidatedDebt = debtDistData.reduce((acc, curr) => acc + curr.value, 0);

  // Prepare Data 2: Country comparison (México vs USA)
  const countryComparisonData: Array<{
    country: string;
    deuda: number;
    disponible: number;
    noInteres: number;
  }> = (['México', 'USA'] as SupportedCountry[]).map(country => {
    const countryCards = cards.filter(c => (c.country === country) || (country === 'USA' && (c.country as any) === 'Estados Unidos'));
    const countryAccounts = accounts.filter(a => (a.country === country) || (country === 'USA' && (a.country as any) === 'Estados Unidos'));

    const debt = countryCards.reduce((sum, c) => 
      sum + convertCurrency(Number(c.currentBalance) || 0, c.currency, baseCurrency, rates), 0);
    const noInterest = countryCards.reduce((sum, c) => 
      sum + convertCurrency(Number(c.noInterestPayment) || 0, c.currency, baseCurrency, rates), 0);
    const checking = countryAccounts.reduce((sum, a) => 
      sum + convertCurrency(Number(a.balance) || 0, a.currency, baseCurrency, rates), 0);

    return {
      country: country === 'México' ? '🇲🇽 México' : '🇺🇸 USA',
      deuda: Math.round(debt),
      disponible: Math.round(checking),
      noInteres: Math.round(noInterest),
    };
  });

  // Prepare Data 3: Due Dates Timeline (sorted by due date)
  const timelineData = [...cards]
    .filter(c => Number(c.currentBalance) > 0)
    .sort((a, b) => (a.paymentDueDate || '').localeCompare(b.paymentDueDate || ''))
    .map(c => {
      const convertedBalance = convertCurrency(Number(c.currentBalance) || 0, c.currency, baseCurrency, rates);
      const convertedNoInterest = convertCurrency(Number(c.noInterestPayment) || 0, c.currency, baseCurrency, rates);
      const convertedMin = convertCurrency(Number(c.minPayment) || 0, c.currency, baseCurrency, rates);
      const days = getDaysDifference(c.paymentDueDate);

      return {
        name: c.name.length > 14 ? c.name.slice(0, 12) + '…' : c.name,
        fullName: c.name,
        dueDate: c.paymentDueDate,
        daysRemaining: days !== null ? days : 99,
        pagoNoInteres: Math.round(convertedNoInterest),
        pagoMinimo: Math.round(convertedMin),
        saldoTotal: Math.round(convertedBalance),
        country: c.country,
        currency: c.currency,
        nativeBalance: c.currentBalance,
      };
    });

  // Prepare Data 4: 0% APR Debt vs Regular APR Debt
  const zeroAprCards = cards.filter(c => Boolean(c.zeroAprEndDate) && Number(c.currentBalance) > 0);
  const regularCards = cards.filter(c => !c.zeroAprEndDate && Number(c.currentBalance) > 0);

  const zeroAprTotal = zeroAprCards.reduce((sum, c) => 
    sum + convertCurrency(Number(c.currentBalance) || 0, c.currency, baseCurrency, rates), 0);
  const regularTotal = regularCards.reduce((sum, c) => 
    sum + convertCurrency(Number(c.currentBalance) || 0, c.currency, baseCurrency, rates), 0);

  const aprBreakdownData = [
    { name: 'Con 0% APR Vigente', value: Math.round(zeroAprTotal), color: '#10b981' },
    { name: 'Con Interés Regular / Sin Promo', value: Math.round(regularTotal), color: '#f43f5e' },
  ];

  return (
    <div id="financial-visualizations-card" className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Header & Tabs */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Visualizaciones Financieras</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {cards.length} Tarjetas en {baseCurrency}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Análisis gráfico consolidado y en moneda local para México y USA
          </p>
        </div>

        {/* View Selection Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
          <button
            id="tab-chart-debt-dist"
            type="button"
            onClick={() => setActiveTab('debt-dist')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'debt-dist'
                ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            Distribución de Deuda
          </button>

          <button
            id="tab-chart-country"
            type="button"
            onClick={() => setActiveTab('country-comparison')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'country-comparison'
                ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            México vs USA
          </button>

          <button
            id="tab-chart-timeline"
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'timeline'
                ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            Próximos Pagos
          </button>

          <button
            id="tab-chart-coverage"
            type="button"
            onClick={() => setActiveTab('coverage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'coverage'
                ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            0% APR vs Intereses
          </button>
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="p-6">
        {cards.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Añade o importa tarjetas para ver las visualizaciones</p>
          </div>
        ) : (
          <>
            {/* TAB 1: DISTRIBUCIÓN DE DEUDA */}
            {activeTab === 'debt-dist' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-7 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={debtDistData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {debtDistData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any, name: any, item: any) => {
                          const original = item.payload;
                          return [
                            `${formatMoney(value, baseCurrency)} (${formatMoney(original.nativeBalance, original.currency)})`,
                            original.name
                          ];
                        }}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="lg:col-span-5 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  <div className="pb-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
                    <span>Tarjeta / Banco</span>
                    <span>Consolidado ({baseCurrency})</span>
                  </div>
                  {debtDistData.map((item, idx) => {
                    const percent = totalConsolidatedDebt > 0 
                      ? Math.round((item.value / totalConsolidatedDebt) * 100) 
                      : 0;
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 hover:bg-slate-50 px-1.5 rounded transition-colors">
                        <div className="flex items-center gap-2 truncate max-w-[60%]">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} 
                          />
                          <span className="font-medium text-slate-800 truncate" title={item.name}>
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {item.country === 'México' ? '🇲🇽' : '🇺🇸'}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-900 block">
                            {formatMoney(item.value, baseCurrency)}
                          </span>
                          <span className="text-[10px] text-slate-600 block">
                            {percent}% • {formatMoney(item.nativeBalance, item.currency)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: MÉXICO VS USA */}
            {activeTab === 'country-comparison' && (
              <div>
                <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Valores consolidados en {baseCurrency} para comparación equitativa</span>
                  <span className="font-medium text-slate-700">Tasa: 1 USD = {rates.USD_MXN.toFixed(2)} MXN</span>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={countryComparisonData}
                      margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="country" tick={{ fontSize: 12, fill: '#475569' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                      <Tooltip 
                        formatter={(val: any) => [formatMoney(val, baseCurrency), '']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="deuda" name="Deuda Total" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="noInteres" name="Pago No Intereses" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="disponible" name="Fondos Disponibles" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* TAB 3: CRONOGRAMA DE PAGOS */}
            {activeTab === 'timeline' && (
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Próximas fechas límite de pago (ordenadas cronológicamente)</span>
                  <span>Montos en {baseCurrency}</span>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={timelineData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        angle={-20} 
                        textAnchor="end" 
                        tick={{ fontSize: 11, fill: '#475569' }} 
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                      <Tooltip 
                        formatter={(val: any, name: any, item: any) => {
                          const obj = item.payload;
                          const label = name === 'pagoNoInteres' ? 'Pago No Generar Interés' : 'Pago Mínimo';
                          return [`${formatMoney(val, baseCurrency)} (Vence: ${obj.dueDate})`, label];
                        }}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="pagoNoInteres" name="Pago No Interés" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pagoMinimo" name="Pago Mínimo" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* TAB 4: 0% APR VS REGULAR */}
            {activeTab === 'coverage' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-6 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={aprBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {aprBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: any) => [formatMoney(val, baseCurrency), 'Monto Consolidado']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        Deuda Protegida a 0% APR
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        {zeroAprCards.length} tarjetas
                      </span>
                    </div>
                    <p className="text-xl font-bold text-emerald-950 mt-1">
                      {formatMoney(zeroAprTotal, baseCurrency)}
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      No genera intereses mientras se liquide antes de su fecha límite individual de promoción.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                        Deuda con Tasa Regular (Genera Interés)
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">
                        {regularCards.length} tarjetas
                      </span>
                    </div>
                    <p className="text-xl font-bold text-rose-950 mt-1">
                      {formatMoney(regularTotal, baseCurrency)}
                    </p>
                    <p className="text-xs text-rose-700 mt-1">
                      Prioridad máxima de pago antes de la fecha de corte para evitar cargos de financiamiento.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
