
import React, { useState } from 'react';
import { Area, AreaInsight } from '../types';
import { generateAreaInsights } from '../services/geminiService';

interface IntelligenceCenterProps {
  areas: Area[];
  onSaveInsight: (insight: Omit<AreaInsight, 'id' | 'timestamp'>) => void;
}

const IntelligenceCenter: React.FC<IntelligenceCenterProps> = ({ areas, onSaveInsight }) => {
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState('');

  const handleGenerate = async () => {
    if (!selectedAreaId) return;
    const area = areas.find(a => a.id === selectedAreaId);
    if (!area) return;

    setLoading(true);
    setGeneratedText('');
    const result = await generateAreaInsights(area, []);
    setGeneratedText(result);
    setLoading(false);
  };

  const handlePublish = () => {
    if (!selectedAreaId || !generatedText) return;
    onSaveInsight({
      areaId: selectedAreaId,
      title: "Recomendación de Estrategia IA",
      content: generatedText
    });
    setGeneratedText('');
    setSelectedAreaId('');
    alert("Recomendación publicada en el Hub del área.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">Motor de Inteligencia Kioto</h2>
        <p className="text-zinc-500 font-medium">Aprovechando Gemini Pro para sintetizar planes estratégicos cereza para tus áreas.</p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-zinc-200 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-end">
          <div>
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 ml-1">Seleccionar Área Objetivo</label>
            <select 
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#d21f3c] font-bold text-zinc-900 transition-all appearance-none"
              value={selectedAreaId}
              onChange={e => setSelectedAreaId(e.target.value)}
            >
              <option value="">Elige un área...</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <button 
            disabled={!selectedAreaId || loading}
            onClick={handleGenerate}
            className="w-full px-8 py-4 bg-[#d21f3c] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#b01a32] transition-all shadow-xl shadow-[#d21f3c]/20 disabled:opacity-50"
          >
            {loading ? (
              <i className="fas fa-circle-notch animate-spin"></i>
            ) : (
              <i className="fas fa-wand-magic-sparkles"></i>
            )}
            Generar Plan Estratégico
          </button>
        </div>

        {generatedText && (
          <div className="bg-zinc-900 rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 text-zinc-100 border border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
              <span className="text-[10px] font-black text-[#d21f3c] uppercase tracking-widest">Resultado de la IA</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedText);
                    alert("Copiado al portapapeles");
                  }}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  title="Copiar texto"
                >
                  <i className="fas fa-copy"></i>
                </button>
              </div>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed text-zinc-400 font-medium text-sm">{generatedText}</p>
            </div>
            <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-end">
               <button 
                onClick={handlePublish}
                className="px-6 py-3 bg-[#d21f3c] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#b01a32] transition-colors shadow-lg shadow-[#d21f3c]/10"
              >
                Publicar en el Hub del Área
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 bg-zinc-50 rounded-[32px] text-center border border-zinc-100">
          <i className="fas fa-microchip text-2xl text-[#d21f3c] mb-4"></i>
          <h4 className="font-black text-zinc-800 mb-2 uppercase tracking-tight text-xs">Síntesis de Datos</h4>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Agrega entradas departamentales para visiones holísticas.</p>
        </div>
        <div className="p-8 bg-zinc-50 rounded-[32px] text-center border border-zinc-100">
          <i className="fas fa-chart-line text-2xl text-emerald-600 mb-4"></i>
          <h4 className="font-black text-zinc-800 mb-2 uppercase tracking-tight text-xs">Lógica de Crecimiento</h4>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Modelado predictivo para la asignación presupuestaria.</p>
        </div>
        <div className="p-8 bg-zinc-50 rounded-[32px] text-center border border-zinc-100">
          <i className="fas fa-shield-alt text-2xl text-zinc-800 mb-4"></i>
          <h4 className="font-black text-zinc-800 mb-2 uppercase tracking-tight text-xs">Auditoría de Riesgos</h4>
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Identificación automatizada de fricciones operativas.</p>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceCenter;
