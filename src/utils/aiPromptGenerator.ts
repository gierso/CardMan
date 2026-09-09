import { CreditCard, CheckingAccount, ExchangeRates } from '../types';
import { calculateSummary, getZeroAprStatus, getPaymentDueStatus, DEFAULT_EXCHANGE_RATES, formatMoney } from './calculations';

export function generateAiPromptDocument(
  cards: CreditCard[],
  checkingAccounts: CheckingAccount[],
  userNotes?: string,
  baseCurrency: string = 'USD',
  exchangeRates: ExchangeRates = DEFAULT_EXCHANGE_RATES
): string {
  const summary = calculateSummary(cards, checkingAccounts, baseCurrency, exchangeRates);
  const todayStr = new Date().toISOString().split('T')[0];

  const cardsMarkdown = cards.map((c, i) => {
    const zeroApr = getZeroAprStatus(c);
    const due = getPaymentDueStatus(c.paymentDueDate);
    const flag = (c.country === 'USA' || (c.country as any) === 'Estados Unidos') ? '🇺🇸 USA' : '🇲🇽 México';
    return `### ${i + 1}. ${c.name} (${flag})
- **Moneda de la Tarjeta:** ${c.currency}
- **Deuda Actual (Cuánto debo):** ${formatMoney(c.currentBalance, c.currency)}
- **Pago para no generar intereses:** ${formatMoney(c.noInterestPayment, c.currency)}
- **Pago Mínimo Obligatorio:** ${formatMoney(c.minPayment, c.currency)}
- **Fecha Límite de Pago:** ${c.paymentDueDate} (${due.text})
- **Día de Corte:** Día ${c.cutOffDay} de cada mes
- **Fin de Promoción 0% APR:** ${c.zeroAprEndDate ? `${c.zeroAprEndDate} (${zeroApr.statusText})` : 'No aplica / Sin promoción 0%'}
${zeroApr.hasZeroApr && zeroApr.monthlyPaymentNeededToClear > 0 ? `- **Pago mensual sugerido para liquidar antes del fin de 0% APR:** ${formatMoney(zeroApr.monthlyPaymentNeededToClear, c.currency)}/mes` : ''}
- **Fecha de Apertura:** ${c.openingDate || 'No especificada'}
- **Tasa APR Regular:** ${c.aprRate ? `${c.aprRate}% anual` : 'No especificada'}
- **Límite de Crédito:** ${c.creditLimit ? formatMoney(c.creditLimit, c.currency) : 'No especificado'}
${c.notes ? `- **Notas del usuario:** ${c.notes}` : ''}
`;
  }).join('\n');

  const accountsMarkdown = checkingAccounts.map((a, i) => {
    const flag = (a.country === 'USA' || (a.country as any) === 'Estados Unidos') ? '🇺🇸 USA' : '🇲🇽 México';
    return `### ${i + 1}. ${a.name} (${flag})
- **Moneda de la Cuenta:** ${a.currency}
- **Saldo Disponible Actual:** ${formatMoney(a.balance, a.currency)}
- **Tipo de Cuenta:** ${a.accountType || 'Cuenta Corriente'}
${a.monthlyIncome ? `- **Ingreso / Depósito Mensual Proyectado:** ${formatMoney(a.monthlyIncome, a.currency)}` : ''}
${a.notes ? `- **Notas:** ${a.notes}` : ''}
`;
  }).join('\n');

  const currencyBreakdownMarkdown = summary.currencyBreakdown.map(cb => {
    return `- **${cb.currency}:** Deuda Total = ${formatMoney(cb.totalDebt, cb.currency)} | Pago No Interés = ${formatMoney(cb.totalNoInterestPayment, cb.currency)} | Fondos en Cuentas = ${formatMoney(cb.totalCheckingBalance, cb.currency)}`;
  }).join('\n');

  return `# PROMPT Y DATOS FINANCIEROS PARA IA: ESTRATEGIA DE PAGOS EFICIENTE
**Fecha de generación:** ${todayStr}
**Objetivo:** Elaborar un plan táctico de liquidación de deudas, evitando intereses, recargos y maximizando el uso del efectivo disponible en México y Estados Unidos.

---

## ROL Y CONTEXTO PARA LA IA
Actúa como un **Planificador Financiero Certificado (CFP)** y especialista de alto nivel en optimización de deudas de tarjetas de crédito y flujo de efectivo binacional (México y Estados Unidos).

Tu tarea es analizar exhaustivamente la información financiera multi-moneda (MXN y USD) que se detalla a continuación y formular un **Plan de Pago Inteligente y Calendario de Ejecución**.

---

## REGLAS CRÍTICAS DE OPTIMIZACIÓN FINANCIERA
1. **Regla de Oro (Evitar Intereses):** El objetivo primordial es pagar el "Pago para no generar intereses" en todas las tarjetas posibles.
2. **Salvaguarda de 0% APR (¡Prioridad Alta!):** Si una tarjeta tiene una fecha de terminación de 0% APR cercana (menos de 60 a 90 días), debes calcular el aporte mensual exacto para liquidarla a tiempo en su moneda correspondiente y evitar que el saldo restante comience a generar intereses a tasas elevadas (del 25% al 60%+).
3. **Mínimo Innegociable:** Jamás permitir que una tarjeta caiga en mora. Si los fondos no alcanzan para liquidar todo, el pago mínimo debe cubrirse puntualmente antes de la fecha límite para evitar cargos por mora y daño a Buró de Crédito (México) o FICO Score (USA).
4. **Respeto a la Moneda y Fondos Locales:** Considera que las cuentas en pesos mexicanos (MXN) deben pagar preferentemente deudas en México, y las cuentas en dólares (USD) para deudas en USA, a fin de evitar pérdidas por comisiones cambiarias.
5. **Asignación del Excedente (Método Avalancha):** Con los fondos restantes en la cuenta corriente tras cubrir los mínimos y las cuotas críticas de 0% APR, recomienda a qué tarjeta abonar cada peso o dólar sobrante.
6. **Tipo de Cambio de Referencia:** 1 USD = $${exchangeRates.USD_MXN.toFixed(2)} MXN.

---

## RESUMEN FINANCIERO CONSOLIDADO (${baseCurrency})
- **Deuda Total Acumulada (Consolidada en ${baseCurrency}):** ${formatMoney(summary.totalDebt, baseCurrency)}
- **Total para No Generar Intereses este ciclo:** ${formatMoney(summary.totalNoInterestPayment, baseCurrency)}
- **Suma de Pagos Mínimos Obligatorios:** ${formatMoney(summary.totalMinPayment, baseCurrency)}
- **Saldo Total Disponible en Cuentas Corrientes:** ${formatMoney(summary.totalCheckingBalance, baseCurrency)}
- **Balance Neto Inmediato:** ${summary.netCoverage >= 0 ? `SUPERÁVIT de +${formatMoney(summary.netCoverage, baseCurrency)}` : `DÉFICIT de -${formatMoney(Math.abs(summary.netCoverage), baseCurrency)}`}
- **Tarjetas con 0% APR por vencer en ≤ 60 días:** ${summary.expiringZeroAprCardsCount}

### Totales desglosados en su propia moneda:
${currencyBreakdownMarkdown}

${userNotes ? `\n> **Nota personalizada del usuario:**\n> ${userNotes}\n` : ''}

---

## CUENTAS CORRIENTES Y FONDOS DISPONIBLES (MÉXICO Y USA)
${accountsMarkdown || 'No se han registrado cuentas corrientes todavía.'}

---

## TARJETAS DE CRÉDITO REGISTRADAS
${cardsMarkdown || 'No se han registrado tarjetas de crédito todavía.'}

---

## FORMATO DE RESPUESTA QUE DEBE PROPORCIONAR LA IA

Por favor, estructura tu respuesta con los siguientes apartados:

### 1. Diagnóstico de Salud Financiera & Semáforo de Riesgo
- Estado general (Superávit vs Déficit respecto a los pagos del mes en MXN y USD).
- Tarjetas en semáforo rojo (0% APR próximo a caducar o fechas de pago en los próximos 7 días).

### 2. Plan de Asignación Inmediata de Fondos (Paso a Paso por País y Moneda)
- Distribución exacta de los fondos disponibles en México (MXN) y en USA (USD).
- Indicación explícita de qué monto pagar en cada tarjeta (¿Mínimo? ¿Para no generar intereses? ¿O abono extraordinario?).

### 3. Calendario Táctico de Fechas
- Cronograma ordenado por fecha límite de pago para este ciclo mensual, indicando la fecha exacta en que se debe programar la transferencia bancaria.

### 4. Estrategia de Liquidación para Tarjetas con 0% APR
- Cuota mensual sugerida para cada tarjeta con 0% APR para llegar a saldo $0 antes del vencimiento de la promoción.

### 5. Recomendaciones de Ahorro y Hábitos Crediticios
- Consejos aplicables a las fechas de corte y manejo de compras para maximizar días de financiamiento sin costo.
`;
}

export function downloadAiPromptFile(
  cards: CreditCard[],
  checkingAccounts: CheckingAccount[],
  userNotes?: string,
  extension: 'md' | 'txt' = 'md',
  baseCurrency: string = 'USD',
  exchangeRates: ExchangeRates = DEFAULT_EXCHANGE_RATES
): void {
  const content = generateAiPromptDocument(cards, checkingAccounts, userNotes, baseCurrency, exchangeRates);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `instrucciones_ia_pagos_eficientes_${dateStr}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
