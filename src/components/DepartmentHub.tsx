
import React from 'react';
import { Area, AreaInsight, WhatsAppMessage } from '../types';
import Logo from './Logo';

interface DepartmentHubProps {
  area: Area | undefined;
  insights: AreaInsight[];
  whatsappMessages: WhatsAppMessage[];
}

const DepartmentHub: React.FC<DepartmentHubProps> = ({ area, insights, whatsappMessages }) => {
  if (!area) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400">
        <i className="fas fa-exclamation-triangle text-6xl mb-6 text-zinc-100"></i>
        <p className="text-xl font-black text-zinc-800 uppercase tracking-tighter">Sin Jurisdicción Detectada</p>
        <p className="text-sm font-medium text-zinc-400">Contacta a un Súper Usuario para la provisión de acceso departamental.</p>
      </div>
    );
  }

  // Filtrar mensajes de WhatsApp específicos para este departamento
  const areaMessages = whatsappMessages.filter(m => m.detectedAreaId === area.id);

  return (
    <div className="space-y-8 lg:space-y-12">
      <div className="bg-zinc-100 rounded-[32px] sm:rounded-[40px] p-6 sm:p-12 text-zinc-800 relative overflow-hidden border border-zinc-200 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-10">
          <div className="text-[#d21f3c] shrink-0">
             <Logo className="h-16 sm:h-24 w-auto" />
          </div>
          <div className="h-24 w-px bg-zinc-200 hidden md:block"></div>
          <div>
            <h2 className="text-3xl sm:text-5xl font-black mb-2 tracking-tighter uppercase text-zinc-900 leading-tight">División de <br/><span className="text-[#d21f3c]">{area.name}</span></h2>
            <p className="text-zinc-500 max-w-xl text-xs sm:text-sm font-medium leading-relaxed uppercase tracking-widest">{area.description}</p>
          </div>
        </div>
        <div className="absolute right-[-40px] bottom-[-40px] opacity-[0.03] text-[#d21f3c]">
          <i className="fas fa-building text-[320px] -rotate-12"></i>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-12">
          {/* Registro de Actividad IA */}
          <section className="space-y-8">
            <h3 className="text-xl font-black text-zinc-800 flex items-center gap-4 uppercase tracking-tighter">
              <i className="fas fa-brain text-[#d21f3c]"></i> Inteligencia Estratégica
            </h3>
            <div className="space-y-6">
              {insights.filter(i => i.areaId === area.id).length > 0 ? (
                insights.filter(i => i.areaId === area.id).map(insight => (
                  <div key={insight.id} className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm hover:border-[#d21f3c]/20 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-black text-zinc-800 uppercase tracking-tight text-sm">{insight.title}</h4>
                      <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{new Date(insight.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-zinc-600 text-sm whitespace-pre-wrap leading-relaxed font-medium">{insight.content}</p>
                  </div>
                ))
              ) : (
                <div className="bg-white border-2 border-dashed border-zinc-200 rounded-[40px] p-16 text-center text-zinc-300">
                  <i className="fas fa-inbox text-4xl mb-4 opacity-20 text-zinc-200"></i>
                  <p className="font-bold uppercase text-xs tracking-widest">Esperando Transmisiones de Estrategia</p>
                </div>
              )}
            </div>
          </section>

          {/* Mensajes entrantes de WhatsApp */}
          <section className="space-y-8">
            <h3 className="text-xl font-black text-zinc-800 flex items-center gap-4 uppercase tracking-tighter">
              <i className="fab fa-whatsapp text-[#d21f3c]"></i> Mensajes WhatsApp Derivados
            </h3>
            <div className="space-y-4">
              {areaMessages.length > 0 ? (
                areaMessages.map(msg => (
                  <div key={msg.id} className="bg-zinc-50 p-6 rounded-3xl border border-zinc-200 hover:bg-white transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-900 text-white rounded-xl flex items-center justify-center font-black text-[10px]">
                          {msg.sender.charAt(0)}
                        </div>
                        <span className="font-bold text-sm text-zinc-800">{msg.sender}</span>
                      </div>
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="ml-11 space-y-3">
                      <p className="text-sm text-zinc-600 font-medium bg-white p-4 rounded-2xl rounded-tl-none border border-zinc-100 shadow-sm">
                        {msg.content}
                      </p>
                      {msg.response && (
                        <div className="flex gap-2 items-start justify-end">
                          <p className="text-xs text-[#d21f3c] font-bold bg-[#d21f3c]/5 p-3 rounded-2xl rounded-tr-none border border-[#d21f3c]/10 max-w-[80%]">
                            {msg.response}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-zinc-50/50 border border-zinc-100 rounded-[32px] p-12 text-center text-zinc-300">
                  <p className="font-bold uppercase text-[10px] tracking-widest">Sin interacciones registradas en esta división</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-zinc-200 shadow-sm">
            <h3 className="text-lg font-black text-zinc-800 mb-6 sm:mb-8 uppercase tracking-tighter">Métricas de Área</h3>
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Recursos Asignados</span>
                  <span className="font-black text-[#d21f3c] text-lg">${area.budget.toLocaleString()}</span>
                </div>
                <div className="w-full bg-zinc-50 rounded-full h-2.5 overflow-hidden border border-zinc-200">
                  <div className="bg-[#d21f3c] h-full rounded-full w-2/3 shadow-[0_0_8px_rgba(210,31,60,0.1)]"></div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-zinc-100">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Salud Operativa</span>
                  <span className="text-xs font-black text-zinc-700 uppercase">92% Nominal</span>
                </div>
                <div className="w-full bg-zinc-50 rounded-full h-2.5 overflow-hidden border border-zinc-200">
                  <div className="bg-zinc-400 h-full rounded-full w-[92%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 p-10 rounded-[40px] border border-zinc-200">
             <h3 className="text-lg font-black text-zinc-800 mb-4 uppercase tracking-tighter">Soporte Crítico</h3>
             <p className="text-sm text-zinc-500 mb-8 font-medium">Deriva incidencias de la división directamente al equipo de seguridad.</p>
             <button className="w-full py-4 bg-white border border-zinc-200 text-zinc-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 hover:text-white hover:border-zinc-800 transition-all shadow-sm">
               Abrir Ticket de Sistema
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentHub;
