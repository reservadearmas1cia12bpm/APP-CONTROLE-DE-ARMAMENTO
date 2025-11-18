import React, { useRef, useState } from 'react';
import { AppSettings, SystemLog, Armorer, GoogleDriveFile, BackupFrequency } from '../types';
import { StorageService, GoogleDriveService } from '../services/storageService';
import { Save, Upload, Download, Database, Shield, Users, Trash2, Plus, Image as ImageIcon, Lock, Cloud, Loader2, X, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  logs: SystemLog[];
  onSaveSettings: (s: AppSettings) => void;
  onRestore: () => void;
  currentUser: Armorer | null;
}

export const SettingsPage: React.FC<SettingsProps> = ({ settings, logs, onSaveSettings, onRestore, currentUser }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [instName, setInstName] = useState(settings.institutionName);
  const [instLogo, setInstLogo] = useState(settings.institutionLogo || '');
  
  // Admin Management
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminMatricula, setNewAdminMatricula] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  // Google Drive & Backup State
  const [gDriveClientId, setGDriveClientId] = useState(settings.googleDrive?.clientId || '');
  const [gDriveApiKey, setGDriveApiKey] = useState(settings.googleDrive?.apiKey || '');
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [showDriveModal, setShowDriveModal] = useState(false);
  
  // Auto Backup State
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(settings.backup?.enabled || false);
  const [backupFreq, setBackupFreq] = useState<BackupFrequency>(settings.backup?.frequency || BackupFrequency.NEVER);

  const handleSave = () => {
    onSaveSettings({ 
        ...settings, 
        institutionName: instName,
        institutionLogo: instLogo
    });
    alert('Configurações salvas!');
  };

  const handleSaveDriveConfig = () => {
      onSaveSettings({
          ...settings,
          googleDrive: {
              clientId: gDriveClientId,
              apiKey: gDriveApiKey
          }
      });
      alert('Credenciais do Google Drive salvas!');
  };

  const handleSaveAutoBackup = () => {
      onSaveSettings({
          ...settings,
          backup: {
              enabled: autoBackupEnabled,
              frequency: backupFreq,
              lastBackupDate: settings.backup?.lastBackupDate
          }
      });
      alert('Configurações de Backup Automático salvas!');
  };

  const handleLocalRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if(confirm(`Tem certeza que deseja restaurar o arquivo "${file.name}"? Todos os dados atuais serão substituídos.`)) {
            StorageService.restoreBackup(file, (success, msg) => {
                if (success) {
                    alert(msg || 'Backup restaurado com sucesso! O sistema será recarregado.');
                    window.location.reload();
                } else {
                    alert(`Falha: ${msg}`);
                }
            }, currentUser?.name || 'Admin');
          }
      }
  };

  // --- Google Drive Handlers ---

  const initDrive = async () => {
      if (!settings.googleDrive?.clientId || !settings.googleDrive?.apiKey) {
          alert("Configure o Client ID e API Key primeiro.");
          return false;
      }
      try {
          await GoogleDriveService.initClient(settings.googleDrive);
          return true;
      } catch (e) {
          console.error(e);
          alert("Erro ao inicializar Google API. Verifique o console e suas credenciais.");
          return false;
      }
  };

  const handleDriveBackup = async () => {
      if(!confirm("Iniciar backup manual para o Google Drive?")) return;

      setIsDriveLoading(true);
      if (await initDrive()) {
          try {
              await GoogleDriveService.uploadBackup(currentUser?.name);
              alert("Backup enviado para a pasta '/App_Controle_Armamento/Backups/' com sucesso!");
          } catch (e) {
              console.error(e);
              alert("Erro ao fazer backup no Drive. Verifique permissões.");
          }
      }
      setIsDriveLoading(false);
  };

  const handleDriveRestoreClick = async () => {
      setIsDriveLoading(true);
      if (await initDrive()) {
          try {
              const files = await GoogleDriveService.listBackups();
              setDriveFiles(files);
              setShowDriveModal(true);
          } catch (e) {
              console.error(e);
              alert("Erro ao listar arquivos do Drive.");
          }
      }
      setIsDriveLoading(false);
  };

  const confirmDriveRestore = async (fileId: string, fileName: string) => {
      if(!confirm(`ATENÇÃO: Restaurar o backup "${fileName}" irá sobrescrever TODOS os dados atuais. Continuar?`)) return;

      setIsDriveLoading(true);
      setShowDriveModal(false);
      try {
          const blob = await GoogleDriveService.downloadBackup(fileId);
          const file = new File([blob], fileName, { type: 'application/zip' });
          
          StorageService.restoreBackup(file, (success, msg) => {
              if (success) {
                  alert('Backup do Drive restaurado! O sistema será recarregado.');
                  window.location.reload();
              } else {
                  alert(`Erro na restauração: ${msg}`);
              }
          }, currentUser?.name || 'Admin');
      } catch (e) {
          console.error(e);
          alert("Erro ao baixar backup do Drive.");
      }
      setIsDriveLoading(false);
  };

  // Admin Logic (Existing)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setInstLogo(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleAddAdmin = () => {
    if (!newAdminName || !newAdminMatricula || !newAdminPassword) {
        alert('Preencha nome, matrícula e senha.');
        return;
    }
    const newAdmin = {
        id: Date.now().toString(),
        name: newAdminName,
        matricula: newAdminMatricula,
        password: newAdminPassword,
        role: 'ADMIN' as const
    };
    const updatedAdmins = [...(settings.admins || []), newAdmin];
    onSaveSettings({ ...settings, admins: updatedAdmins });
    setNewAdminName(''); setNewAdminMatricula(''); setNewAdminPassword('');
  };

  const handleRemoveAdmin = (id: string) => {
      if (id === currentUser?.id) { alert("Você não pode remover a si mesmo."); return; }
      if(confirm('Remover este administrador?')) {
          const updatedAdmins = (settings.admins || []).filter(a => a.id !== id);
          onSaveSettings({ ...settings, admins: updatedAdmins });
      }
  };

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <div className="p-6 space-y-8 animate-fade-in pb-20">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações do Sistema</h2>

      {/* Identidade Visual */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
            <Shield size={20} /> Identidade Visual
          </h3>
          <div className="max-w-md space-y-6">
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logotipo</label>
                  <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                          {instLogo ? <img src={instLogo} alt="Logo" className="w-full h-full object-contain p-1" /> : <ImageIcon size={32} className="text-slate-300" />}
                      </div>
                      <div className="flex flex-col gap-2">
                          <button onClick={() => logoInputRef.current?.click()} className="px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">Carregar Imagem</button>
                          {instLogo && <button onClick={() => setInstLogo('')} className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 transition-colors text-left">Remover</button>}
                          <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                      </div>
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Instituição</label>
                  <input type="text" className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white" value={instName} onChange={(e) => setInstName(e.target.value)} />
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 bg-police-600 text-white px-4 py-2 rounded-lg hover:bg-police-700 font-medium"><Save size={18} /> Salvar Alterações</button>
          </div>
      </div>

      {/* Gestão de Administradores */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2"><Users size={20} /> Gerenciar Administradores</h3>
          {!isSuperAdmin && (
              <div className="absolute inset-0 bg-slate-50/90 dark:bg-slate-900/90 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                  <Lock className="text-slate-400 mb-2" size={32} />
                  <p className="font-bold text-slate-700 dark:text-slate-300">Acesso Restrito</p>
              </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                  <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase mb-3">Novo Administrador</h4>
                  <div className="space-y-3">
                      <input type="text" className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white" placeholder="Nome Completo" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} disabled={!isSuperAdmin} />
                      <input type="text" className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white" placeholder="Matrícula" value={newAdminMatricula} onChange={(e) => setNewAdminMatricula(e.target.value)} disabled={!isSuperAdmin} />
                      <input type="password" className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white" placeholder="Senha" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} disabled={!isSuperAdmin} />
                      <button onClick={handleAddAdmin} disabled={!isSuperAdmin} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium text-sm disabled:opacity-50"><Plus size={16} /> Adicionar</button>
                  </div>
              </div>
              <div>
                  <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase mb-3">Cadastrados</h4>
                  <div className="space-y-2">
                      {settings.admins?.map(admin => (
                          <div key={admin.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                              <div><p className="text-sm font-bold dark:text-white">{admin.name} {admin.role === 'SUPER_ADMIN' && <span className="text-amber-600 text-xs">(Super)</span>}</p><p className="text-xs text-slate-500">{admin.matricula}</p></div>
                              {admin.role !== 'SUPER_ADMIN' && <button onClick={() => handleRemoveAdmin(admin.id)} disabled={!isSuperAdmin} className="text-red-500 hover:bg-red-50 rounded p-1"><Trash2 size={16} /></button>}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      {/* BACKUP AND RESTORE SECTION */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2">
            <Database size={20} /> Backup e Restauração Completa
          </h3>
          
          {/* 1. Configuração do Google Drive */}
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-3">
                  <Cloud size={18} /> Integração Google Drive
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Client ID</label>
                      <input type="text" className="w-full p-2 text-xs rounded border border-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white" value={gDriveClientId} onChange={(e) => setGDriveClientId(e.target.value)} placeholder="apps.googleusercontent.com" />
                  </div>
                  <div className="space-y-2">
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">API Key</label>
                      <input type="text" className="w-full p-2 text-xs rounded border border-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white" value={gDriveApiKey} onChange={(e) => setGDriveApiKey(e.target.value)} />
                  </div>
              </div>
              <div className="mt-3 flex justify-end">
                  <button onClick={handleSaveDriveConfig} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Salvar Credenciais</button>
              </div>
          </div>

          {/* 2. Estratégia de Backup Automático */}
          <div className="mb-8 border-b border-slate-100 dark:border-slate-700 pb-8">
              <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase mb-4 flex items-center gap-2">
                  <RefreshCw size={16} /> Backup Automático
              </h4>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex items-center gap-3">
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={autoBackupEnabled} onChange={e => setAutoBackupEnabled(e.target.checked)} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">Ativar Sincronização</span>
                      </label>
                  </div>
                  
                  {autoBackupEnabled && (
                      <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Frequência:</span>
                          <select 
                            value={backupFreq} 
                            onChange={(e) => setBackupFreq(e.target.value as BackupFrequency)}
                            className="p-2 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white text-sm"
                          >
                              <option value={BackupFrequency.ON_BOOT}>Ao Iniciar App</option>
                              <option value={BackupFrequency.DAILY}>Diariamente</option>
                              <option value={BackupFrequency.WEEKLY}>Semanalmente</option>
                              <option value={BackupFrequency.MONTHLY}>Mensalmente</option>
                          </select>
                      </div>
                  )}
                  <button onClick={handleSaveAutoBackup} className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-700">Salvar Regra</button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                  O backup automático será salvo na pasta: <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1 rounded">/App_Controle_Armamento/Backups/</span>
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 3. Backup Manual */}
              <div>
                   <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase mb-4">Backup Manual</h4>
                   <div className="space-y-4">
                        <button 
                            onClick={() => StorageService.createBackup(currentUser?.name)}
                            className="w-full flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600"><Download size={20} /></div>
                                <div className="text-left">
                                    <span className="block font-bold text-slate-700 dark:text-slate-200">Salvar no Dispositivo</span>
                                    <span className="text-xs text-slate-500">Download .zip</span>
                                </div>
                            </div>
                        </button>

                        <button 
                            onClick={handleDriveBackup}
                            disabled={isDriveLoading || !gDriveClientId}
                            className="w-full flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group disabled:opacity-50"
                        >
                             <div className="flex items-center gap-3">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600">
                                    {isDriveLoading ? <Loader2 className="animate-spin" size={20}/> : <Cloud size={20} />}
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-slate-700 dark:text-slate-200">Salvar no Google Drive</span>
                                    <span className="text-xs text-slate-500">Upload para nuvem</span>
                                </div>
                            </div>
                        </button>
                   </div>
              </div>

              {/* 4. Restauração */}
              <div>
                  <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase mb-4">Restauração</h4>
                  <div className="space-y-4">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="cursor-pointer w-full flex items-center justify-between p-4 border-2 border-dashed border-amber-200 dark:border-amber-800/50 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-amber-600"><Upload size={20} /></div>
                                <div className="text-left">
                                    <span className="block font-bold text-slate-700 dark:text-slate-200">Carregar Arquivo Local</span>
                                    <span className="text-xs text-slate-500">Selecione .zip ou .json</span>
                                </div>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleLocalRestore} className="hidden" accept=".zip,.rar,.json" />
                        </div>

                        <button 
                             onClick={handleDriveRestoreClick}
                             disabled={isDriveLoading || !gDriveClientId}
                             className="w-full flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors disabled:opacity-50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600">
                                    {isDriveLoading ? <Loader2 className="animate-spin" size={20}/> : <Database size={20} />}
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-slate-700 dark:text-slate-200">Restaurar do Google Drive</span>
                                    <span className="text-xs text-slate-500">Listar backups na nuvem</span>
                                </div>
                            </div>
                        </button>
                  </div>
              </div>
          </div>
      </div>

      {/* Logs */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Logs de Auditoria</h3>
          <div className="overflow-y-auto max-h-60 border rounded-lg border-slate-100 dark:border-slate-700">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                      <tr><th className="px-4 py-2">Data/Hora</th><th className="px-4 py-2">Usuário</th><th className="px-4 py-2">Ação</th><th className="px-4 py-2">Detalhes</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {logs.slice(0, 30).map((log) => (
                          <tr key={log.id}>
                              <td className="px-4 py-2 whitespace-nowrap text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                              <td className="px-4 py-2 font-medium">{log.armorerName}</td>
                              <td className="px-4 py-2">{log.action}</td>
                              <td className="px-4 py-2 truncate max-w-xs">{log.details}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Drive File Picker Modal */}
      {showDriveModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Cloud size={20} className="text-blue-500" /> Backups no Drive
                    </h3>
                    <button onClick={() => setShowDriveModal(false)}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs px-4 py-2">
                    Pasta: /App_Controle_Armamento/Backups/
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                    {driveFiles.length === 0 ? (
                        <div className="text-center py-8">
                            <Database className="mx-auto text-slate-300 mb-2" size={32}/>
                            <p className="text-slate-500">Nenhum backup encontrado nesta pasta.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {driveFiles.map(file => (
                                <button key={file.id} onClick={() => confirmDriveRestore(file.id, file.name)} className="w-full text-left p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all group">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-slate-800 dark:text-white text-sm truncate pr-4">{file.name}</span>
                                        <Download size={16} className="text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                                    </div>
                                    <div className="flex justify-between mt-1 text-xs text-slate-500">
                                        <span>{new Date(file.createdTime).toLocaleString()}</span>
                                        {file.size && <span>{Math.round(parseInt(file.size)/1024)} KB</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-center">
                     {isDriveLoading && <span className="text-xs text-blue-600 flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={12}/> Baixando e Verificando Integridade...</span>}
                </div>
            </div>
          </div>
      )}
    </div>
  );
};