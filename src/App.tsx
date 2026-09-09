import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { FinancialCharts } from './components/FinancialCharts';
import { CardsTable } from './components/CardsTable';
import { CheckingAccountsTable } from './components/CheckingAccountsTable';
import { CardModal } from './components/CardModal';
import { AccountModal } from './components/AccountModal';
import { CsvModal } from './components/CsvModal';
import { AiStrategyModal } from './components/AiStrategyModal';
import { ProjectBackupModal } from './components/ProjectBackupModal';

import { CreditCard, CheckingAccount, FinancialProjectData, VersionSnapshot, ExchangeRates } from './types';
import { loadProjectData, saveProjectData, loadSnapshots } from './utils/storage';
import { calculateSummary, DEFAULT_EXCHANGE_RATES } from './utils/calculations';
import { useAuth } from './context/AuthContext';
import { saveProjectToFirestore, loadProjectFromFirestore } from './utils/cloudStorage';
import { Check, Sparkles, Download, ArrowUpRight, BarChart2, Table as TableIcon } from 'lucide-react';

export default function App() {
  const { user } = useAuth();
  const [projectData, setProjectData] = useState<FinancialProjectData>(() => loadProjectData());
  const [snapshots, setSnapshots] = useState<VersionSnapshot[]>(() => loadSnapshots());
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(
    () => projectData.exchangeRates || DEFAULT_EXCHANGE_RATES
  );

  // Cloud sync states
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);
  const [cloudInitialLoaded, setCloudInitialLoaded] = useState(false);

  // Modals state
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<CreditCard | null>(null);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<CheckingAccount | null>(null);

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // View preferences
  const [showCharts, setShowCharts] = useState(true);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync with Firestore when user logs in or mounts
  useEffect(() => {
    let isMounted = true;

    async function syncInitialCloudData() {
      if (!user) {
        setCloudInitialLoaded(false);
        return;
      }

      try {
        setCloudSyncStatus('saving');
        const remoteData = await loadProjectFromFirestore(user.uid);
        if (!isMounted) return;

        if (remoteData) {
          setProjectData(remoteData);
          if (remoteData.exchangeRates) {
            setExchangeRates(remoteData.exchangeRates);
          }
          setCloudSyncStatus('saved');
          setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          showToast(`Sincronizado con tu cuenta de Google (${user.email})`);
        } else {
          // First time logging in: backup current local data to Google Cloud
          await saveProjectToFirestore(user.uid, projectData);
          setCloudSyncStatus('saved');
          setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          showToast(`Proyecto guardado en tu cuenta de Google (${user.email})`);
        }
        setCloudInitialLoaded(true);
      } catch (err) {
        console.error('Error sincronizando con Google Cloud:', err);
        if (isMounted) setCloudSyncStatus('error');
      }
    }

    syncInitialCloudData();

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Sync to local storage and debounce auto-save to Firestore if logged in
  useEffect(() => {
    saveProjectData(projectData);

    if (user && cloudInitialLoaded) {
      setCloudSyncStatus('saving');
      const timer = setTimeout(async () => {
        try {
          await saveProjectToFirestore(user.uid, projectData);
          setCloudSyncStatus('saved');
          setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch (e) {
          console.error('Error auto-guardando en la nube:', e);
          setCloudSyncStatus('error');
        }
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [projectData, user, cloudInitialLoaded]);

  // Manual save trigger for Google Cloud
  const handleManualSaveToCloud = async () => {
    if (!user) {
      setIsBackupModalOpen(true);
      return;
    }
    setCloudSyncStatus('saving');
    try {
      await saveProjectToFirestore(user.uid, projectData);
      setCloudSyncStatus('saved');
      setLastCloudSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast('Proyecto guardado exitosamente en tu cuenta de Google');
    } catch (err) {
      setCloudSyncStatus('error');
      showToast('Error al guardar en Google Cloud');
    }
  };

  // Calculations with currency and exchange rates
  const summary = calculateSummary(
    projectData.cards,
    projectData.checkingAccounts,
    projectData.baseCurrency,
    exchangeRates
  );

  // Exchange rate handler
  const handleUpdateExchangeRate = (rateUsdMxn: number) => {
    const updatedRates: ExchangeRates = {
      ...exchangeRates,
      USD_MXN: rateUsdMxn,
    };
    setExchangeRates(updatedRates);
    setProjectData((prev) => ({
      ...prev,
      exchangeRates: updatedRates,
    }));
    showToast(`Tipo de cambio actualizado: 1 USD = $${rateUsdMxn.toFixed(2)} MXN`);
  };

  // Card Handlers
  const handleOpenNewCard = () => {
    setCardToEdit(null);
    setIsCardModalOpen(true);
  };

  const handleEditCard = (card: CreditCard) => {
    setCardToEdit(card);
    setIsCardModalOpen(true);
  };

  const handleSaveCard = (savedCard: CreditCard) => {
    setProjectData((prev) => {
      const exists = prev.cards.some((c) => c.id === savedCard.id);
      const updatedCards = exists
        ? prev.cards.map((c) => (c.id === savedCard.id ? savedCard : c))
        : [savedCard, ...prev.cards];
      return {
        ...prev,
        cards: updatedCards,
      };
    });
    showToast(cardToEdit ? 'Tarjeta actualizada' : 'Tarjeta registrada con éxito');
  };

  const handleDeleteCard = (id: string) => {
    setProjectData((prev) => ({
      ...prev,
      cards: prev.cards.filter((c) => c.id !== id),
    }));
    showToast('Tarjeta eliminada');
  };

  const handleDuplicateCard = (card: CreditCard) => {
    const duplicated: CreditCard = {
      ...card,
      id: 'card-' + Date.now(),
      name: `${card.name} (Copia)`,
      updatedAt: new Date().toISOString(),
    };
    setProjectData((prev) => ({
      ...prev,
      cards: [duplicated, ...prev.cards],
    }));
    showToast('Tarjeta duplicada');
  };

  const handleImportCardsFromCsv = (newCards: CreditCard[]) => {
    setProjectData((prev) => ({
      ...prev,
      cards: [...newCards, ...prev.cards],
    }));
    showToast(`Se importaron ${newCards.length} tarjetas desde el archivo CSV`);
  };

  // Account Handlers
  const handleOpenNewAccount = () => {
    setAccountToEdit(null);
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (account: CheckingAccount) => {
    setAccountToEdit(account);
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = (savedAccount: CheckingAccount) => {
    setProjectData((prev) => {
      const exists = prev.checkingAccounts.some((a) => a.id === savedAccount.id);
      const updatedAccounts = exists
        ? prev.checkingAccounts.map((a) => (a.id === savedAccount.id ? savedAccount : a))
        : [savedAccount, ...prev.checkingAccounts];
      return {
        ...prev,
        checkingAccounts: updatedAccounts,
      };
    });
    showToast(accountToEdit ? 'Cuenta bancaria actualizada' : 'Cuenta corriente agregada');
  };

  const handleDeleteAccount = (id: string) => {
    setProjectData((prev) => ({
      ...prev,
      checkingAccounts: prev.checkingAccounts.filter((a) => a.id !== id),
    }));
    showToast('Cuenta bancaria eliminada');
  };

  // Currency & Project Restore Handlers
  const handleChangeCurrency = (curr: string) => {
    setProjectData((prev) => ({
      ...prev,
      baseCurrency: curr,
    }));
    showToast(`Moneda consolidada cambiada a ${curr}`);
  };

  const handleRestoreProject = (restored: FinancialProjectData) => {
    setProjectData(restored);
    if (restored.exchangeRates) {
      setExchangeRates(restored.exchangeRates);
    }
    showToast('¡Proyecto y datos restaurados exitosamente!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        onOpenNewCard={handleOpenNewCard}
        onOpenNewAccount={handleOpenNewAccount}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        baseCurrency={projectData.baseCurrency}
        onChangeCurrency={handleChangeCurrency}
        expiringZeroAprCount={summary.expiringZeroAprCardsCount}
        cloudSyncStatus={cloudSyncStatus}
        lastCloudSyncTime={lastCloudSyncTime}
        onManualSaveToCloud={handleManualSaveToCloud}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Summaries with Multi-currency, Native Currency and Country Views */}
        <SummaryCards
          totalDebt={summary.totalDebt}
          totalNoInterestPayment={summary.totalNoInterestPayment}
          totalMinPayment={summary.totalMinPayment}
          totalCheckingBalance={summary.totalCheckingBalance}
          netCoverage={summary.netCoverage}
          coveragePercent={summary.coveragePercent}
          expiringZeroAprCardsCount={summary.expiringZeroAprCardsCount}
          baseCurrency={projectData.baseCurrency}
          currencyBreakdown={summary.currencyBreakdown}
          countryBreakdown={summary.countryBreakdown}
          exchangeRates={exchangeRates}
          onUpdateExchangeRate={handleUpdateExchangeRate}
          onChangeBaseCurrency={handleChangeCurrency}
        />

        {/* Action Banner for AI Prompt Generator */}
        <div className="rounded-xl p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 text-white shadow-xs border border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-400/30">
                Estrategia con IA
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Generador de Archivo e Instrucciones para IA
              </h3>
            </div>
            <p className="text-xs text-indigo-200 max-w-2xl font-normal leading-relaxed">
              Exporta un archivo con tus fechas de corte, promociones a 0% APR en México y USA, y fondos disponibles listo para que ChatGPT, Claude o Gemini te formulen un calendario de pagos óptimo día por día.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              id="banner-open-ai-btn"
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-indigo-900 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Abrir Asesor de IA</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </div>

        {/* Visualizations Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Gráficos & Métricas Visuales
              </h2>
            </div>
            <button
              id="toggle-charts-visibility-btn"
              type="button"
              onClick={() => setShowCharts(!showCharts)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              {showCharts ? 'Ocultar Gráficos' : 'Mostrar Gráficos'}
            </button>
          </div>

          {showCharts && (
            <FinancialCharts
              cards={projectData.cards}
              accounts={projectData.checkingAccounts}
              baseCurrency={projectData.baseCurrency}
              rates={exchangeRates}
            />
          )}
        </div>

        {/* Primary Credit Cards Table */}
        <CardsTable
          cards={projectData.cards}
          onEditCard={handleEditCard}
          onDeleteCard={handleDeleteCard}
          onDuplicateCard={handleDuplicateCard}
          onOpenNewCard={handleOpenNewCard}
          baseCurrency={projectData.baseCurrency}
          exchangeRates={exchangeRates}
        />

        {/* Checking Accounts Table */}
        <CheckingAccountsTable
          accounts={projectData.checkingAccounts}
          onEditAccount={handleEditAccount}
          onDeleteAccount={handleDeleteAccount}
          onOpenNewAccount={handleOpenNewAccount}
          baseCurrency={projectData.baseCurrency}
          exchangeRates={exchangeRates}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Gestor de Finanzas y Tarjetas de Crédito • México & USA</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsBackupModalOpen(true)}
              className="hover:text-indigo-600 font-medium transition-colors"
            >
              Copia de Seguridad & GitHub
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsCsvModalOpen(true)}
              className="hover:text-emerald-700 font-medium transition-colors"
            >
              Importar / Exportar CSV
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        onSave={handleSaveCard}
        cardToEdit={cardToEdit}
        baseCurrency={projectData.baseCurrency}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={handleSaveAccount}
        accountToEdit={accountToEdit}
        baseCurrency={projectData.baseCurrency}
      />

      <CsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportCards={handleImportCardsFromCsv}
        cards={projectData.cards}
        checkingAccounts={projectData.checkingAccounts}
      />

      <AiStrategyModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        cards={projectData.cards}
        checkingAccounts={projectData.checkingAccounts}
        baseCurrency={projectData.baseCurrency}
        exchangeRates={exchangeRates}
      />

      <ProjectBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        projectData={projectData}
        onRestoreProject={handleRestoreProject}
        snapshots={snapshots}
        onUpdateSnapshots={(updated) => setSnapshots(updated)}
        cloudSyncStatus={cloudSyncStatus}
        lastCloudSyncTime={lastCloudSyncTime}
        onRefreshCloud={handleManualSaveToCloud}
      />
    </div>
  );
}
