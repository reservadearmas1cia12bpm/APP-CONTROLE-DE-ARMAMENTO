import React, { useMemo } from 'react';
import { Material, Cautela, MaterialCategory, MaterialStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react';

interface DashboardProps {
  materials: Material[];
  cautelas: Cautela[];
}

export const Dashboard: React.FC<DashboardProps> = ({ materials, cautelas }) => {
  
  const stats = useMemo(() => {
    const openCautelas = cautelas.filter(c => c.status === 'OPEN');
    const availableWeapons = materials.filter(m => m.category === MaterialCategory.WEAPON && m.status === MaterialStatus.AVAILABLE).length;
    const totalWeapons = materials.filter(m => m.category === MaterialCategory.WEAPON).length;
    const itemsInMaintenance = materials.filter(m => m.status === MaterialStatus.MAINTENANCE).length;
    
    return { openCautelas, availableWeapons, totalWeapons, itemsInMaintenance };
  }, [materials, cautelas]);

  const chartData = useMemo(() => {
    const categories = Object.values(MaterialCategory);
    return categories.map(cat => ({
      name: cat,
      total: materials.filter(m => m.category === cat).length,
      disponivel: materials.filter(m => m.category === cat && m.status === MaterialStatus.AVAILABLE).length,
      cautelado: materials.filter(m => m.category === cat && m.status === MaterialStatus.CHECKED_OUT).length
    }));
  }, [materials]);

  const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#ef4444'];

  const statusData = [
    { name: 'Disponível', value: materials.filter(m => m.status === MaterialStatus.AVAILABLE).length },
    { name: 'Em Cautela', value: materials.filter(m => m.status === MaterialStatus.CHECKED_OUT).length },
    { name: 'Manutenção', value: materials.filter(m => m.status === MaterialStatus.MAINTENANCE).length },
    { name: 'Extraviado', value: materials.filter(m => m.status === MaterialStatus.LOST).length },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Visão Geral Operacional</h2>
      
      {/* Cards Topo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Cautelas Abertas</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.openCautelas.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Armamento Disponível</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.availableWeapons} <span className="text-sm text-slate-400 font-normal">/ {stats.totalWeapons}</span></h3>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manutenção</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.itemsInMaintenance}</h3>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Extraviados</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">
                {materials.filter(m => m.status === MaterialStatus.LOST).length}
            </h3>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
            <ShieldAlert size={24} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Inventário por Categoria</h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} 
                        />
                        <Legend />
                        <Bar dataKey="disponivel" name="Disponível" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="cautelado" name="Em Cautela" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Status Geral do Material</h3>
            <div className="h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Recent Activity (Brief) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Últimas Movimentações</h3>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 uppercase text-xs font-semibold">
                      <tr>
                          <th className="px-4 py-3 rounded-l-lg">Policial</th>
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3">Itens</th>
                          <th className="px-4 py-3">Horário</th>
                          <th className="px-4 py-3 rounded-r-lg">Status</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {cautelas.slice(0, 5).map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{c.personnelName}</td>
                              <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${c.status === 'OPEN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
                                      {c.status === 'OPEN' ? 'Saída' : 'Devolução'}
                                  </span>
                              </td>
                              <td className="px-4 py-3">{c.items.length} itens</td>
                              <td className="px-4 py-3">{new Date(c.timestampOut).toLocaleString('pt-BR')}</td>
                              <td className="px-4 py-3">
                                  {c.status === 'OPEN' ? 
                                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><Clock size={14}/> Pendente</span> : 
                                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle size={14}/> Concluído</span>
                                  }
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              {cautelas.length === 0 && <p className="text-center py-8 text-slate-500">Nenhuma movimentação registrada.</p>}
          </div>
      </div>
    </div>
  );
};