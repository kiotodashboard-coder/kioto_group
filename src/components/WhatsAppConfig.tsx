
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Area, DashboardState, WhatsAppMessage, MessageRouting } from '../types';

interface WhatsAppConfigProps {
  state: DashboardState;
  onAddMessage: (msg: WhatsAppMessage) => void;
}

const WhatsAppConfig: React.FC<WhatsAppConfigProps> = ({ state, onAddMessage }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://api.kioto-dashboard.com/whatsapp/webhook');
  const [testMessage, setTestMessage] = useState('');
  const [botResponse, setBotResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const simulateBot = async () => {
    if (!testMessage) return;
    setLoading(true);
    try {
      const lowerMsg = testMessage.toLowerCase();
      const matchedRouting = state.messageRoutings.find(r => lowerMsg.includes(r.keyword));
      const targetArea = matchedRouting ? state.areas.find(a => a.id === matchedRouting.areaId) : null;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const prompt = `
        Eres un asistente de WhatsApp del sistema Dashboard Kioto con temática Cereza. 
        Tienes acceso a los siguientes datos:
        Áreas: ${state.areas.map(a => a.name).join(', ')}
        
        SITUACIÓN ACTUAL: El usuario envió: "${testMessage}"
        ${targetArea ? `DETECCIÓN: Este mensaje parece pertenecer al área de ${targetArea.name} debido a reglas de enrutamiento.` : 'DETECCIÓN: No se detectó área específica de forma automática.'}

        TAREA: Responde al mensaje del empleado de forma cálida y profesional. 
        Si se detectó un área, confirma amablemente que has derivado su consulta a ${targetArea?.name}.
        Responde de forma profesional, corta y amigable. USA EMOJIS RELACIONADOS CON LA MARCA (Cerezas, Tecnología).
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      
      const responseText = result.text || "Lo siento, no pude procesar tu solicitud.";
      setBotResponse(responseText);

      onAddMessage({
        id: Math.random().toString(36).substr(2, 9),
        sender: state.currentUser?.name || "Tester",
        content: testMessage,
        response: responseText,
        timestamp: new Date().toISOString(),
        status: 'delivered',
        detectedAreaId: targetArea?.id
      });

    } catch (e) {
      setBotResponse("Error de conexión con el motor de IA.");
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 space-y-10">
        <div className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-6 mb-10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all ${isConnected ? 'bg-[#d21f3c] text-white shadow-lg shadow-[#d21f3c]/20' : 'bg-zinc-100 text-zinc-300'}`}>
              <i className="fab fa-whatsapp"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Comunicación Business</h3>
              <p className="text-sm font-medium text-zinc-500">Conecta Kioto con las comunicaciones oficiales</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-[32px] border border-zinc-100">
              <div>
                <p className="font-black text-zinc-900 uppercase text-[10px] tracking-widest mb-1">Estado del Enlace</p>
                <p className="text-sm font-medium text-zinc-500">{isConnected ? 'Canal encriptado y activo' : 'Esperando configuración de Meta'}</p>
              </div>
              <button 
                onClick={() => setIsConnected(!isConnected)}
                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  isConnected ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-[#d21f3c] text-white hover:bg-[#b01a32] shadow-lg shadow-[#d21f3c]/20'
                }`}
              >
                {isConnected ? 'Desconectar' : 'Vincular API'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 ml-1">Webhook Receptor</label>
                <input 
                  type="text" 
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#d21f3c] text-sm font-bold text-zinc-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 ml-1">WhatsApp Business ID</label>
                <input 
                  type="password" 
                  placeholder="••••••••••••"
                  className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#d21f3c] text-sm font-bold text-zinc-800"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm">
          <h4 className="font-black text-zinc-900 mb-8 flex items-center gap-3 uppercase tracking-tighter">
            <i className="fas fa-terminal text-[#d21f3c]"></i> Terminal de Pruebas Cherry
          </h4>
          <div className="space-y-6">
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="Simula un mensaje de empleado..."
                value={testMessage}
                onChange={e => setTestMessage(e.target.value)}
                className="flex-1 px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#d21f3c] font-medium"
              />
              <button 
                disabled={loading}
                onClick={simulateBot}
                className="bg-zinc-900 text-white px-8 py-4 rounded-2xl hover:bg-[#d21f3c] disabled:opacity-50 transition-all shadow-xl shadow-black/10 flex items-center justify-center"
              >
                {loading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-paper-plane"></i>}
              </button>
            </div>
            
            {botResponse && (
              <div className="p-8 bg-[#d21f3c]/5 rounded-[32px] border border-[#d21f3c]/10 animate-in fade-in slide-in-from-top-4">
                <p className="text-[10px] font-black text-[#d21f3c] uppercase tracking-widest mb-4">Emulación de Respuesta:</p>
                <p className="text-zinc-800 font-medium leading-relaxed">{botResponse}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 p-10 rounded-[40px] text-white border border-zinc-800 shadow-2xl">
        <h4 className="text-xl font-black mb-10 uppercase tracking-tighter text-[#d21f3c]">Protocolo de Inicio</h4>
        <ul className="space-y-8">
          <li className="flex gap-4">
            <span className="w-8 h-8 bg-[#d21f3c] rounded-full flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg shadow-[#d21f3c]/20">1</span>
            <div>
              <p className="font-black uppercase text-[10px] tracking-widest text-[#d21f3c] mb-1">Verificación</p>
              <p className="text-xs text-zinc-400 font-medium">Obtén un número en el portal Meta Developers.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="w-8 h-8 bg-[#d21f3c] rounded-full flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg shadow-[#d21f3c]/20">2</span>
            <div>
              <p className="font-black uppercase text-[10px] tracking-widest text-[#d21f3c] mb-1">Provisión</p>
              <p className="text-xs text-zinc-400 font-medium">Introduce el ID de App y el Token de Acceso.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="w-8 h-8 bg-[#d21f3c] rounded-full flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg shadow-[#d21f3c]/20">3</span>
            <div>
              <p className="font-black uppercase text-[10px] tracking-widest text-[#d21f3c] mb-1">Sincronización</p>
              <p className="text-xs text-zinc-400 font-medium">Apunta el Webhook y activa el bot inteligente.</p>
            </div>
          </li>
        </ul>
        <div className="mt-12 pt-10 border-t border-zinc-800">
          <button className="w-full py-4 bg-white/5 hover:bg-[#d21f3c] rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border border-white/10 hover:border-[#d21f3c]">
            Documentación Técnica
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConfig;
