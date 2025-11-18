import React from 'react';
import { Material, Cautela, Personnel, MaterialCategory } from '../types';
import { StorageService } from '../services/storageService';
import { Download, FileText, Shield } from 'lucide-react';

interface ReportsProps {
  materials: Material[];
  cautelas: Cautela[];
  personnel: Personnel[];
}

export const ReportsPage: React.FC<ReportsProps> = ({ materials, cautelas, personnel }) => {
  
  const generateInventoryReport = () => {
      const reportData = materials.map(m => ({
          Categoria: m.category,
          Tipo: m.type,
          Modelo: m.model,
          Serial: m.serialNumber,
          Status: m.status,
          Condicao: m.condition
      }));
      StorageService.exportCSV(reportData, 'inventario_sentinela');
  };

  const generateCautelaReport = () => {
      const reportData = cautelas.map(c => ({
          DataSaida: new Date(c.timestampOut).toLocaleString(),
          DataRetorno: c.timestampIn ? new Date(c.timestampIn).toLocaleString() : 'Pendente',
          Policial: c.personnelName,
          Armeiro: c.armorerName,
          Status: c.status,
          QtdItens: c.items.length
      }));
      StorageService.exportCSV(reportData, 'historico_cautelas');
  };

  // Simple Stats for the view
  const weaponCount = materials.filter(m => m.category === MaterialCategory.WEAPON).length;
  const vestCount = materials.filter(m => m.category === MaterialCategory.VEST).length;
  const radioCount = materials.filter(m => m.category === MaterialCategory.RADIO).length;

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Relatórios e Exportação</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Inventário */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Shield size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Inventário Geral</h3>
                    <p className="text-sm text-slate-500">Resumo de todo material bélico.</p>
                </div>
            </div>
            
            <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-slate-600 dark:text-slate-400">Total de Armas</span>
                    <span className="font-bold dark:text-white">{weaponCount}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-slate-600 dark:text-slate-400">Total de Coletes</span>
                    <span className="font-bold dark:text-white">{vestCount}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-slate-600 dark:text-slate-400">Total de Rádios</span>
                    <span className="font-bold dark:text-white">{radioCount}</span>
                </div>
            </div>

            <button 
                onClick={generateInventoryReport}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
            >
                <Download size={18} />
                Exportar Excel (.csv)
            </button>
        </div>

        {/* Card Histórico */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
             <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                    <FileText size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Histórico de Movimentações</h3>
                    <p className="text-sm text-slate-500">Log completo de saídas e devoluções.</p>
                </div>
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-slate-600 dark:text-slate-400">Cautelas Totais</span>
                    <span className="font-bold dark:text-white">{cautelas.length}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-slate-600 dark:text-slate-400">Em Aberto (Rua)</span>
                    <span className="font-bold text-amber-600">{cautelas.filter(c => c.status === 'OPEN').length}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-slate-600 dark:text-slate-400">Concluídas</span>
                    <span className="font-bold text-green-600">{cautelas.filter(c => c.status === 'CLOSED').length}</span>
                </div>
            </div>

            <button 
                onClick={generateCautelaReport}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
            >
                <Download size={18} />
                Exportar Excel (.csv)
            </button>
        </div>
      </div>
    </div>
  );
};