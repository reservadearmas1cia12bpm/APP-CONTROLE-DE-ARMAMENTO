import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { PersonnelPage } from './pages/Personnel';
import { InventoryPage } from './pages/Inventory';
import { CautelaPage } from './pages/Cautela';
import { ReportsPage } from './pages/Reports';
import { SettingsPage } from './pages/Settings';
import { StorageService, GoogleDriveService } from './services/storageService';
import { Armorer, AppSettings, Material, Personnel, Cautela, SystemLog, Admin } from './types';
import { Shield, UserCheck, ShieldAlert, UserPlus, Key, Lock } from 'lucide-react';

// Login States
enum LoginMode {
  INITIAL_AUTH = 'INITIAL_AUTH', // admin / 1234
  CREATE_SUPER_ADMIN = 'CREATE_SUPER_ADMIN', // form to create super admin
  SECURE_LOGIN = 'SECURE_LOGIN' // normal login
}

const App: React.FC = () => {
  // Global State
  const [armorer, setArmorer] = useState<Armorer | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ institutionName: 'Polícia Militar', theme: 'light', admins: [] });
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginMode, setLoginMode] = useState<LoginMode>(LoginMode.INITIAL_AUTH);

  // Data State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [cautelas, setCautelas] = useState<Cautela[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // Init
  useEffect(() => {
    setMaterials(StorageService.getMaterials());
    setPersonnel(StorageService.getPersonnel());
    setCautelas(StorageService.getCautelas());
    setLogs(StorageService.getLogs());
    
    const savedSettings = StorageService.getSettings();
    setSettings(savedSettings);
    
    // Determine Initial Login Mode based on DB state
    if (savedSettings.admins && savedSettings.admins.length > 0) {
        setLoginMode(LoginMode.SECURE_LOGIN);
    } else {
        setLoginMode(LoginMode.INITIAL_AUTH);
    }
    
    if (savedSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
    }

    // Trigger Auto Backup Check after short delay to ensure scripts load
    setTimeout(() => {
       GoogleDriveService.runAutoBackupCheck();
    }, 3000);

  }, []);

  // Helpers
  const handleThemeToggle = () => {
      const newTheme: 'light' | 'dark' = settings.theme === 'light' ? 'dark' : 'light';
      const newSettings: AppSettings = { ...settings, theme: newTheme };
      setSettings(newSettings);
      StorageService.saveSettings(newSettings);
      
      if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  };

  const handleLog = (action: string, details: string) => {
      if (!armorer) return;
      StorageService.addLog(armorer.name, action, details);
      setLogs(StorageService.getLogs());
  };

  // Updates wrapper to persist data
  const updateMaterials = (data: Material[]) => {
      setMaterials(data);
      StorageService.saveMaterials(data);
  };
  
  const updatePersonnel = (data: Personnel[]) => {
      setPersonnel(data);
      StorageService.savePersonnel(data);
  };

  const updateCautelas = (data: Cautela[]) => {
      setCautelas(data);
      StorageService.saveCautelas(data);
  };

  const updateSettings = (data: AppSettings) => {
      setSettings(data);
      StorageService.saveSettings(data);
  };

  // --- AUTH HANDLERS ---

  const handleInitialAuth = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const id = formData.get('id') as string;
      const pass = formData.get('pass') as string;

      if (id === 'admin' && pass === '1234') {
          setLoginMode(LoginMode.CREATE_SUPER_ADMIN);
          setLoginError('');
      } else {
          setLoginError('Credenciais de instalação incorretas.');
      }
  };

  const handleCreateSuperAdmin = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const name = formData.get('name') as string;
      const matricula = formData.get('matricula') as string;
      const password = formData.get('password') as string;

      if (!name || !matricula || !password) {
          setLoginError('Preencha todos os campos.');
          return;
      }

      const newAdmin: Admin = {
          id: Date.now().toString(),
          name,
          matricula,
          password,
          role: 'SUPER_ADMIN'
      };

      const newSettings = { ...settings, admins: [newAdmin] };
      updateSettings(newSettings);
      
      setArmorer({
          id: newAdmin.id,
          name: newAdmin.name,
          matricula: newAdmin.matricula,
          role: 'SUPER_ADMIN'
      });
      
      handleLog('Sistema', 'Super Administrador configurado. Sistema bloqueado para acesso externo.');
      setLoginMode(LoginMode.SECURE_LOGIN); // Future accesses will use this
  };

  const handleSecureLogin = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const matricula = formData.get('matricula') as string;
      const password = formData.get('password') as string;

      if (matricula === 'admin' || password === '1234') {
           setLoginError('Login padrão desabilitado por segurança.');
           return;
      }

      const admin = settings.admins?.find(a => a.matricula === matricula && a.password === password);

      if (admin) {
          setArmorer({
              id: admin.id,
              name: admin.name,
              matricula: admin.matricula,
              role: admin.role
          });
          handleLog('Login', 'Acesso autorizado ao sistema.');
      } else {
          setLoginError('Credenciais inválidas.');
      }
  };

  // Login Screen Renderer
  if (!armorer) {
      return (
          <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                  <div className={`w-24 h-24 mx-auto flex items-center justify-center mb-6 overflow-hidden ${settings.institutionLogo ? '' : 'bg-police-600 rounded-2xl text-white shadow-lg shadow-police-600/30'}`}>
                      {settings.institutionLogo ? (
                          <img src={settings.institutionLogo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                           <Shield size={48} />
                      )}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{settings.institutionName}</h1>
                  
                  {/* --- VIEW 1: INITIAL AUTH (First Access) --- */}
                  {loginMode === LoginMode.INITIAL_AUTH && (
                      <>
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-lg mb-6 text-left">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold mb-1">
                                <ShieldAlert size={18} />
                                <span>Configuração Inicial</span>
                            </div>
                            <p className="text-sm text-amber-600 dark:text-amber-300">
                                Banco de dados vazio. Utilize as credenciais padrão para configurar o Super Administrador.
                            </p>
                        </div>
                        <form onSubmit={handleInitialAuth} className="space-y-4 text-left">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Identificação</label>
                                <input name="id" type="text" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" placeholder="admin" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Matrícula / Senha Padrão</label>
                                <input name="pass" type="password" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" placeholder="1234" />
                            </div>
                            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
                            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition-colors">Liberar Instalação</button>
                        </form>
                      </>
                  )}

                  {/* --- VIEW 2: CREATE SUPER ADMIN --- */}
                  {loginMode === LoginMode.CREATE_SUPER_ADMIN && (
                       <>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-lg mb-6 text-left">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold mb-1">
                                <UserPlus size={18} />
                                <span>Criar Super Administrador</span>
                            </div>
                            <p className="text-sm text-blue-600 dark:text-blue-300">
                                Este usuário terá acesso total ao sistema. O login padrão será desativado após esta etapa.
                            </p>
                        </div>
                        <form onSubmit={handleCreateSuperAdmin} className="space-y-4 text-left">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo / Posto</label>
                                <div className="relative">
                                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input name="name" type="text" required className="w-full pl-10 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-police-500 outline-none" placeholder="Ex: Cap Silva" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Matrícula (Login)</label>
                                <input name="matricula" type="text" required className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-police-500 outline-none" placeholder="123456-0" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Definir Senha</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input name="password" type="password" required className="w-full pl-10 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-police-500 outline-none" placeholder="******" />
                                </div>
                            </div>
                            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
                            <button type="submit" className="w-full bg-police-600 hover:bg-police-700 text-white font-bold py-3 rounded-lg transition-colors">Finalizar Instalação</button>
                        </form>
                       </>
                  )}

                  {/* --- VIEW 3: SECURE LOGIN (Regular) --- */}
                  {loginMode === LoginMode.SECURE_LOGIN && (
                      <>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">Acesso Restrito ao Sistema</p>
                        <form onSubmit={handleSecureLogin} className="space-y-4 text-left">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Matrícula</label>
                                <div className="relative">
                                    <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input name="matricula" type="text" required className="w-full pl-10 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-police-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input name="password" type="password" required className="w-full pl-10 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-police-500 outline-none" />
                                </div>
                            </div>
                            {loginError && (
                                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/10 p-3 rounded-lg">
                                    <ShieldAlert size={16} />
                                    {loginError}
                                </div>
                            )}
                            <button type="submit" className="w-full bg-police-600 hover:bg-police-700 text-white font-bold py-3 rounded-lg transition-colors mt-4 shadow-md shadow-police-600/20">
                                Acessar Sistema
                            </button>
                        </form>
                      </>
                  )}
                  
                  <p className="text-xs text-slate-400 mt-6">Sentinela v1.1 - Segurança Bélica</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 flex flex-col">
      <Header 
        armorer={armorer} 
        settings={settings} 
        onLogout={() => setArmorer(null)}
        toggleTheme={handleThemeToggle}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar 
            isOpen={isSidebarOpen} 
            currentView={currentView} 
            onChangeView={setCurrentView} 
        />
        
        <main className={`flex-1 overflow-y-auto transition-all duration-300 p-0 md:p-2 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
            <div className="max-w-7xl mx-auto">
                {currentView === 'dashboard' && <Dashboard materials={materials} cautelas={cautelas} />}
                {currentView === 'personnel' && <PersonnelPage data={personnel} onUpdate={updatePersonnel} onLog={handleLog} armorerName={armorer.name} />}
                {currentView === 'inventory' && <InventoryPage data={materials} personnel={personnel} onUpdate={updateMaterials} onLog={handleLog} />}
                {currentView === 'cautela' && <CautelaPage materials={materials} personnel={personnel} cautelas={cautelas} armorer={armorer} onUpdateCautelas={updateCautelas} onUpdateMaterials={updateMaterials} onLog={handleLog} />}
                {currentView === 'reports' && <ReportsPage materials={materials} cautelas={cautelas} personnel={personnel} />}
                {currentView === 'settings' && <SettingsPage settings={settings} logs={logs} onSaveSettings={updateSettings} onRestore={() => window.location.reload()} currentUser={armorer} />}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;