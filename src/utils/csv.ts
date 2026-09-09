import Papa from 'papaparse';
import { CreditCard, CheckingAccount, SupportedCountry, SupportedCurrency } from '../types';

export function exportCardsToCsv(cards: CreditCard[]): void {
  const data = cards.map(c => ({
    'Nombre Tarjeta o Banco': c.name,
    'País': c.country,
    'Moneda': c.currency || (c.country === 'México' ? 'MXN' : 'USD'),
    'Día de Corte': c.cutOffDay,
    'Fecha Límite de Pago': c.paymentDueDate,
    'Fin de 0% APR': c.zeroAprEndDate || '',
    'Fecha de Apertura': c.openingDate || '',
    'Cuánto Pago Mínimo': c.minPayment,
    'Pago para no Generar Intereses': c.noInterestPayment,
    'Cuánto Debo (Saldo)': c.currentBalance,
    'Límite de Crédito': c.creditLimit || '',
    'Tasa APR Anual %': c.aprRate || '',
    'Notas': c.notes || '',
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `tarjetas_credito_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAccountsToCsv(accounts: CheckingAccount[]): void {
  const data = accounts.map(a => ({
    'Nombre Banco o Cuenta': a.name,
    'País': a.country,
    'Moneda': a.currency || (a.country === 'México' ? 'MXN' : 'USD'),
    'Tipo de Cuenta': a.accountType || 'corriente',
    'Saldo Disponible': a.balance,
    'Ingreso Mensual Previsto': a.monthlyIncome || 0,
    'Notas': a.notes || '',
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `cuentas_corrientes_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadSampleCardsCsv(): void {
  const sample = [
    {
      'Nombre Tarjeta o Banco': 'BBVA Oro',
      'País': 'México',
      'Moneda': 'MXN',
      'Día de Corte': 12,
      'Fecha Límite de Pago': '2026-10-02',
      'Fin de 0% APR': '2026-12-15',
      'Fecha de Apertura': '2023-05-10',
      'Cuánto Pago Mínimo': 950.00,
      'Pago para no Generar Intereses': 6800.00,
      'Cuánto Debo (Saldo)': 32500.00,
      'Límite de Crédito': 65000.00,
      'Tasa APR Anual %': 48.0,
      'Notas': 'Tarjeta principal de gastos en México',
    },
    {
      'Nombre Tarjeta o Banco': 'Chase Freedom Unlimited',
      'País': 'USA',
      'Moneda': 'USD',
      'Día de Corte': 20,
      'Fecha Límite de Pago': '2026-10-15',
      'Fin de 0% APR': '2026-11-20',
      'Fecha de Apertura': '2023-11-01',
      'Cuánto Pago Mínimo': 45.00,
      'Pago para no Generar Intereses': 520.00,
      'Cuánto Debo (Saldo)': 1450.50,
      'Límite de Crédito': 8000.00,
      'Tasa APR Anual %': 24.99,
      'Notas': 'Liquidarla antes de noviembre para no perder el 0% APR',
    }
  ];

  const csv = Papa.unparse(sample);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla_tarjetas_mexico_usa.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Clean number helper
function parseNumeric(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Remove currency symbols, commas and whitespace
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Map CSV row to CreditCard with strict Mexico / USA and currency support
export function parseCardsCsv(csvText: string): { cards: CreditCard[]; errors: string[] } {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const cards: CreditCard[] = [];
  const errors: string[] = [];

  result.data.forEach((row, index) => {
    // Find fields with flexible matching (both Spanish and English keys)
    const keys = Object.keys(row);
    const findKey = (candidates: string[]) => {
      return keys.find(k => {
        const clean = k.toLowerCase().trim();
        return candidates.some(c => clean.includes(c));
      });
    };

    const nameKey = findKey(['nombre', 'tarjeta', 'banco', 'card', 'bank']);
    const countryKey = findKey(['país', 'pais', 'country', 'nacion']);
    const cutOffKey = findKey(['corte', 'cut']);
    const dueKey = findKey(['límite', 'limite', 'due', 'fechas de pago', 'fecha de pago', 'pago']);
    const zeroAprKey = findKey(['0 apr', '0%', 'cero apr', 'apr']);
    const openingKey = findKey(['apertura', 'open']);
    const minPayKey = findKey(['mínimo', 'minimo', 'min payment', 'cuánto pago mínimo']);
    const noInterestKey = findKey(['no generar', 'no interes', 'no interés', 'pago no', 'no-interest']);
    const balanceKey = findKey(['debo', 'saldo', 'balance', 'deuda', 'current']);
    const limitKey = findKey(['límite de crédito', 'limite de credito', 'credit limit', 'limite']);
    const rateKey = findKey(['tasa', 'apr rate', 'rate', 'porcentaje']);
    const currencyKey = findKey(['moneda', 'currency', 'divisa']);
    const notesKey = findKey(['notas', 'comentario', 'notes']);

    const name = (nameKey && row[nameKey]?.trim()) || `Tarjeta ${index + 1}`;
    
    // Normalize country strictly to 'México' | 'USA'
    const rawCountry = (countryKey && row[countryKey]?.trim()) || '';
    const cleanCountry = rawCountry.toLowerCase();
    let country: SupportedCountry = 'México';
    if (cleanCountry.includes('usa') || cleanCountry.includes('united states') || cleanCountry.includes('estados unidos') || cleanCountry.includes('eeuu') || cleanCountry.includes('us')) {
      country = 'USA';
    } else {
      country = 'México';
    }

    const cutOffDay = cutOffKey ? parseInt(row[cutOffKey], 10) || 15 : 15;
    const paymentDueDate = (dueKey && row[dueKey]?.trim()) || new Date().toISOString().split('T')[0];
    const zeroAprEndDate = (zeroAprKey && row[zeroAprKey]?.trim()) || '';
    const openingDate = (openingKey && row[openingKey]?.trim()) || '';
    const minPayment = minPayKey ? parseNumeric(row[minPayKey]) : 0;
    const noInterestPayment = noInterestKey ? parseNumeric(row[noInterestKey]) : 0;
    const currentBalance = balanceKey ? parseNumeric(row[balanceKey]) : 0;
    const creditLimit = limitKey ? parseNumeric(row[limitKey]) : undefined;
    const aprRate = rateKey ? parseNumeric(row[rateKey]) : undefined;
    
    // Currency determination
    const rawCurrency = (currencyKey && row[currencyKey]?.trim()?.toUpperCase()) || '';
    let currency: SupportedCurrency = country === 'México' ? 'MXN' : 'USD';
    if (['USD', 'MXN', 'EUR', 'CAD', 'GBP'].includes(rawCurrency)) {
      currency = rawCurrency as SupportedCurrency;
    }

    const notes = (notesKey && row[notesKey]?.trim()) || '';

    cards.push({
      id: 'csv-card-' + Date.now() + '-' + index,
      name,
      country,
      cutOffDay: isNaN(cutOffDay) ? 15 : cutOffDay,
      paymentDueDate,
      zeroAprEndDate,
      openingDate,
      minPayment,
      noInterestPayment,
      currentBalance,
      creditLimit,
      aprRate,
      currency,
      notes,
      updatedAt: new Date().toISOString(),
    });
  });

  return { cards, errors };
}
