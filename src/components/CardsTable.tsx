import React, { useState } from 'react';
import { 
  CreditCard as CardIcon, 
  Search, 
  ArrowUpDown, 
  Edit3, 
  Trash2, 
  Copy, 
  Calendar, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Filter,
  DollarSign,
  Globe2
} from 'lucide-react';
import { CreditCard, ExchangeRates } from '../types';
import { formatMoney, getZeroAprStatus, getPaymentDueStatus, convertCurrency } from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';

interface CardsTableProps {
  cards: CreditCard[];
  onEditCard: (card: CreditCard) => void;
  onDeleteCard: (id: string) => void;
  onDuplicateCard: (card: CreditCard) => void;
  onOpenNewCard: () => void;
  baseCurrency: string;
  exchangeRates: ExchangeRates;
}

type SortField = 'name' | 'currentBalance' | 'paymentDueDate' | 'zeroAprEndDate' | 'noInterestPayment';
type SortDirection = 'asc' | 'desc';

export const CardsTable: React.FC<CardsTableProps> = ({
  cards,
  onEditCard,
  onDeleteCard,
  onDuplicateCard,
  onOpenNewCard,
  baseCurrency,
  exchangeRates,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'dueSoon' | 'zeroAprActive' | 'withDebt'>('all');
  const [countryFilter, setCountryFilter] = useState<'all' | 'México' | 'USA'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('paymentDueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredCards = cards.filter((card) => {
    // Search match
    const matchesSearch = 
      card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.currency && card.currency.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (card.notes && card.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Country filter (México vs USA)
    if (countryFilter !== 'all') {
      const cardCountry = (card.country === 'USA' || (card.country as any) === 'Estados Unidos') ? 'USA' : 'México';
      if (cardCountry !== countryFilter) return false;
    }

    // Currency filter
    if (currencyFilter !== 'all') {
      if ((card.currency || 'USD').toUpperCase() !== currencyFilter) return false;
    }

    if (filterType === 'dueSoon') {
      const dueStatus = getPaymentDueStatus(card.paymentDueDate);
      return dueStatus.days !== null && dueStatus.days <= 7;
    }

    if (filterType === 'zeroAprActive') {
      return Boolean(card.zeroAprEndDate);
    }

    if (filterType === 'withDebt') {
      return card.currentBalance > 0;
    }

    return true;
  });

  const sortedCards = [...filteredCards].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'currentBalance') {
      comparison = (a.currentBalance || 0) - (b.currentBalance || 0);
    } else if (sortField === 'noInterestPayment') {
      comparison = (a.noInterestPayment || 0) - (b.noInterestPayment || 0);
    } else if (sortField === 'paymentDueDate') {
      const dateA = a.paymentDueDate ? new Date(a.paymentDueDate).getTime() : Infinity;
      const dateB = b.paymentDueDate ? new Date(b.paymentDueDate).getTime() : Infinity;
      comparison = dateA - dateB;
    } else if (sortField === 'zeroAprEndDate') {
      const dateA = a.zeroAprEndDate ? new Date(a.zeroAprEndDate).getTime() : Infinity;
      const dateB = b.zeroAprEndDate ? new Date(b.zeroAprEndDate).getTime() : Infinity;
      comparison = dateA - dateB;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Extract unique currencies in current cards
  const uniqueCurrencies = Array.from(new Set(cards.map(c => (c.currency || 'USD').toUpperCase())));

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Tarjetas de Crédito Registradas</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                {cards.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulta cortes, pagos y saldos en su propia moneda con equivalencia consolidada
            </p>
          </div>

          <button
            id="table-add-card-btn"
            type="button"
            onClick={onOpenNewCard}
            className="self-start md:self-auto px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> Dar de Alta Tarjeta
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Search bar */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="search-cards-input"
              type="text"
              placeholder="Buscar tarjeta o banco..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Country Filter (México vs USA) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
              <span className="text-slate-400 px-1 text-[11px] font-semibold">País:</span>
              <button
                id="filter-country-all"
                type="button"
                onClick={() => setCountryFilter('all')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  countryFilter === 'all'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                id="filter-country-mexico"
                type="button"
                onClick={() => setCountryFilter('México')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  countryFilter === 'México'
                    ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇲🇽 México
              </button>
              <button
                id="filter-country-usa"
                type="button"
                onClick={() => setCountryFilter('USA')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  countryFilter === 'USA'
                    ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇺🇸 USA
              </button>
            </div>

            {/* Currency Filter Dropdown */}
            {uniqueCurrencies.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                <span className="text-slate-400 px-1 text-[11px] font-semibold">Moneda:</span>
                <select
                  id="filter-currency-select"
                  value={currencyFilter}
                  onChange={(e) => setCurrencyFilter(e.target.value)}
                  className="bg-white border-0 text-slate-800 text-xs font-semibold rounded px-1.5 py-0.5 shadow-2xs focus:outline-none"
                >
                  <option value="all">Todas ({uniqueCurrencies.join(', ')})</option>
                  {uniqueCurrencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Status filters */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
              <button
                id="filter-cards-all"
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas
              </button>
              <button
                id="filter-cards-due-soon"
                type="button"
                onClick={() => setFilterType('dueSoon')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  filterType === 'dueSoon'
                    ? 'bg-white text-amber-800 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ≤ 7d
              </button>
              <button
                id="filter-cards-zero-apr"
                type="button"
                onClick={() => setFilterType('zeroAprActive')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  filterType === 'zeroAprActive'
                    ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                0% APR
              </button>
              <button
                id="filter-cards-with-debt"
                type="button"
                onClick={() => setFilterType('withDebt')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  filterType === 'withDebt'
                    ? 'bg-white text-rose-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Con Deuda
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-100">
          <thead className="bg-slate-50/80 text-slate-600 font-bold tracking-wider uppercase text-[11px]">
            <tr>
              <th scope="col" className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Tarjeta / Banco
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th scope="col" className="py-3 px-4">
                País & Corte
              </th>
              <th scope="col" className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleSort('paymentDueDate')}
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Fecha Límite Pago
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th scope="col" className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleSort('currentBalance')}
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Cuánto Debo (Saldo)
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th scope="col" className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleSort('noInterestPayment')}
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Pago No Interés / Mínimo
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th scope="col" className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleSort('zeroAprEndDate')}
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  Fin de 0% APR
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedCards.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <CardIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No se encontraron tarjetas</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchTerm ? 'Intenta modificar el término de búsqueda.' : 'Agrega tu primera tarjeta de crédito.'}
                  </p>
                </td>
              </tr>
            ) : (
              sortedCards.map((card) => {
                const dueStatus = getPaymentDueStatus(card.paymentDueDate);
                const zeroAprStatus = getZeroAprStatus(card);
                const cardCurrency = (card.currency || 'USD').toUpperCase();
                const isDifferentCurrency = cardCurrency !== baseCurrency.toUpperCase();
                const convertedBalance = convertCurrency(card.currentBalance, cardCurrency, baseCurrency, exchangeRates);

                const flag = (card.country === 'USA' || (card.country as any) === 'Estados Unidos') ? '🇺🇸' : '🇲🇽';

                return (
                  <tr 
                    key={card.id} 
                    id={`card-row-${card.id}`}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Tarjeta & Banco */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{card.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {cardCurrency}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        {card.openingDate && (
                          <span>Apertura: {card.openingDate}</span>
                        )}
                        {card.aprRate ? (
                          <span className="text-slate-600 font-medium">
                            APR: {card.aprRate}%
                          </span>
                        ) : null}
                      </div>
                      {card.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                          {card.notes}
                        </p>
                      )}
                    </td>

                    {/* País & Corte */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                        <span>{flag}</span>
                        <span>{card.country}</span>
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Corte: <span className="font-bold text-slate-700">Día {card.cutOffDay}</span>
                      </div>
                    </td>

                    {/* Fecha Límite de Pago */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {card.paymentDueDate}
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] border mt-1 font-medium ${dueStatus.badgeClass}`}>
                        {dueStatus.text}
                      </span>
                    </td>

                    {/* Cuánto Debo (En su propia moneda y convertido) */}
                    <td className="py-3.5 px-4">
                      <div className="text-sm font-extrabold text-slate-900">
                        {formatMoney(card.currentBalance, cardCurrency)}
                      </div>
                      {isDifferentCurrency && (
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          ≈ {formatMoney(convertedBalance, baseCurrency)}
                        </div>
                      )}
                      {card.creditLimit ? (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Límite: {formatMoney(card.creditLimit, cardCurrency)}
                        </div>
                      ) : null}
                    </td>

                    {/* Pagos: No Interés vs Mínimo */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-emerald-700 text-xs">
                        No interés: {formatMoney(card.noInterestPayment, cardCurrency)}
                      </div>
                      <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                        Mínimo: {formatMoney(card.minPayment, cardCurrency)}
                      </div>
                    </td>

                    {/* Fin de 0% APR */}
                    <td className="py-3.5 px-4">
                      {card.zeroAprEndDate ? (
                        <div>
                          <div className="font-medium text-slate-900 text-xs">
                            {card.zeroAprEndDate}
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] border mt-1 font-semibold ${zeroAprStatus.badgeClass}`}>
                            {zeroAprStatus.statusText}
                          </span>
                          {zeroAprStatus.hasZeroApr && zeroAprStatus.monthlyPaymentNeededToClear > 0 && (
                            <div className="text-[11px] font-semibold text-indigo-700 mt-1">
                              Abono sugerido: ~{formatMoney(zeroAprStatus.monthlyPaymentNeededToClear, cardCurrency)}/mes
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">
                          No aplica / Sin 0%
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                        <button
                          id={`edit-card-btn-${card.id}`}
                          type="button"
                          onClick={() => onEditCard(card)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-indigo-600 transition-colors"
                          title="Editar tarjeta"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`duplicate-card-btn-${card.id}`}
                          type="button"
                          onClick={() => onDuplicateCard(card)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-emerald-600 transition-colors"
                          title="Duplicar tarjeta"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-card-btn-${card.id}`}
                          type="button"
                          onClick={() => setCardToDelete(card)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors"
                          title="Eliminar tarjeta"
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
        isOpen={cardToDelete !== null}
        onClose={() => setCardToDelete(null)}
        onConfirm={() => {
          if (cardToDelete) {
            onDeleteCard(cardToDelete.id);
            setCardToDelete(null);
          }
        }}
        title="¿Eliminar tarjeta de crédito?"
        description={`¿Estás seguro de que deseas eliminar "${cardToDelete?.name}" (${cardToDelete?.currency})? Se recalculará tu deuda consolidada automáticamente.`}
        confirmText="Sí, eliminar tarjeta"
      />
    </div>
  );
};
