
import React, { useState } from 'react';
import { Area, MessageRouting } from '../types';

interface MessageRouterProps {
  areas: Area[];
  routings: MessageRouting[];
  onUpdateRoutings: (routings: MessageRouting[]) => void;
}

const MessageRouter: React.FC<MessageRouterProps> = ({ areas, routings, onUpdateRoutings }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ keyword: '', areaId: '', priority: 1 });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.keyword || !formData.areaId) return;

    const newRouting: MessageRouting = {
      id: Math.random().toString(36).substr(2, 9),
      keyword: formData.keyword.toLowerCase().trim(),
      areaId: formData.areaId,
      priority: formData.priority
    };

    onUpdateRoutings([...routings, newRouting]);
    setFormData({ keyword: '', areaId: '', priority: 1 });
    setShowModal(false);
  };

  const removeRouting = (id: string) => {
    onUpdateRoutings(routings.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight uppercase flex items-center gap-4">
            <i className="fas fa-route text-[#d21f3c]"></i> Enrutamiento Lógico
          </h2>
          <p className="text-zinc-500 font-medium">Vincula palabras clave con departamentos para derivación automática</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#d21f3c] text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-[#b01a32] shadow-xl shadow-[#d21f3c]/20 font-black text-xs uppercase tracking-widest transition-all"
        >
          <i className="fas fa-plus"></i> Nueva Regla
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {routings.map(route => {
          const area = areas.find(a => a.id === route.areaId);
          return (
            <div key={route.id} className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm hover:border-[#d21f3c]/30 transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-[#d21f3c]/5 px-4 py-1.5 rounded-xl text-[#d21f3c] text-[10px] font-black uppercase tracking-widest border border-[#d21f3c]/10">
                  Trigger
                </div>
                <button 
                  onClick={() => removeRouting(route.id)}
                  className="text-zinc-200 hover:text-red-500 transition-colors p-2"
                >
                  <i className="fas fa-times-circle text-lg"></i>
                </button>
              </div>
              <h3 className="text-2xl font-black text-zinc-800 mb-6 flex items-center gap-3">
                <i className="fas fa-quote-left text-zinc-100 text-xs"></i>
                {route.keyword}
                <i className="fas fa-quote-right text-zinc-100 text-xs"></i>
              </h3>
              <div className="flex items-center gap-4 p-5 bg-zinc-50 rounded-2xl border border-zinc-100 group-hover:bg-[#d21f3c]/5 group-hover:border-[#d21f3c]/10 transition-colors">
                <i className="fas fa-arrow-right text-[#d21f3c]"></i>
                <div>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Destino</p>
                  <p className="text-sm font-black text-zinc-800">{area?.name || 'Desconocido'}</p>
                </div>
              </div>
            </div>
          );
        })}
        {routings.length === 0 && (
          <div className="col-span-full py-24 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[48px] text-center text-zinc-300">
            <i className="fas fa-map-signs text-5xl mb-6 opacity-10"></i>
            <p className="font-bold uppercase text-xs tracking-[0.2em]">Cero reglas de enrutamiento</p>
            <p className="text-sm font-medium mt-2">Configura palabras clave para activar la derivación inteligente.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[48px] w-full max-w-md p-12 shadow-3xl border border-zinc-100">
            <h3 className="text-3xl font-black text-zinc-900 mb-2 tracking-tighter uppercase">Definir Lógica</h3>
            <p className="text-zinc-500 mb-10 font-medium">Especifica la relación entre entrada y departamento.</p>
            <form onSubmit={handleAdd} className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Palabra Clave (Trigger)</label>
                <input 
                  type="text" required
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#d21f3c] font-bold text-zinc-900"
                  placeholder="Ej: soporte, incidencia, demo..."
                  value={formData.keyword}
                  onChange={e => setFormData({...formData, keyword: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">División Responsable</label>
                <select 
                  required
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#d21f3c] font-bold text-zinc-900 appearance-none transition-all"
                  value={formData.areaId}
                  onChange={e => setFormData({...formData, areaId: e.target.value})}
                >
                  <option value="">Selecciona una división...</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 text-zinc-400 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 py-5 bg-[#d21f3c] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#b01a32] shadow-xl shadow-[#d21f3c]/20">Registrar Regla</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageRouter;
