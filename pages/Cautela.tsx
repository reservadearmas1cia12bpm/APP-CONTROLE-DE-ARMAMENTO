import React, { useState } from 'react';
import { Material, Personnel, Cautela, CautelaItem, MaterialCategory, MaterialStatus, Armorer } from '../types';
import { ArrowRightLeft, CheckCircle, Search, Plus, AlertCircle, X } from 'lucide-react';

interface CautelaPageProps {
  materials: Material[];
  personnel: Personnel[];
  cautelas: Cautela[];
  armorer: Armorer | null;
  onUpdateCautelas: (data: Cautela[]) => void;
  onUpdateMaterials: (data: Material[]) => void;
  onLog: (action: string, details: string) => void;
}

export const CautelaPage: React.FC<CautelaPageProps> = ({ materials, personnel, cautelas, armorer, onUpdateCautelas, onUpdateMaterials, onLog }) => {
  const [view, setView] = useState<'LIST' | 'NEW' | 'RETURN'>('LIST');
  const [selectedCautela, setSelectedCautela] = useState<Cautela | null>(null);

  // Form State for New Cautela
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');
  const [personnelSearch, setPersonnelSearch] = useState('');
  const [newItems, setNewItems] = useState<CautelaItem[]>([]);
  const [notesOut, setNotesOut] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  
  // State for category search inputs
  const [categorySearch, setCategorySearch] = useState<Record<string, string>>({});

  // Helpers for selection
  const availableMaterials = materials.filter(m => m.status === MaterialStatus.AVAILABLE);

  const filteredPersonnel = personnel.filter(p => 
    p.active && (
        p.name.toLowerCase().includes(personnelSearch.toLowerCase()) || 
        p.matricula.includes(personnelSearch)
    )
  );

  const handleAddItem = (category: MaterialCategory, materialId: string) => {
    const mat = materials.find(m => m.id === materialId);
    if (!mat) return;
    
    setNewItems([...newItems, {
        materialId: mat.id,
        serialNumber: mat.serialNumber,
        category: mat.category,
        quantity: 1 
    }]);
  };

  const handleUpdateQuantity = (index: number, qty: number) => {
    const items = [...newItems];
    items[index].quantity = qty > 0 ? qty : 1;
    setNewItems(items);
  };

  const handleRemoveItem = (index: number) => {
      const updated = [...newItems];
      updated.splice(index, 1);
      setNewItems(updated);
  };
  
  const handleCategorySearchChange = (category: string, value: string) => {
      setCategorySearch(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmitCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonnelId || newItems.length === 0 || !armorer) {
        alert("Preencha todos os dados obrigatórios.");
        return;
    }

    const officer = personnel.find(p => p.id === selectedPersonnelId);
    
    const newCautela: Cautela = {
        id: Date.now().toString(),
        personnelId: selectedPersonnelId,
        personnelName: officer?.name || 'Desconhecido',
        armorerId: armorer.id,
        armorerName: armorer.name,
        items: newItems,
        timestampOut: new Date().toISOString(),
        status: 'OPEN',
        notesOut: notesOut,
        area: serviceArea || officer?.area
    };

    // Update Materials Status
    const updatedMaterials = materials.map(m => {
        if (newItems.some(item => item.materialId === m.id)) {
            if (m.category !== MaterialCategory.AMMO) {
                 return { ...m, status: MaterialStatus.CHECKED_OUT };
            }
        }
        return m;
    });

    onUpdateMaterials(updatedMaterials);
    onUpdateCautelas([newCautela, ...cautelas]);
    onLog('Nova Cautela', `Saída de material para ${officer?.name}. ${newItems.length} itens.`);
    
    setView('LIST');
    setNewItems([]);
    setSelectedPersonnelId('');
    setPersonnelSearch('');
    setNotesOut('');
    setCategorySearch({});
  };

  const handleReturn = (cautela: Cautela) => {
      // Garantir que o armeiro está logado
      if (!armorer) return;

      const updatedMaterials = materials.map(m => {
          if (cautela.items.some(item => item.materialId === m.id)) {
              return { ...m, status: MaterialStatus.AVAILABLE };
          }
          return m;
      });
      
      const updatedCautelas = cautelas.map(c => c.id === cautela.id ? {
          ...c,
          status: 'CLOSED',
          timestampIn: new Date().toISOString(),
          armorerInId: armorer.id, // Registra o ID do armeiro logado
          armorerInName: armorer.name // Registra o Nome do armeiro logado
      } as Cautela : c);

      onUpdateMaterials(updatedMaterials);
      onUpdateCautelas(updatedCautelas);
      onLog('Devolução', `Material devolvido por ${cautela.personnelName} (Recebido por: ${armorer.name})`);
      setSelectedCautela(null);
  };

  // Sub-components for cleaner code (Render functions)
  const renderNewCautelaForm = () => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Nova Saída de Material</h3>
            <button onClick={() => setView('LIST')} className="text-slate-500 hover:text-slate-700">Cancelar</button>
        </div>
        <form onSubmit={handleSubmitCheckout} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-white">Policial Militar</label>
                    <div className="relative mb-2">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                         <input 
                            type="text" 
                            placeholder="Buscar policial (nome/matrícula)..." 
                            className="w-full pl-9 p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 dark:text-white focus:ring-2 focus:ring-police-500 outline-none"
                            value={personnelSearch}
                            onChange={e => setPersonnelSearch(e.target.value)}
                         />
                    </div>
                    <select required className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white"
                        value={selectedPersonnelId} onChange={e => setSelectedPersonnelId(e.target.value)}>
                        <option value="">Selecione na lista...</option>
                        {filteredPersonnel.map(p => (
                            <option key={p.id} value={p.id}>{p.rank} {p.name} ({p.matricula})</option>
                        ))}
                        {selectedPersonnelId && !filteredPersonnel.find(p => p.id === selectedPersonnelId) && personnel.find(p => p.id === selectedPersonnelId) && (
                             <option value={selectedPersonnelId}>
                                {personnel.find(p => p.id === selectedPersonnelId)?.rank} {personnel.find(p => p.id === selectedPersonnelId)?.name}
                             </option>
                        )}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-white">Área de Atuação (Serviço)</label>
                    <input type="text" className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white"
                        value={serviceArea} onChange={e => setServiceArea(e.target.value)} placeholder="Ex: Setor Bravo, Patrulha..." />
                </div>
            </div>

            {/* Item Selection Area */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Adicionar Materiais</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {[MaterialCategory.WEAPON, MaterialCategory.VEST, MaterialCategory.RADIO, MaterialCategory.AMMO, MaterialCategory.CUFFS, MaterialCategory.MAGAZINE].map(cat => {
                        const searchTerm = categorySearch[cat] || '';
                        const filteredItems = availableMaterials.filter(m => 
                            m.category === cat && 
                            !newItems.find(ni => ni.materialId === m.id) &&
                            (m.model.toLowerCase().includes(searchTerm.toLowerCase()) || m.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()))
                        );

                        return (
                            <div key={cat} className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">{cat}</label>
                                
                                {/* Search Input for this category */}
                                <div className="relative mb-2">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                    <input 
                                        type="text"
                                        placeholder="Filtrar..."
                                        className="w-full pl-7 p-1.5 text-xs rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white focus:ring-1 focus:ring-police-500 outline-none"
                                        value={searchTerm}
                                        onChange={(e) => handleCategorySearchChange(cat, e.target.value)}
                                    />
                                </div>

                                <select className="w-full p-2 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                                    onChange={(e) => {
                                        if(e.target.value) {
                                            handleAddItem(cat, e.target.value);
                                            e.target.value = ""; // reset
                                            handleCategorySearchChange(cat, ''); // reset search
                                        }
                                    }}
                                >
                                    <option value="">+ Adicionar {cat}</option>
                                    {filteredItems.map(m => (
                                        <option key={m.id} value={m.id}>{m.model} - {m.serialNumber}</option>
                                    ))}
                                </select>
                            </div>
                        );
                    })}
                </div>

                {/* Selected Items List */}
                {newItems.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Itens Selecionados ({newItems.length})</h5>
                        <ul className="space-y-2">
                            {newItems.map((item, idx) => {
                                const isQuantityEditable = item.category === MaterialCategory.AMMO || item.category === MaterialCategory.MAGAZINE;
                                
                                return (
                                    <li key={idx} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                                        <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">
                                            <span className="font-semibold">{item.category}:</span> {materials.find(m => m.id === item.materialId)?.model} ({item.serialNumber})
                                        </span>

                                        {isQuantityEditable && (
                                            <div className="flex items-center gap-2 mx-4">
                                                <label className="text-xs font-bold text-slate-500">QTD</label>
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateQuantity(idx, parseInt(e.target.value))}
                                                    className="w-20 p-1 text-center text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-police-500 outline-none"
                                                />
                                            </div>
                                        )}

                                        <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700"><X size={16}/></button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 dark:text-white">Observações</label>
                <textarea className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-white h-20"
                    value={notesOut} onChange={e => setNotesOut(e.target.value)}></textarea>
            </div>

            <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setView('LIST')} className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-police-600 text-white rounded-lg hover:bg-police-700 font-medium">Confirmar Saída</button>
            </div>
        </form>
    </div>
  );

  const renderList = () => (
      <div className="space-y-4">
         <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Controle de Cautelas</h2>
            <button onClick={() => setView('NEW')} className="flex items-center gap-2 bg-police-600 text-white px-4 py-2 rounded-lg hover:bg-police-700 transition-colors font-medium">
                <Plus size={20} /> Nova Saída
            </button>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900/50 uppercase text-xs font-semibold">
                    <tr>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Policial</th>
                        <th className="px-6 py-4">Itens</th>
                        <th className="px-6 py-4">Saída</th>
                        <th className="px-6 py-4">Devolução</th>
                        <th className="px-6 py-4">Recebido Por</th>
                        <th className="px-6 py-4 text-right">Ação</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {cautelas.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                             <td className="px-6 py-4">
                                 {c.status === 'OPEN' ? 
                                    <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded text-xs font-bold">ABERTO</span> : 
                                    <span className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 px-2 py-1 rounded text-xs font-bold">FECHADO</span>
                                }
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{c.personnelName}</td>
                            <td className="px-6 py-4 text-xs">
                                {c.items.map(i => {
                                    if (i.quantity > 1) return `${i.category} (${i.quantity})`;
                                    return i.category;
                                }).join(', ')} 
                                <span className="ml-1 opacity-70">({c.items.length} items)</span>
                            </td>
                            <td className="px-6 py-4">{new Date(c.timestampOut).toLocaleString('pt-BR')}</td>
                            <td className="px-6 py-4">{c.timestampIn ? new Date(c.timestampIn).toLocaleString('pt-BR') : '-'}</td>
                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                                {c.armorerInName || '-'}
                            </td>
                            <td className="px-6 py-4 text-right">
                                {c.status === 'OPEN' && (
                                    <button onClick={() => setSelectedCautela(c)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium text-xs border border-blue-200 dark:border-blue-800 px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                        DEVOLVER
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Checkin Modal */}
        {selectedCautela && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Confirmar Devolução</h3>
                    <div className="mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                        <p className="font-bold text-slate-700 dark:text-slate-300">{selectedCautela.personnelName}</p>
                        <p className="text-sm text-slate-500 mb-3">Saída: {new Date(selectedCautela.timestampOut).toLocaleString()}</p>
                        <ul className="space-y-2">
                            {selectedCautela.items.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm dark:text-slate-300">
                                    <CheckCircle size={16} className="text-green-500"/>
                                    <span className="font-mono bg-white dark:bg-slate-700 px-1 rounded border border-slate-200 dark:border-slate-600">{item.serialNumber}</span>
                                    <span>- {materials.find(m=>m.id === item.materialId)?.type}</span>
                                    {item.quantity > 1 && <span className="font-bold text-slate-600 dark:text-slate-400">(Qtd: {item.quantity})</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setSelectedCautela(null)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
                        <button onClick={() => handleReturn(selectedCautela)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">Confirmar Recebimento</button>
                    </div>
                </div>
            </div>
        )}
      </div>
  );

  return view === 'NEW' ? renderNewCautelaForm() : renderList();
};