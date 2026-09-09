export type SupportedCountry = 'México' | 'USA';

export type SupportedCurrency = 'USD' | 'MXN' | 'EUR' | 'CAD' | 'GBP';

export interface ExchangeRates {
  USD_MXN: number; // e.g. 18.50 (1 USD = 18.50 MXN)
  EUR_USD: number; // e.g. 1.08
  CAD_USD: number; // e.g. 0.74
  GBP_USD: number; // e.g. 1.30
}

export interface CreditCard {
  id: string;
  name: string; // Nombre de la tarjeta o banco
  country: SupportedCountry; // Restringido a 'México' o 'USA'
  cutOffDay: number; // Día del mes de corte (1-31)
  paymentDueDate: string; // Fecha límite de pago próxima (YYYY-MM-DD)
  zeroAprEndDate?: string; // Fecha en que acaba su 0% APR (YYYY-MM-DD o vacío)
  openingDate?: string; // Fecha de apertura (YYYY-MM-DD)
  minPayment: number; // Cuánto pago mínimo (en su propia moneda)
  noInterestPayment: number; // Pago para no generar intereses (en su propia moneda)
  currentBalance: number; // Cuánto debo (saldo deudor actual en su propia moneda)
  creditLimit?: number; // Límite de crédito asignado (opcional)
  aprRate?: number; // Tasa de interés anual regular (%) posterior a promo
  currency: string; // MXN, USD, EUR, CAD, GBP, etc.
  notes?: string;
  updatedAt: string;
}

export interface CheckingAccount {
  id: string;
  name: string; // Nombre del banco / cuenta corriente
  country: SupportedCountry; // Restringido a 'México' o 'USA'
  accountType?: 'corriente' | 'ahorros' | 'nomina';
  balance: number; // Saldo disponible (en su propia moneda)
  monthlyIncome?: number; // Ingresos o depósitos proyectados (en su propia moneda)
  currency: string; // MXN, USD, etc.
  notes?: string;
  updatedAt: string;
}

export interface CurrencyBreakdown {
  currency: string;
  totalDebt: number;
  totalNoInterestPayment: number;
  totalMinPayment: number;
  totalCheckingBalance: number;
  cardCount: number;
}

export interface VersionSnapshot {
  id: string;
  name: string;
  timestamp: string;
  cardsCount: number;
  totalDebt: number;
  data: FinancialProjectData;
}

export interface FinancialProjectData {
  version: string;
  lastUpdated: string;
  projectName: string;
  baseCurrency: string; // Moneda de consolidación global ('USD' o 'MXN', etc.)
  exchangeRates: ExchangeRates;
  cards: CreditCard[];
  checkingAccounts: CheckingAccount[];
}

