import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  GitBranch, 
  History, 
  Check, 
  AlertCircle, 
  FolderArchive,
  RotateCcw,
  Trash2,
  ExternalLink,
  Code2,
  Copy,
  Cloud,
  CloudCheck,
  CloudUpload,
  CloudDownload,
  LogOut,
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers
} from 'lucide-react';
import { FinancialProjectData, VersionSnapshot } from '../types';
import { exportProjectToJson, saveSnapshot, deleteSnapshot } from '../utils/storage';
import { 
  saveProjectToFirestore, 
  loadProjectFromFirestore, 
  saveSnapshotToFirestore, 
  loadSnapshotsFromFirestore, 
  deleteSnapshotFromFirestore 
} from '../utils/cloudStorage';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';

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

interface ProjectBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: FinancialProjectData;
  onRestoreProject: (data: FinancialProjectData) => void;
  snapshots: VersionSnapshot[];
  onUpdateSnapshots: (snapshots: VersionSnapshot[]) => void;
  cloudSyncStatus?: 'idle' | 'saving' | 'saved' | 'error';
  lastCloudSyncTime?: string | null;
  onRefreshCloud?: () => void;
}

export const ProjectBackupModal: React.FC<ProjectBackupModalProps> = ({
  isOpen,
  onClose,
  projectData,
  onRestoreProject,
  snapshots,
  onUpdateSnapshots,
  cloudSyncStatus = 'idle',
  lastCloudSyncTime,
  onRefreshCloud,
}) => {
  const { user, signInWithGoogle, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'google' | 'backup' | 'snapshots' | 'github'>('google');
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [newCloudSnapshotName, setNewCloudSnapshotName] = useState('');
  
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [saveCloudSuccess, setSaveCloudSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);

  // Cloud snapshots state
  const [cloudSnapshots, setCloudSnapshots] = useState<VersionSnapshot[]>([]);
  const [loadingCloudSnapshots, setLoadingCloudSnapshots] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [isRestoringCloud, setIsRestoringCloud] = useState(false);

  // Dialog states
  const [snapshotToRestore, setSnapshotToRestore] = useState<VersionSnapshot | null>(null);
  const [snapshotToDelete, setSnapshotToDelete] = useState<VersionSnapshot | null>(null);
  const [cloudProjectToRestore, setCloudProjectToRestore] = useState<FinancialProjectData | null>(null);
  const [cloudSnapshotToDelete, setCloudSnapshotToDelete] = useState<VersionSnapshot | null>(null);

  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Load cloud snapshots when modal opens or user logs in
  useEffect(() => {
    if (isOpen && user) {
      loadUserCloudSnapshots();
    }
  }, [isOpen, user]);

  const loadUserCloudSnapshots = async () => {
    if (!user) return;
    setLoadingCloudSnapshots(true);
    try {
      const remoteSnaps = await loadSnapshotsFromFirestore(user.uid);
      setCloudSnapshots(remoteSnaps);
    } catch (err: any) {
      console.error('Error cargando instantáneas de la nube:', err);
    } finally {
      setLoadingCloudSnapshots(false);
    }
  };

  if (!isOpen) return null;

  // Manual save current project to Firestore
  const handleSaveToCloud = async () => {
    if (!user) return;
    setIsSavingCloud(true);
    setErrorMessage('');
    try {
      await saveProjectToFirestore(user.uid, projectData);
      setSaveCloudSuccess(true);
      if (onRefreshCloud) onRefreshCloud();
      setTimeout(() => setSaveCloudSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage('Error al guardar en la nube de Google. Por favor, intenta de nuevo.');
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Check and prompt to restore current project from Firestore
  const handleCheckAndRestoreCloudProject = async () => {
    if (!user) return;
    setIsRestoringCloud(true);
    setErrorMessage('');
    try {
      const remoteData = await loadProjectFromFirestore(user.uid);
      if (!remoteData) {
        setErrorMessage('Aún no tienes ninguna copia guardada en tu cuenta de Google.');
        return;
      }
      setCloudProjectToRestore(remoteData);
    } catch (err: any) {
      setErrorMessage('Error al obtener la información desde la nube de Google.');
    } finally {
      setIsRestoringCloud(false);
    }
  };

  // Confirm and execute cloud project restoration
  const executeRestoreCloudProject = () => {
    if (!cloudProjectToRestore) return;
    onRestoreProject(cloudProjectToRestore);
    setCloudProjectToRestore(null);
    setRestoreSuccess(true);
    setTimeout(() => {
      setRestoreSuccess(false);
      onClose();
    }, 1500);
  };

  // Create a named cloud snapshot in Firestore
  const handleCreateCloudSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCloudSnapshotName.trim()) return;

    const totalDebt = projectData.cards.reduce((sum, c) => sum + (Number(c.currentBalance) || 0), 0);
    const snap: VersionSnapshot = {
      id: 'snap-cloud-' + Date.now(),
      name: newCloudSnapshotName.trim(),
      timestamp: new Date().toISOString(),
      cardsCount: projectData.cards.length,
      totalDebt,
      data: JSON.parse(JSON.stringify(projectData)),
    };

    try {
      await saveSnapshotToFirestore(user.uid, snap);
      setNewCloudSnapshotName('');
      await loadUserCloudSnapshots();
      setSaveCloudSuccess(true);
      setTimeout(() => setSaveCloudSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage('Error al crear la instantánea en la nube.');
    }
  };

  // Delete cloud snapshot
  const executeDeleteCloudSnapshot = async () => {
    if (!user || !cloudSnapshotToDelete) return;
    try {
      await deleteSnapshotFromFirestore(user.uid, cloudSnapshotToDelete.id);
      setCloudSnapshots((prev) => prev.filter((s) => s.id !== cloudSnapshotToDelete.id));
      setCloudSnapshotToDelete(null);
    } catch (err: any) {
      setErrorMessage('Error al eliminar la instantánea de la nube.');
    }
  };

  // Local JSON upload
  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || !Array.isArray(parsed.cards) || !Array.isArray(parsed.checkingAccounts)) {
          setErrorMessage('El archivo no parece ser una copia de seguridad válida de este proyecto.');
          return;
        }
        onRestoreProject(parsed);
        setRestoreSuccess(true);
        setTimeout(() => {
          setRestoreSuccess(false);
          onClose();
        }, 1500);
      } catch (err) {
        setErrorMessage('Error al leer el archivo JSON. Verifica que el archivo no esté dañado.');
      }
    };
    reader.readAsText(file);
  };

  // Local snapshot creation
  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnapshotName.trim()) return;
    const updated = saveSnapshot(newSnapshotName, projectData);
    onUpdateSnapshots(updated);
    setNewSnapshotName('');
  };

  const executeRestoreSnapshot = () => {
    if (!snapshotToRestore) return;
    onRestoreProject(snapshotToRestore.data);
    setRestoreSuccess(true);
    setTimeout(() => {
      setRestoreSuccess(false);
      onClose();
    }, 1500);
  };

  const executeDeleteSnapshot = () => {
    if (!snapshotToDelete) return;
    const updated = deleteSnapshot(snapshotToDelete.id);
    onUpdateSnapshots(updated);
    setSnapshotToDelete(null);
  };

  const gitBashScript = `# 1. Inicializa tu repositorio Git
git init

# 2. Agrega todos los archivos del proyecto
git add .

# 3. Haz tu primer commit con fecha y descripción
git commit -m "feat: gestor de tarjetas y finanzas listo para producción"

# 4. Cambia la rama principal a main
git branch -M main

# 5. Vincula tu repositorio remoto de GitHub (reemplaza con tu URL)
# git remote add origin https://github.com/tu-usuario/mi-gestor-finanzas.git

# 6. Publica los cambios a GitHub
# git push -u origin main`;

  const handleCopyGitCommands = () => {
    navigator.clipboard.writeText(gitBashScript);
    setCopiedGitCmd(true);
    setTimeout(() => setCopiedGitCmd(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Respaldos & Google Cloud
              </h3>
              <p className="text-xs text-slate-500">
                Guarda, restaura y sincroniza tus finanzas en tu cuenta de Google o en archivos locales
              </p>
            </div>
          </div>
          <button
            id="close-backup-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-slate-200 bg-slate-50/40 px-6 pt-2 overflow-x-auto">
          <button
            id="tab-google-cloud-btn"
            type="button"
            onClick={() => setActiveTab('google')}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'google'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4 text-indigo-600" />
            <span>Cuenta de Google (Nube)</span>
            {user && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            )}
          </button>

          <button
            id="tab-json-backup-btn"
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderArchive className="w-4 h-4" /> Exportar / Importar JSON
          </button>

          <button
            id="tab-snapshots-btn"
            type="button"
            onClick={() => setActiveTab('snapshots')}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'snapshots'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" /> Versiones Locales ({snapshots.length})
          </button>

          <button
            id="tab-github-guide-btn"
            type="button"
            onClick={() => setActiveTab('github')}
            className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'github'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitBranch className="w-4 h-4" /> GitHub
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Alerts */}
          {restoreSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              ¡Información financiera restaurada exitosamente!
            </div>
          )}

          {saveCloudSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600" />
              ¡Guardado exitosamente en tu cuenta de Google Cloud!
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              {errorMessage}
            </div>
          )}

          {/* TAB 1: GOOGLE CLOUD */}
          {activeTab === 'google' && (
            <div className="space-y-6">
              {!user ? (
                /* Unauthenticated State */
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-slate-50 to-white border border-indigo-100 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center">
                    <GoogleIcon className="w-7 h-7" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h4 className="text-base font-bold text-slate-900">
                      Guarda y restaura tus finanzas con Google
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Conecta tu cuenta de Google para respaldar en la nube tus tarjetas de crédito,
                      cuentas corrientes y tasas de cambio. Podrás restaurar tus datos en cualquier dispositivo
                      o navegador de forma inmediata.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95"
                    >
                      <GoogleIcon className="w-4 h-4" />
                      <span>Iniciar sesión con Google</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-2">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Cifrado seguro
                    </span>
                    <span className="flex items-center gap-1">
                      <Cloud className="w-3.5 h-3.5 text-indigo-600" /> Base de datos Firestore
                    </span>
                  </div>
                </div>
              ) : (
                /* Authenticated State */
                <div className="space-y-6">
                  {/* User Profile Card */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'Usuario'}
                          className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                          {(user.displayName || user.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {user.displayName || 'Usuario de Google'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Conectado
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={logout}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>

                  {/* Cloud Save & Restore Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Guardar en la Nube */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-indigo-200 transition-colors flex flex-col justify-between">
                      <div>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2">
                          <CloudUpload className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Guardar en Google Cloud
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Guarda el estado actual ({projectData.cards.length} tarjetas y {projectData.checkingAccounts.length} cuentas) en tu cuenta de Google.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {lastCloudSyncTime ? `Sincronizado: ${lastCloudSyncTime}` : 'Listo para guardar'}
                        </span>
                        <button
                          type="button"
                          onClick={handleSaveToCloud}
                          disabled={isSavingCloud}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
                        >
                          <CloudUpload className="w-3.5 h-3.5" />
                          <span>{isSavingCloud ? 'Guardando...' : 'Guardar ahora'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Restaurar desde la Nube */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-emerald-200 transition-colors flex flex-col justify-between">
                      <div>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
                          <CloudDownload className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Restaurar de Google Cloud
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Descarga y restaura la última copia guardada en tu cuenta de Google Firestore.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={handleCheckAndRestoreCloudProject}
                          disabled={isRestoringCloud}
                          className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <CloudDownload className="w-3.5 h-3.5" />
                          <span>{isRestoringCloud ? 'Buscando...' : 'Restaurar datos'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cloud Snapshots / Versioning */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Instantáneas en la Nube ({cloudSnapshots.length})</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          Crea copias históricas etiquetadas vinculadas a tu cuenta de Google
                        </p>
                      </div>
                    </div>

                    {/* Form to create snapshot in cloud */}
                    <form onSubmit={handleCreateCloudSnapshot} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej: Cierre de mes Septiembre o Pre-liquidación..."
                        value={newCloudSnapshotName}
                        onChange={(e) => setNewCloudSnapshotName(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                      <button
                        type="submit"
                        disabled={!newCloudSnapshotName.trim()}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold whitespace-nowrap transition-colors disabled:opacity-40"
                      >
                        Crear instantánea en la nube
                      </button>
                    </form>

                    {/* Snapshots List */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      {loadingCloudSnapshots ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                          Cargando instantáneas desde Google Cloud...
                        </div>
                      ) : cloudSnapshots.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                          Aún no has creado instantáneas con nombre en la nube de Google.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                          {cloudSnapshots.map((s) => (
                            <div
                              key={s.id}
                              className="p-3 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-900 truncate">{s.name}</p>
                                <div className="flex items-center gap-3 text-slate-500 text-[11px] mt-0.5">
                                  <span>{new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>•</span>
                                  <span>{s.cardsCount} tarjetas</span>
                                  <span>•</span>
                                  <span className="font-semibold text-slate-700">
                                    Deuda: ${s.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSnapshotToRestore(s)}
                                  className="p-1.5 rounded-md text-indigo-700 hover:bg-indigo-50 text-xs font-semibold flex items-center gap-1"
                                  title="Restaurar esta versión guardada en la nube"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Restaurar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCloudSnapshotToDelete(s)}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  title="Eliminar de la nube"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXPORT / IMPORT JSON */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Descargar Copia Completa (JSON)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Descarga un archivo .json con todas tus tarjetas, cuentas corrientes, saldos, notas y tasas configuradas.
                  </p>
                </div>
                <button
                  id="btn-download-json-backup"
                  type="button"
                  onClick={() => exportProjectToJson(projectData)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-2xs whitespace-nowrap transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo JSON</span>
                </button>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Restaurar desde archivo JSON
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Carga un archivo de respaldo previo para restablecer todo el proyecto financiero.
                  </p>
                </div>
                <div>
                  <input
                    ref={jsonFileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleJsonUpload}
                    className="hidden"
                  />
                  <button
                    id="btn-upload-json-backup"
                    type="button"
                    onClick={() => jsonFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Cargar Archivo JSON</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOCAL SNAPSHOTS */}
          {activeTab === 'snapshots' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateSnapshot} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre de la versión (ej: Cierre de mes o Pre-liquidación)..."
                  value={newSnapshotName}
                  onChange={(e) => setNewSnapshotName(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <button
                  type="submit"
                  disabled={!newSnapshotName.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold whitespace-nowrap transition-colors disabled:opacity-40"
                >
                  Guardar Versión Local
                </button>
              </form>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                {snapshots.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Aún no hay versiones guardadas en este navegador. Escribe un nombre arriba y guarda una copia.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {snapshots.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 truncate">{s.name}</p>
                          <div className="flex items-center gap-3 text-slate-500 text-[11px] mt-0.5">
                            <span>{new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span>{s.cardsCount} tarjetas</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">
                              Deuda: ${s.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSnapshotToRestore(s)}
                            className="p-1.5 rounded-md text-indigo-700 hover:bg-indigo-50 text-xs font-semibold flex items-center gap-1"
                            title="Restaurar esta versión"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restaurar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSnapshotToDelete(s)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: GITHUB */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs relative">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 font-sans text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" /> Comandos Bash / Terminal
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyGitCommands}
                    className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded transition-colors"
                  >
                    {copiedGitCmd ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar Comandos
                      </>
                    )}
                  </button>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {gitBashScript}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-start gap-2.5">
                <ExternalLink className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">¿Cómo crear el repositorio en GitHub?</span>
                  <p className="mt-0.5 text-indigo-800 leading-relaxed">
                    Ve a <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="underline font-bold">github.com/new</a>, crea un repositorio vacío (sin README ni .gitignore) y copia su URL para vincularlo con el comando <code>git remote add origin</code>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Confirm restore cloud project dialog */}
      <ConfirmDialog
        isOpen={cloudProjectToRestore !== null}
        onClose={() => setCloudProjectToRestore(null)}
        onConfirm={executeRestoreCloudProject}
        title="¿Restaurar datos desde Google Cloud?"
        description={`Se encontró una copia en tu cuenta de Google con ${cloudProjectToRestore?.cards?.length || 0} tarjetas y ${cloudProjectToRestore?.checkingAccounts?.length || 0} cuentas (última actualización: ${cloudProjectToRestore?.lastUpdated ? new Date(cloudProjectToRestore.lastUpdated).toLocaleString() : 'Reciente'}). ¿Deseas reemplazar los datos locales actuales?`}
        confirmText="Sí, restaurar desde Google"
        danger={false}
      />

      {/* Confirm restore snapshot dialog */}
      <ConfirmDialog
        isOpen={snapshotToRestore !== null}
        onClose={() => setSnapshotToRestore(null)}
        onConfirm={executeRestoreSnapshot}
        title="¿Restaurar versión guardada?"
        description={`¿Deseas restaurar la versión "${snapshotToRestore?.name}"? Los datos actuales del proyecto se reemplazarán con los guardados en esta instantánea.`}
        confirmText="Sí, restaurar versión"
        danger={false}
      />

      {/* Confirm delete local snapshot dialog */}
      <ConfirmDialog
        isOpen={snapshotToDelete !== null}
        onClose={() => setSnapshotToDelete(null)}
        onConfirm={executeDeleteSnapshot}
        title="¿Eliminar versión guardada?"
        description={`¿Estás seguro de que deseas eliminar la versión "${snapshotToDelete?.name}"? Esta instantánea ya no estará disponible localmente.`}
        confirmText="Sí, eliminar versión"
        danger={true}
      />

      {/* Confirm delete cloud snapshot dialog */}
      <ConfirmDialog
        isOpen={cloudSnapshotToDelete !== null}
        onClose={() => setCloudSnapshotToDelete(null)}
        onConfirm={executeDeleteCloudSnapshot}
        title="¿Eliminar versión de Google Cloud?"
        description={`¿Estás seguro de que deseas eliminar la versión "${cloudSnapshotToDelete?.name}" de tu cuenta de Google Cloud? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar de la nube"
        danger={true}
      />
    </div>
  );
};
