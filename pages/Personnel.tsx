import React, { useState } from 'react';
import { Personnel } from '../types';
import { StorageService } from '../services/storageService';
import { Search, Plus, Edit2, Trash2, X, User } from 'lucide-react';

interface PersonnelProps {
  data: Personnel[];
  onUpdate: (newData: Personnel[]) => void;
  onLog: (action: string, details: string) => void;
  armorerName: string;
}

export const PersonnelPage: React.FC<PersonnelProps> = ({ data, onUpdate, onLog, armorerName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialForm: Personnel = {
    id: '',
    name: '',
    rank: '',
    matricula: '',
    cpf: '',
    unit: '',
    area: '',
    phone: '',
    active: true,
    notes: ''
  };
  
  const [formData, setFormData] = useState<Personnel>(initialForm);

  const filteredData = data.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.matricula.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let newData = [...data];
    
    if (editingId) {
      newData = newData.map(p => p.id === editingId ? { ...formData, id: editingId } : p);
      onLog('Editar Policial', `Editou dados de ${formData.name} (${formData.matricula})`);
    } else {
      const newOfficer = { ...formData, id: Date.now().toString() };
      newData.push(newOfficer);
      onLog('Novo Policial', `Cadastrou ${formData.name} (${formData.matricula})`);
    }
    
    onUpdate(newData);
    setIsModalOpen(false);
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este policial?')) {
        const officer = data.find(p => p.id === id);
        const newData = data.filter(p => p.id !== id);
        onUpdate(newData);
        onLog('Excluir Policial', `Excluiu ${officer?.name} (${officer?.matricula})`);
    }
  };

  const openEdit = (person: Personnel) => {
    setFormData(person);
    setEditingId(person.id);
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
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Efetivo Policial</h2>
        <button 
            onClick={openNew}
            className="flex items-center justify-center gap-2 bg-police-600 hover:bg-police-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
            <Plus size={20} />
            <span>Adicionar Policial</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
            type="text" 
            placeholder="Buscar por nome ou matrícula..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-police-500 focus:border-transparent outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredData.map((person) => (
            <div key={person.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex items-start gap-4">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
                    {person.photoUrl ? <img src={person.photoUrl} alt={person.name} className="w-full h-full rounded-full object-cover" /> : <User size={28} />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white truncate">{person.rank} {person.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Mat: {person.matricula}</p>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => openEdit(person)} className="p-1.5 text-slate-400 hover:text-police-600 hover:bg-police-50 dark:hover:bg-police-900/20 rounded transition-colors">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(person.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        <p><span className="font-medium">Unidade:</span> {person.unit}</p>
                        <p><span className="font-medium">Tel:</span> {person.phone}</p>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                        {editingId ? 'Editar Policial' : 'Novo Policial'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Posto/Graduação</label>
                            <select 
                                required
                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white"
                                value={formData.rank}
                                onChange={(e) => setFormData({...formData, rank: e.target.value})}
                            >
                                <option value="">Selecione...</option>
                                <option value="Sd">Soldado</option>
                                <option value="Cb">Cabo</option>
                                <option value="3º Sgt">3º Sargento</option>
                                <option value="2º Sgt">2º Sargento</option>
                                <option value="1º Sgt">1º Sargento</option>
                                <option value="SubTen">Subtenente</option>
                                <option value="2º Ten">2º Tenente</option>
                                <option value="1º Ten">1º Tenente</option>
                                <option value="Cap">Capitão</option>
                                <option value="Maj">Major</option>
                                <option value="TenCel">Tenente Coronel</option>
                                <option value="Cel">Coronel</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                            <input 
                                type="text" required
                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Matrícula / ID</label>
                            <input 
                                type="text" required
                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white"
                                value={formData.matricula}
                                onChange={(e) => setFormData({...formData, matricula: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CPF</label>
                            <input 
                                type="text" required
                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white"
                                value={formData.cpf}
                                onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Companhia / Batalhão</label>
                            <input 
                                type="text" required
                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white"
                                value={formData.unit}
                                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Área de Atuação</label>
                            <input 
                                type="text" 
                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white"
                                value={formData.area}
                                onChange={(e) => setFormData({...formData, area: e.target.value})}
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                            <input 
                                type="tel" 
                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
                            <textarea 
                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white h-24"
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            ></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2 bg-police-600 hover:bg-police-700 text-white rounded-lg shadow-sm transition-colors font-medium"
                        >
                            Salvar Policial
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};