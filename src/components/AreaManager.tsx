
import React, { useState } from 'react';
import { Area } from '../types';

interface AreaManagerProps {
  areas: Area[];
  onAddArea: (area: Omit<Area, 'id' | 'createdAt'>) => void;
  onDeleteArea: (id: string) => void;
}

const AreaManager: React.FC<AreaManagerProps> = ({ areas, onAddArea, onDeleteArea }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', budget: 0 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddArea({ ...formData, status: 'active' });
    setFormData({ name: '', description: '', budget: 0 });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight uppercase">Gestión de Áreas</h2>
          <p className="text-zinc-500 font-medium">Define y monitorea los departamentos de la empresa</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[#d21f3c] text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-[#b01a32] transition-all shadow-xl shadow-[#d21f3c]/20 font-black text-xs uppercase tracking-widest"
        >
          <i className="fas fa-plus"></i> Nueva Área
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {areas.map(area => (
          <div key={area.id} className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm hover:border-[#d21f3c]/20 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-[#d21f3c] border border-zinc-100 group-hover:scale-110 transition-transform">
                <i className="fas fa-building text-2xl"></i>
              </div>
              <button 
                onClick={() => onDeleteArea(area.id)}
                className="text-zinc-300 hover:text-[#d21f3c] transition-colors p-2"
                title="Eliminar Área"
              >
                <i className="fas fa-trash-alt text-lg"></i>
              </button>
            </div>
            <h3 className="text-xl font-black text-zinc-800 mb-2 uppercase tracking-tight">{area.name}</h3>
            <p className="text-sm text-zinc-500 mb-6 line-clamp-2 font-medium">{area.description}</p>
            <div className="flex items-center justify-between mt-auto pt-6 border-t border-zinc-100">
              <div>
                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">Presupuesto</p>
                <p className="text-xl font-black text-zinc-800">${area.budget.toLocaleString()}</p>
              </div>
              <span className="px-3 py-1.5 bg-[#d21f3c]/10 text-[#d21f3c] text-[10px] font-black rounded-xl uppercase tracking-widest border border-[#d21f3c]/20">
                {area.status === 'active' ? 'ACTIVA' : 'ARCHIVADA'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-zinc-500/10 backdrop-blur-xl flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-[32px] sm:rounded-[48px] w-full max-w-xl p-6 sm:p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-white/20 overflow-y-auto max-h-[90vh]">
            <h3 className="text-3xl font-black text-zinc-900 mb-2 tracking-tighter uppercase">Definir Jurisdicción</h3>
            <p className="text-zinc-400 font-medium mb-10 text-sm">Agrega un nuevo departamento al ecosistema.</p>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Nombre de la División</label>
                <input 
                  type="text" required
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#d21f3c] font-bold text-zinc-900 placeholder:text-zinc-300 transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Logística Internacional"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Descripción Estratégica</label>
                <textarea 
                  required
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#d21f3c] font-bold text-zinc-900 placeholder:text-zinc-300 transition-all"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe la función crítica de este área..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Presupuesto Asignado ($)</label>
                <input 
                  type="number" required
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#d21f3c] font-bold text-zinc-900 transition-all"
                  value={formData.budget}
                  onChange={e => setFormData({...formData, budget: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-8 py-5 border border-zinc-100 rounded-2xl font-black text-xs uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 transition-all"
                >
                  Cerrar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-8 py-5 bg-[#d21f3c] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#b01a32] transition-all shadow-xl shadow-[#d21f3c]/20"
                >
                  EJECUTAR ALTA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaManager;
