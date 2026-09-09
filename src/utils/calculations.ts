import { CreditCard, CheckingAccount, ExchangeRates, CurrencyBreakdown, SupportedCountry } from '../types';

export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  USD_MXN: 18.50, // 1 USD = 18.50 MXN
  EUR_USD: 1.08,  // 1 EUR = 1.08 USD
  CAD_USD: 0.74,  // 1 CAD = 0.74 USD
  GBP_USD: 1.30,  // 1 GBP = 1.30 USD
};

/**
 * Converts an amount from one currency to another using the exchange rates table
 */
export function convertCurrency(
  amount: number,
  from: string = 'USD',
  to: string = 'USD',
  rates: ExchangeRates = DEFAULT_EXCHANGE_RATES
): number {
  if (!amount || from === to) return amount || 0;

  const fromCurr = (from || 'USD').toUpperCase();
  const toCurr = (to || 'USD').toUpperCase();
  if (fromCurr === toCurr) return amount;

  const usdMxn = rates.USD_MXN || 18.50;
  const eurUsd = rates.EUR_USD || 1.08;
  const cadUsd = rates.CAD_USD || 0.74;
  const gbpUsd = rates.GBP_USD || 1.30;

  // Step 1: Convert `from` to USD
  let amountInUsd = amount;
  if (fromCurr === 'USD') {
    amountInUsd = amount;
  } else if (fromCurr === 'MXN') {
    amountInUsd = amount / usdMxn;
  } else if (fromCurr === 'EUR') {
    amountInUsd = amount * eurUsd;
  } else if (fromCurr === 'CAD') {
    amountInUsd = amount * cadUsd;
  } else if (fromCurr === 'GBP') {
    amountInUsd = amount * gbpUsd;
  }

  // Step 2: Convert USD to `to`
  if (toCurr === 'USD') {
    return amountInUsd;
  } else if (toCurr === 'MXN') {
    return amountInUsd * usdMxn;
  } else if (toCurr === 'EUR') {
    return amountInUsd / eurUsd;
  } else if (toCurr === 'CAD') {
    return amountInUsd / cadUsd;
  } else if (toCurr === 'GBP') {
    return amountInUsd / gbpUsd;
  }

  return amountInUsd;
}

export function formatMoney(amount: number, currency: string = 'USD'): string {
  const curr = (currency || 'USD').toUpperCase();
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  } catch {
    return `${curr} ${(amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  }
}


export function getDaysDifference(targetDateStr?: string): number | null {
  if (!targetDateStr) return null;
  const target = new Date(targetDateStr);
  if (isNaN(target.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export interface ZeroAprStatus {
  hasZeroApr: boolean;
  daysRemaining: number | null;
  statusText: string;
  badgeClass: string;
  monthlyPaymentNeededToClear: number;
}

export function getZeroAprStatus(card: CreditCard): ZeroAprStatus {
  if (!card.zeroAprEndDate) {
    return {
      hasZeroApr: false,
      daysRemaining: null,
      statusText: 'Sin promo 0%',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      monthlyPaymentNeededToClear: 0,
    };
  }

  const days = getDaysDifference(card.zeroAprEndDate);
  if (days === null) {
    return {
      hasZeroApr: false,
      daysRemaining: null,
      statusText: 'Fecha no válida',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      monthlyPaymentNeededToClear: 0,
    };
  }

  // Calculate monthly payment needed to pay off before 0% ends
  const monthsRemaining = Math.max(1, Math.ceil(days / 30));
  const monthlyPaymentNeededToClear = card.currentBalance > 0 ? Math.round(card.currentBalance / monthsRemaining) : 0;

  if (days < 0) {
    return {
      hasZeroApr: true,
      daysRemaining: days,
      statusText: `Venció hace ${Math.abs(days)}d`,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold',
      monthlyPaymentNeededToClear: card.currentBalance,
    };
  }

  if (days <= 30) {
    return {
      hasZeroApr: true,
      daysRemaining: days,
      statusText: `¡Termina en ${days} días!`,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold animate-pulse',
      monthlyPaymentNeededToClear,
    };
  }

  if (days <= 60) {
    return {
      hasZeroApr: true,
      daysRemaining: days,
      statusText: `Quedan ${days} días`,
      badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-300',
      monthlyPaymentNeededToClear,
    };
  }

  return {
    hasZeroApr: true,
    daysRemaining: days,
    statusText: `${days} días (Vigente)`,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    monthlyPaymentNeededToClear,
  };
}

export function getPaymentDueStatus(dueDateStr: string): {
  days: number | null;
  text: string;
  badgeClass: string;
} {
  const days = getDaysDifference(dueDateStr);
  if (days === null) {
    return { days: null, text: 'No definida', badgeClass: 'text-slate-500 bg-slate-100 border-slate-200' };
  }

  if (days < 0) {
    return {
      days,
      text: `¡Venció hace ${Math.abs(days)}d!`,
      badgeClass: 'text-rose-700 bg-rose-50 border-rose-200 font-bold',
    };
  }
  if (days === 0) {
    return {
      days,
      text: '¡Vence HOY!',
      badgeClass: 'text-rose-800 bg-rose-100 border-rose-300 font-bold animate-pulse',
    };
  }
  if (days <= 3) {
    return {
      days,
      text: `Vence en ${days}d`,
      badgeClass: 'text-amber-800 bg-amber-50 border-amber-300 font-semibold',
    };
  }
  if (days <= 7) {
    return {
      days,
      text: `Vence en ${days}d`,
      badgeClass: 'text-yellow-800 bg-yellow-50 border-yellow-200',
    };
  }
  return {
    days,
    text: `En ${days} días`,
    badgeClass: 'text-slate-700 bg-slate-100 border-slate-200',
  };
}

export interface CountryFinancialSummary {
  country: SupportedCountry;
  totalDebtNative: number;
  totalDebtConsolidated: number;
  totalCheckingNative: number;
  totalCheckingConsolidated: number;
  cardsCount: number;
  accountsCount: number;
}

export function calculateSummary(
  cards: CreditCard[], 
  checkingAccounts: CheckingAccount[],
  baseCurrency: string = 'USD',
  rates: ExchangeRates = DEFAULT_EXCHANGE_RATES
) {
  // Consolidated totals in baseCurrency
  const consolidatedTotalDebt = cards.reduce((sum, c) => {
    const converted = convertCurrency(Number(c.currentBalance) || 0, c.currency || 'USD', baseCurrency, rates);
    return sum + converted;
  }, 0);

  const consolidatedTotalMinPayment = cards.reduce((sum, c) => {
    const converted = convertCurrency(Number(c.minPayment) || 0, c.currency || 'USD', baseCurrency, rates);
    return sum + converted;
  }, 0);

  const consolidatedTotalNoInterestPayment = cards.reduce((sum, c) => {
    const converted = convertCurrency(Number(c.noInterestPayment) || 0, c.currency || 'USD', baseCurrency, rates);
    return sum + converted;
  }, 0);

  const consolidatedTotalCheckingBalance = checkingAccounts.reduce((sum, a) => {
    const converted = convertCurrency(Number(a.balance) || 0, a.currency || 'USD', baseCurrency, rates);
    return sum + converted;
  }, 0);

  // Breakdown by individual currency (En su propia moneda)
  const currencyMap = new Map<string, CurrencyBreakdown>();

  cards.forEach((c) => {
    const curr = (c.currency || 'USD').toUpperCase();
    if (!currencyMap.has(curr)) {
      currencyMap.set(curr, {
        currency: curr,
        totalDebt: 0,
        totalNoInterestPayment: 0,
        totalMinPayment: 0,
        totalCheckingBalance: 0,
        cardCount: 0,
      });
    }
    const item = currencyMap.get(curr)!;
    item.totalDebt += Number(c.currentBalance) || 0;
    item.totalNoInterestPayment += Number(c.noInterestPayment) || 0;
    item.totalMinPayment += Number(c.minPayment) || 0;
    item.cardCount += 1;
  });

  checkingAccounts.forEach((a) => {
    const curr = (a.currency || 'USD').toUpperCase();
    if (!currencyMap.has(curr)) {
      currencyMap.set(curr, {
        currency: curr,
        totalDebt: 0,
        totalNoInterestPayment: 0,
        totalMinPayment: 0,
        totalCheckingBalance: 0,
        cardCount: 0,
      });
    }
    const item = currencyMap.get(curr)!;
    item.totalCheckingBalance += Number(a.balance) || 0;
  });

  const currencyBreakdown = Array.from(currencyMap.values()).sort((a, b) => b.totalDebt - a.totalDebt);

  // Breakdown by Country (México vs USA)
  const countries: SupportedCountry[] = ['México', 'USA'];
  const countryBreakdown: Record<SupportedCountry, CountryFinancialSummary> = {
    'México': {
      country: 'México',
      totalDebtNative: 0,
      totalDebtConsolidated: 0,
      totalCheckingNative: 0,
      totalCheckingConsolidated: 0,
      cardsCount: 0,
      accountsCount: 0,
    },
    'USA': {
      country: 'USA',
      totalDebtNative: 0,
      totalDebtConsolidated: 0,
      totalCheckingNative: 0,
      totalCheckingConsolidated: 0,
      cardsCount: 0,
      accountsCount: 0,
    },
  };

  cards.forEach((c) => {
    const countryKey: SupportedCountry = (c.country === 'USA' || c.country as any === 'Estados Unidos') ? 'USA' : 'México';
    const entry = countryBreakdown[countryKey];
    entry.cardsCount += 1;
    entry.totalDebtNative += Number(c.currentBalance) || 0;
    entry.totalDebtConsolidated += convertCurrency(Number(c.currentBalance) || 0, c.currency || 'USD', baseCurrency, rates);
  });

  checkingAccounts.forEach((a) => {
    const countryKey: SupportedCountry = (a.country === 'USA' || a.country as any === 'Estados Unidos') ? 'USA' : 'México';
    const entry = countryBreakdown[countryKey];
    entry.accountsCount += 1;
    entry.totalCheckingNative += Number(a.balance) || 0;
    entry.totalCheckingConsolidated += convertCurrency(Number(a.balance) || 0, a.currency || 'USD', baseCurrency, rates);
  });

  // Deficit or Surplus against No Interest Payment
  const netCoverage = consolidatedTotalCheckingBalance - consolidatedTotalNoInterestPayment;
  const coveragePercent = consolidatedTotalNoInterestPayment > 0 
    ? Math.min(100, Math.round((consolidatedTotalCheckingBalance / consolidatedTotalNoInterestPayment) * 100))
    : 100;

  // Expiring 0% APR cards count within 60 days
  const expiringZeroAprCards = cards.filter(c => {
    if (!c.zeroAprEndDate) return false;
    const days = getDaysDifference(c.zeroAprEndDate);
    return days !== null && days >= 0 && days <= 60;
  });

  return {
    totalDebt: consolidatedTotalDebt,
    totalMinPayment: consolidatedTotalMinPayment,
    totalNoInterestPayment: consolidatedTotalNoInterestPayment,
    totalCheckingBalance: consolidatedTotalCheckingBalance,
    netCoverage,
    coveragePercent,
    expiringZeroAprCardsCount: expiringZeroAprCards.length,
    cardsCount: cards.length,
    accountsCount: checkingAccounts.length,
    currencyBreakdown,
    countryBreakdown,
  };
}
