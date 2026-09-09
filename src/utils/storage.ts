import { CreditCard, CheckingAccount, FinancialProjectData, VersionSnapshot, SupportedCountry } from '../types';
import { DEFAULT_EXCHANGE_RATES } from './calculations';

const STORAGE_KEY = 'vibe_finances_project_data';
const SNAPSHOTS_KEY = 'vibe_finances_snapshots';


export const INITIAL_SAMPLE_CARDS: CreditCard[] = [
  {
    id: 'card-1',
    name: 'Chase Sapphire Preferred',
    country: 'USA',
    cutOffDay: 18,
    paymentDueDate: '2026-09-25',
    zeroAprEndDate: '',
    openingDate: '2023-04-10',
    minPayment: 85,
    noInterestPayment: 1450.50,
    currentBalance: 1450.50,
    creditLimit: 12000,
    aprRate: 27.49,
    currency: 'USD',
    notes: 'Tarjeta principal para viajes y compras en USA.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'card-2',
    name: 'BBVA Oro Crédito',
    country: 'México',
    cutOffDay: 5,
    paymentDueDate: '2026-09-28',
    zeroAprEndDate: '2026-11-15',
    openingDate: '2024-01-20',
    minPayment: 1200,
    noInterestPayment: 11500,
    currentBalance: 32500,
    creditLimit: 75000,
    aprRate: 36.5,
    currency: 'MXN',
    notes: 'Promo 0% APR termina el 15 de noviembre. Urge liquidar antes.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'card-3',
    name: 'Santander Fiesta Rewards',
    country: 'México',
    cutOffDay: 12,
    paymentDueDate: '2026-10-02',
    zeroAprEndDate: '2026-10-05',
    openingDate: '2023-09-15',
    minPayment: 750,
    noInterestPayment: 8400,
    currentBalance: 16800,
    creditLimit: 50000,
    aprRate: 42.0,
    currency: 'MXN',
    notes: '¡Alerta! Promo 0% termina en pocos días.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'card-4',
    name: 'Apple Card Goldman Sachs',
    country: 'USA',
    cutOffDay: 30,
    paymentDueDate: '2026-10-15',
    zeroAprEndDate: '',
    openingDate: '2022-08-01',
    minPayment: 35,
    noInterestPayment: 520,
    currentBalance: 520,
    creditLimit: 8500,
    aprRate: 24.24,
    currency: 'USD',
    notes: 'Cashback diario, pagar siempre completo.',
    updatedAt: new Date().toISOString(),
  }
];

export const INITIAL_SAMPLE_ACCOUNTS: CheckingAccount[] = [
  {
    id: 'acc-1',
    name: 'Chase Checking Principal',
    country: 'USA',
    accountType: 'corriente',
    balance: 3850.00,
    monthlyIncome: 4500.00,
    currency: 'USD',
    notes: 'Fondo disponible en USA para pagos recurrentes de tarjetas.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc-2',
    name: 'BBVA Nómina / Débito',
    country: 'México',
    accountType: 'nomina',
    balance: 35000.00,
    monthlyIncome: 42000.00,
    currency: 'MXN',
    notes: 'Cuenta de nómina y fondos en México.',
    updatedAt: new Date().toISOString(),
  }
];

export function loadProjectData(): FinancialProjectData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.cards) && Array.isArray(parsed.checkingAccounts)) {
        // Normalize countries to 'México' or 'USA'
        const normalizedCards = parsed.cards.map((c: any) => ({
          ...c,
          country: (c.country === 'Estados Unidos' || c.country === 'USA') ? 'USA' : 'México',
          currency: c.currency || 'USD',
        }));
        const normalizedAccounts = parsed.checkingAccounts.map((a: any) => ({
          ...a,
          country: (a.country === 'Estados Unidos' || a.country === 'USA') ? 'USA' : 'México',
          currency: a.currency || 'USD',
        }));

        return {
          version: parsed.version || '1.1.0',
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
          projectName: parsed.projectName || 'Mis Finanzas Personales',
          baseCurrency: parsed.baseCurrency || 'USD',
          exchangeRates: parsed.exchangeRates || DEFAULT_EXCHANGE_RATES,
          cards: normalizedCards,
          checkingAccounts: normalizedAccounts,
        };
      }
    }
  } catch (e) {
    console.error('Error al cargar datos locales:', e);
  }

  return {
    version: '1.1.0',
    lastUpdated: new Date().toISOString(),
    projectName: 'Mis Finanzas Personales',
    baseCurrency: 'USD',
    exchangeRates: DEFAULT_EXCHANGE_RATES,
    cards: INITIAL_SAMPLE_CARDS,
    checkingAccounts: INITIAL_SAMPLE_ACCOUNTS,
  };
}

export function saveProjectData(data: FinancialProjectData): void {
  try {
    const updated = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error al guardar datos:', e);
  }
}

export function exportProjectToJson(data: FinancialProjectData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `finanzas_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function loadSnapshots(): VersionSnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error al cargar snapshots:', e);
  }
  return [];
}

export function saveSnapshot(name: string, data: FinancialProjectData): VersionSnapshot[] {
  const snapshots = loadSnapshots();
  const totalDebt = data.cards.reduce((sum, c) => sum + (Number(c.currentBalance) || 0), 0);
  const newSnapshot: VersionSnapshot = {
    id: 'snap-' + Date.now(),
    name: name.trim() || `Versión ${new Date().toLocaleDateString()}`,
    timestamp: new Date().toISOString(),
    cardsCount: data.cards.length,
    totalDebt,
    data: JSON.parse(JSON.stringify(data)),
  };

  const updated = [newSnapshot, ...snapshots].slice(0, 20); // Keep max 20
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteSnapshot(id: string): VersionSnapshot[] {
  const snapshots = loadSnapshots();
  const filtered = snapshots.filter(s => s.id !== id);
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(filtered));
  return filtered;
}
