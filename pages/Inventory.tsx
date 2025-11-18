import React, { useState } from 'react';
import { Material, MaterialCategory, MaterialStatus, Personnel } from '../types';
import { Search, Plus, Trash2, Edit2, Package, Filter, X, Calendar, User } from 'lucide-react';

interface InventoryProps {
  data: Material[];
  personnel: Personnel[]; // Added prop
  onUpdate: (newData: Material[]) => void;
  onLog: (action: string, details: string) => void;
}

export const InventoryPage: React.FC<InventoryProps> = ({ data, personnel, onUpdate, onLog }) => {
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm: Material = {
    id: '',
    category: MaterialCategory.WEAPON,
    type: '',
    model: '',
    serialNumber: '',
    manufacturer: '',
    condition: 'Bom',
    status: MaterialStatus.AVAILABLE,
    quantity: 1,
    caliber: '',
    expiryDate: '',
    personnelId: ''
  };

  const [formData, setFormData] = useState<Material>(initialForm);

  const filteredData = data.filter(item => {
    const matchesTab = activeTab === 'ALL' || item.category === activeTab;
    const matchesSearch = 
        item.model.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let newData = [...data];
    
    // Ensure personnelId is cleared if status is not checked out
    const finalData = {
        ...formData,
        personnelId: formData.status === MaterialStatus.CHECKED_OUT ? formData.personnelId : undefined
    };

    if (editingId) {
      newData = newData.map(p => p.id === editingId ? { ...finalData, id: editingId } : p);
      onLog('Editar Material', `Editou item ${finalData.type} ${finalData.model} (${finalData.serialNumber})`);
    } else {
      const newItem = { ...finalData, id: Date.now().toString() };
      newData.push(newItem);
      onLog('Novo Material', `Cadastrou ${finalData.type} ${finalData.model} (${finalData.serialNumber})`);
    }
    
    onUpdate(newData);
    setIsModalOpen(false);
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
      if (confirm('Tem certeza que deseja excluir este material?')) {
          const item = data.find(i => i.id === id);
          const newData = data.filter(i => i.id !== id);
          onUpdate(newData);
          onLog('Excluir Material', `Excluiu ${item?.type} ${item?.model} (${item?.serialNumber})`);
      }
  };

  const openEdit = (item: Material) => {
      setFormData(item);
      setEditingId(item.id);
      setIsModalOpen(true);
  };

  const openNew = () => {
      setFormData(initialForm);
      setEditingId(null);
      setIsModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Armamento e Material</h2>
        <button 
            onClick={openNew}
            className="flex items-center justify-center gap-2 bg-police-600 hover:bg-police-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
            <Plus size={20} />
            <span>Cadastrar Item</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
              <button onClick={() => setActiveTab('ALL')} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'ALL' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                  Todos
              </button>
              {Object.values(MaterialCategory).map(cat => (
                  <button key={cat} onClick={() => setActiveTab(cat)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === cat ? 'bg-police-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                      {cat}
                  </button>
              ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Buscar por modelo ou serial..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-police-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 uppercase text-xs font-semibold border-b border-slate-100 dark:border-slate-700">
                      <tr>
                          <th className="px-6 py-4">Item</th>
                          <th className="px-6 py-4">Serial / Lote</th>
                          <th className="px-6 py-4">Categoria</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {filteredData.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                      <span className="font-medium text-slate-900 dark:text-white">
                                        {item.type} {item.model} {item.caliber ? ` - ${item.caliber}` : ''}
                                      </span>
                                      <span className="text-xs text-slate-500">{item.manufacturer}</span>
                                      {item.expiryDate && (
                                          <span className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5">
                                              <Calendar size={10} /> Vence: {new Date(item.expiryDate).toLocaleDateString('pt-BR')}
                                          </span>
                                      )}
                                      {item.status === MaterialStatus.CHECKED_OUT && item.personnelId && (
                                          <span className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                                              <User size={10} /> {personnel.find(p => p.id === item.personnelId)?.rank} {personnel.find(p => p.id === item.personnelId)?.name}
                                          </span>
                                      )}
                                  </div>
                              </td>
                              <td className="px-6 py-4 font-mono text-xs bg-slate-50 dark:bg-slate-900/30 rounded px-2">{item.serialNumber}</td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                    {item.category}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                  <span className={`
                                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${item.status === MaterialStatus.AVAILABLE ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                                    ${item.status === MaterialStatus.CHECKED_OUT ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                                    ${item.status === MaterialStatus.MAINTENANCE ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : ''}
                                    ${item.status === MaterialStatus.LOST ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
                                  `}>
                                      {item.status}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <button onClick={() => openEdit(item)} className="text-slate-400 hover:text-police-600 mr-3"><Edit2 size={18}/></button>
                                  <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={18}/></button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              {filteredData.length === 0 && (
                  <div className="p-12 text-center text-slate-400">
                      <Package size={48} className="mx-auto mb-3 opacity-50" />
                      <p>Nenhum material encontrado.</p>
                  </div>
              )}
          </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                        {editingId ? 'Editar Material' : 'Novo Material'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-slate-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
                            <select 
                                required
                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white"
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value as MaterialCategory})}
                            >
                                {Object.values(MaterialCategory).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo (ex: Pistola, Colete Nível III)</label>
                            <input type="text" required className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Modelo</label>
                            <input type="text" required className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                        </div>

                        {/* Caliber Field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Calibre</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white" 
                                value={formData.caliber || ''} 
                                onChange={e => setFormData({...formData, caliber: e.target.value})} 
                                placeholder="Ex: .40, 9mm, 5.56"
                            />
                        </div>

                        {/* Expiry Date - Only for Vests */}
                        {formData.category === MaterialCategory.VEST && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Vencimento</label>
                                <input 
                                    type="date" 
                                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white" 
                                    value={formData.expiryDate || ''} 
                                    onChange={e => setFormData({...formData, expiryDate: e.target.value})} 
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número de Série / Lote</label>
                            <input type="text" required className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fabricante</label>
                            <input type="text" required className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estado de Conservação</label>
                            <select className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                                <option value="Novo">Novo</option>
                                <option value="Bom">Bom</option>
                                <option value="Regular">Regular</option>
                                <option value="Ruim">Ruim</option>
                            </select>
                        </div>
                        {formData.category === MaterialCategory.AMMO && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantidade em Estoque</label>
                                <input type="number" className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
                            </div>
                        )}
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status Inicial</label>
                            <select className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as MaterialStatus})}>
                                {Object.values(MaterialStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        
                        {/* Conditionally Show Personnel Select if status is Checked Out */}
                        {formData.status === MaterialStatus.CHECKED_OUT && (
                            <div className="col-span-1 md:col-span-2 animate-fade-in">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Policial (Cautela Atual)</label>
                                <select 
                                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white"
                                    value={formData.personnelId || ''}
                                    onChange={(e) => setFormData({...formData, personnelId: e.target.value})}
                                >
                                    <option value="">Selecione o Policial...</option>
                                    {personnel.filter(p => p.active).map(p => (
                                        <option key={p.id} value={p.id}>{p.rank} {p.name} ({p.matricula})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-police-600 hover:bg-police-700 text-white rounded-lg font-medium">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};