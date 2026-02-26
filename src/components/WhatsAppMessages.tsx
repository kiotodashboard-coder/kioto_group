
import React, { useState } from 'react';
import { WhatsAppMessage, Area } from '../types';

interface WhatsAppMessagesProps {
  messages: WhatsAppMessage[];
  onClear: () => void;
  areas?: Area[];
}

const WhatsAppMessages: React.FC<WhatsAppMessagesProps> = ({ messages, onClear, areas = [] }) => {
  const [filter, setFilter] = useState('');

  const filteredMessages = messages.filter(m => 
    m.sender.toLowerCase().includes(filter.toLowerCase()) || 
    m.content.toLowerCase().includes(filter.toLowerCase())
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <i className="fas fa-comments text-indigo-600"></i> Historial de Conversaciones
          </h2>
          <p className="text-slate-500">Mensajes recibidos y respuestas automáticas de Kioto</p>
        </div>
        <button 
          onClick={() => confirm('¿Borrar todo el historial?') && onClear()}
          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm"
        >
          Limpiar Historial
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Buscar por remitente o contenido..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remitente</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mensaje Recibido</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Área Detectada</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha/Hora</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMessages.map((msg) => {
                const detectedArea = areas.find(a => a.id === msg.detectedAreaId);
                return (
                  <tr key={msg.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold">
                          {msg.sender.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{msg.sender}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 max-w-xs truncate" title={msg.content}>{msg.content}</p>
                    </td>
                    <td className="px-6 py-4">
                      {detectedArea ? (
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100 uppercase">
                          {detectedArea.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-300 italic uppercase">General</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-400">
                        {new Date(msg.timestamp).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        <i className="fas fa-check-double"></i> ENTREGADO
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredMessages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                    No hay registros que coincidan con la búsqueda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppMessages;
