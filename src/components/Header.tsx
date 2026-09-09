import React, { useState } from 'react';
import { 
  CreditCard, 
  Sparkles, 
  FileSpreadsheet, 
  Plus, 
  GitBranch,
  ShieldAlert,
  Cloud,
  CloudCheck,
  RefreshCw,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

interface HeaderProps {
  onOpenNewCard: () => void;
  onOpenNewAccount: () => void;
  onOpenCsvModal: () => void;
  onOpenAiModal: () => void;
  onOpenBackupModal: () => void;
  baseCurrency: string;
  onChangeCurrency: (curr: string) => void;
  expiringZeroAprCount: number;
  cloudSyncStatus?: 'idle' | 'saving' | 'saved' | 'error';
  lastCloudSyncTime?: string | null;
  onManualSaveToCloud?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewCard,
  onOpenNewAccount,
  onOpenCsvModal,
  onOpenAiModal,
  onOpenBackupModal,
  baseCurrency,
  onChangeCurrency,
  expiringZeroAprCount,
  cloudSyncStatus = 'idle',
  lastCloudSyncTime,
  onManualSaveToCloud,
}) => {
  const { user, loading: authLoading, signInWithGoogle, logout } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & App Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <CreditCard className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Gestor de Finanzas & Tarjetas
              </h1>
              {expiringZeroAprCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <ShieldAlert className="w-3 h-3 text-amber-700" />
                  {expiringZeroAprCount} {expiringZeroAprCount === 1 ? 'promo 0% por vencer' : 'promos 0% por vencer'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Control de corte, pagos mínimos, 0% APR, cuentas corrientes y asesor de pago con IA
            </p>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Currency selector */}
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
            <span className="text-slate-400 text-[10px] uppercase">Moneda:</span>
            <select
              id="header-currency-selector"
              value={baseCurrency}
              onChange={(e) => onChangeCurrency(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-bold text-slate-900 text-xs"
            >
              <option value="USD">USD ($)</option>
              <option value="MXN">MXN ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="COP">COP ($)</option>
              <option value="CLP">CLP ($)</option>
              <option value="ARS">ARS ($)</option>
              <option value="PEN">PEN (S/)</option>
            </select>
          </div>

          {/* AI Strategy Button */}
          <button
            id="open-ai-modal-btn"
            type="button"
            onClick={onOpenAiModal}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all hover:shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>Asesor IA</span>
          </button>

          {/* CSV Import/Export */}
          <button
            id="open-csv-modal-btn"
            type="button"
            onClick={onOpenCsvModal}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Importar / Exportar CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV</span>
          </button>

          {/* Project Backup / Google Cloud */}
          <button
            id="open-backup-modal-btn"
            type="button"
            onClick={onOpenBackupModal}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Copias de seguridad y Google Cloud"
          >
            <Cloud className="w-3.5 h-3.5 text-indigo-600" />
            <span>Nube & Copias</span>
          </button>

          {/* Add Checking Account */}
          <button
            id="open-new-account-btn"
            type="button"
            onClick={onOpenNewAccount}
            className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">+ Cuenta</span>
          </button>

          {/* Add Card Button */}
          <button
            id="open-new-card-btn"
            type="button"
            onClick={onOpenNewCard}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tarjeta</span>
          </button>

          {/* Google Auth / User Account Section */}
          <div className="pl-1 border-l border-slate-200 ml-1 flex items-center">
            {authLoading ? (
              <div className="px-3 py-1.5 text-xs text-slate-400 font-medium animate-pulse">
                Verificando...
              </div>
            ) : user ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenBackupModal}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs transition-colors cursor-pointer"
                  title={`Conectado como ${user.email}. Haz clic para gestionar copias en la nube.`}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Usuario'}
                      className="w-5 h-5 rounded-full object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-slate-800 max-w-[110px] truncate leading-tight text-[11px]">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 leading-tight">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      {cloudSyncStatus === 'saving' ? 'Guardando...' : 'Nube activa'}
                    </span>
                  </div>
                </button>

                <button
                  id="google-logout-btn"
                  type="button"
                  onClick={logout}
                  title="Cerrar sesión de Google"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="google-signin-btn"
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-2 shadow-2xs transition-all active:scale-95"
                title="Inicia sesión con Google para sincronizar y respaldar tu información"
              >
                <GoogleIcon className="w-3.5 h-3.5" />
                <span>{isSigningIn ? 'Conectando...' : 'Acceder con Google'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
