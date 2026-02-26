
import React, { useState, useEffect } from 'react';
import { User, Area, AreaInsight, UserRole, DashboardState, WhatsAppMessage, MessageRouting } from './types';
import { getInitialState, persistState, exportKiotoBackup, importKiotoBackup } from './store';
import Sidebar from './components/Sidebar';
import DashboardHeader from './components/DashboardHeader';
import UserManager from './components/UserManager';
import AreaManager from './components/AreaManager';
import DepartmentHub from './components/DepartmentHub';
import IntelligenceCenter from './components/IntelligenceCenter';
import DatabaseManager from './components/DatabaseManager';
import WhatsAppConfig from './components/WhatsAppConfig';
import WhatsAppMessages from './components/WhatsAppMessages';
import MessageRouter from './components/MessageRouter';
import Login from './components/Login';

const App: React.FC = () => {
  const [state, setState] = useState<DashboardState>(getInitialState());
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const stateRef = React.useRef(state);

  // Sincronizar el ref con el estado actual
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Cargar estado inicial desde el servidor (Multi-Sesión)
  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        // Timeout de seguridad para la carga inicial
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch('/api/state', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('Content-Type');
          if (!response.headers.get('X-Kioto-API') || !contentType?.includes('application/json')) {
            const text = await response.text();
            console.error("⚠️ Error de respuesta Kioto:", text.substring(0, 200));
            console.warn("⚠️ La respuesta no es un JSON válido del servidor Kioto.");
            setIsLoading(false);
            return;
          }
          const serverState = await response.json();
          
          // Solo actualizar si hay cambios reales para evitar cerrar formularios o perder foco
          // Usamos stateRef.current para evitar cierres de stale state
          const currentState = stateRef.current;
          const hasChanged = JSON.stringify(serverState) !== JSON.stringify({
            users: currentState.users,
            areas: currentState.areas,
            insights: currentState.insights,
            customTables: currentState.customTables,
            tableSchemas: currentState.tableSchemas,
            whatsappMessages: currentState.whatsappMessages,
            messageRoutings: currentState.messageRoutings,
            googleSheetUrl: currentState.googleSheetUrl,
            lastSync: currentState.lastSync
          });

          if (hasChanged) {
            console.log("🔄 Detectados cambios en la nube, actualizando estado de forma invisible...");
            setState(prev => ({ ...prev, ...serverState }));
          }

          // Verificar si hay una sesión activa
          const savedToken = localStorage.getItem('kioto_session_token');
          if (savedToken && !state.currentUser) {
            const verifyRes = await fetch('/api/verify-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: savedToken })
            });
            if (verifyRes.ok) {
              const contentType = verifyRes.headers.get('Content-Type');
              if (!verifyRes.headers.get('X-Kioto-API') || !contentType?.includes('application/json')) {
                console.warn("⚠️ verify-token no es un JSON válido.");
                return;
              }
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                handleLogin(verifyData.user);
              }
            } else {
              localStorage.removeItem('kioto_session_token');
            }
          }
        }
      } catch (error) {
        console.error("Error fetching state from server:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialState();

    // Polling para mantener sincronización entre dispositivos (cada 120s)
    const interval = setInterval(fetchInitialState, 120000);
    return () => clearInterval(interval);
  }, []);

  // Persistencia automática mejorada
  useEffect(() => {
    if (state.currentUser) {
      setIsSaving(true);
      persistState({
        users: state.users,
        areas: state.areas,
        insights: state.insights,
        customTables: state.customTables,
        tableSchemas: state.tableSchemas,
        whatsappMessages: state.whatsappMessages,
        messageRoutings: state.messageRoutings,
        googleSheetUrl: state.googleSheetUrl,
        lastSync: state.lastSync
      });
      const timer = setTimeout(() => setIsSaving(false), 500);
      return () => clearTimeout(timer);
    }
  }, [state.users, state.areas, state.insights, state.customTables, state.tableSchemas, state.whatsappMessages, state.messageRoutings, state.googleSheetUrl, state.lastSync, state.currentUser]);

  const handleLogin = (user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
    setActiveTab(user.role === UserRole.SUPER_USER ? 'overview' : 'my-area');
  };

  const handleLogout = () => {
    localStorage.removeItem('kioto_session_token');
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const updateGlobalState = async (newState: Partial<DashboardState>) => {
    // Actualización local inmediata (Optimista)
    setState(prev => ({ ...prev, ...newState }));

    // Sincronización con el Servidor (Esto propaga a otros dispositivos)
    try {
      // Usamos el ref para asegurarnos de enviar el estado más reciente
      const fullState = { ...stateRef.current, ...newState };
      
      const response = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullState)
      });
      
      if (response.ok) {
        const contentType = response.headers.get('Content-Type');
        if (!response.headers.get('X-Kioto-API') || !contentType?.includes('application/json')) {
          console.warn("⚠️ POST /api/state no es un JSON válido.");
          return;
        }
        const result = await response.json();
        setState(prev => ({ ...prev, lastSync: result.lastSync || new Date().toLocaleString() }));
      }
    } catch (error) {
      console.error("Error syncing with server:", error);
    }
  };

  const addArea = (area: Omit<Area, 'id' | 'createdAt'>) => {
    const newArea: Area = {
      ...area,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    updateGlobalState({ areas: [...state.areas, newArea] });
  };

  const deleteArea = (id: string) => {
    if (confirm('¿Deseas eliminar esta área permanentemente?')) {
      updateGlobalState({ areas: state.areas.filter(a => a.id !== id) });
    }
  };

  const addUser = (user: Omit<User, 'id'>) => {
    const newUser: User = {
      ...user,
      id: Math.random().toString(36).substr(2, 9)
    };
    updateGlobalState({ users: [...state.users, newUser] });
  };

  const deleteUser = (id: string) => {
    if (confirm('¿Deseas eliminar este usuario?')) {
      updateGlobalState({ users: state.users.filter(u => u.id !== id) });
    }
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    const updatedUsers = state.users.map(u => u.id === id ? { ...u, ...updates } : u);
    updateGlobalState({ users: updatedUsers });
  };

  const addInsight = (insight: Omit<AreaInsight, 'id' | 'timestamp'>) => {
    const newInsight: AreaInsight = {
      ...insight,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    updateGlobalState({ insights: [...state.insights, newInsight] });
  };

  const addWAMessage = (msg: WhatsAppMessage) => {
    updateGlobalState({ whatsappMessages: [...state.whatsappMessages, msg] });
  };

  const clearWAMessages = () => {
    updateGlobalState({ whatsappMessages: [] });
  };

  const updateRoutings = (routings: MessageRouting[]) => {
    updateGlobalState({ messageRoutings: routings });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (importKiotoBackup(content)) {
          alert("Backup importado con éxito. El sistema se reiniciará.");
          window.location.reload();
        } else {
          alert("Error al importar el archivo. Verifica el formato.");
        }
      };
      reader.readAsText(file);
    }
  };

  if (!state.currentUser) {
    return (
      <div className="relative">
        {isLoading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[#d21f3c] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sincronizando con la nube...</p>
          </div>
        )}
        <Login 
          onLogin={handleLogin} 
          users={state.users} 
          lastSync={state.lastSync}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white relative">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }} 
        currentUser={state.currentUser}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 flex flex-col min-w-0 relative">
        <DashboardHeader 
          user={state.currentUser} 
          onLogout={handleLogout}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 bg-zinc-50/50">
          <div className="max-w-7xl mx-auto">
            {/* Health Indicator - Rojo Cereza */}
            <div className="flex justify-end mb-8">
               <div className={`flex items-center gap-3 px-5 py-2 rounded-2xl text-[10px] font-black tracking-widest transition-all duration-500 border ${
                 isSaving 
                 ? 'bg-zinc-100 text-[#d21f3c] border-[#d21f3c]/20' 
                 : 'bg-white text-zinc-300 border-zinc-200'
               }`}>
                  <i className={`fas ${isSaving ? 'fa-sync-alt animate-spin' : 'fa-shield-check text-[#d21f3c]'}`}></i>
                  {isSaving ? 'CIFRANDO CAMBIOS...' : 'SISTEMA SINCRONIZADO'}
               </div>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-12 animate-in fade-in duration-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-zinc-200 hover:border-[#d21f3c]/20 transition-all group">
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">Personal Activo</p>
                    <h3 className="text-4xl font-black text-zinc-800 group-hover:text-[#d21f3c] transition-colors">{state.users.length}</h3>
                  </div>
                  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-zinc-200 hover:border-[#d21f3c]/20 transition-all group">
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">Divisiones</p>
                    <h3 className="text-4xl font-black text-[#d21f3c]">{state.areas.length}</h3>
                  </div>
                  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-zinc-200 hover:border-[#d21f3c]/20 transition-all group">
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">Rutas Lógicas</p>
                    <h3 className="text-4xl font-black text-zinc-800 group-hover:text-[#d21f3c] transition-colors">{state.messageRoutings.length}</h3>
                  </div>
                  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-zinc-200 hover:border-[#d21f3c]/20 transition-all group">
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">Interacciones WA</p>
                    <h3 className="text-4xl font-black text-zinc-500">{state.whatsappMessages.length}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm">
                      <h3 className="text-2xl font-black text-zinc-800 mb-8 flex items-center gap-4 uppercase tracking-tighter">
                        <i className="fas fa-chart-line text-[#d21f3c]"></i> Flujo de Recursos
                      </h3>
                      <div className="space-y-8">
                        {state.areas.map(area => (
                          <div key={area.id} className="space-y-3">
                            <div className="flex justify-between items-end">
                              <span className="font-bold text-zinc-600 tracking-tight">{area.name}</span>
                              <span className="text-xs font-black text-zinc-400">${area.budget.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden border border-zinc-200">
                              <div 
                                className="bg-[#d21f3c] h-full rounded-full transition-all duration-1000" 
                                style={{ width: `${Math.min(100, (area.budget / 200000) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>
                   
                   <div className="bg-zinc-100 rounded-[40px] p-10 text-zinc-800 relative overflow-hidden flex flex-col justify-center border border-zinc-200 shadow-sm">
                      <div className="relative z-10">
                        <div className="w-16 h-1 bg-[#d21f3c] mb-8"></div>
                        <h3 className="text-3xl font-black mb-4 tracking-tighter uppercase">Comunicación <br/><span className="text-zinc-400">Corporativa</span></h3>
                        <p className="text-zinc-500 mb-10 max-w-sm font-medium leading-relaxed">
                          Centraliza entradas de WhatsApp Business con enrutamiento de precisión y diseño minimalista cereza.
                        </p>
                        <div className="flex flex-wrap gap-4">
                          <button 
                            onClick={() => setActiveTab('wa-router')}
                            className="bg-[#d21f3c] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#b01a32] transition-all shadow-xl shadow-[#d21f3c]/20"
                          >
                            Reglas de Ruta
                          </button>
                          <button 
                            onClick={() => setActiveTab('wa-messages')}
                            className="bg-white text-zinc-500 border border-zinc-200 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-50 hover:text-zinc-800 transition-all shadow-sm"
                          >
                            Ver Historial
                          </button>
                        </div>
                      </div>
                      <i className="fab fa-whatsapp absolute right-[-40px] bottom-[-40px] text-[240px] text-[#d21f3c]/[0.02] -rotate-12"></i>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'areas' && (
              <AreaManager 
                areas={state.areas} 
                onAddArea={addArea} 
                onDeleteArea={deleteArea} 
              />
            )}

            {activeTab === 'users' && (
              <UserManager 
                users={state.users} 
                areas={state.areas} 
                onAddUser={addUser} 
                onDeleteUser={deleteUser}
                onUpdateUser={updateUser}
              />
            )}

            {activeTab === 'db-master' && (
              <div className="space-y-10">
                <div className="bg-white border border-zinc-200 p-10 rounded-[40px] flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm">
                   <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-zinc-50 rounded-[24px] flex items-center justify-center text-[#d21f3c] border border-zinc-100">
                        <i className="fas fa-database text-2xl"></i>
                     </div>
                     <div>
                       <h3 className="font-black text-zinc-800 text-xl tracking-tight uppercase">Respaldo de Información</h3>
                       <p className="text-sm text-zinc-400 font-medium">Exportación segura del ecosistema completo en formato JSON.</p>
                     </div>
                   </div>
                   <div className="flex gap-4 w-full md:w-auto">
                      <button 
                        onClick={exportKiotoBackup}
                        className="flex-1 md:flex-none px-8 py-4 bg-zinc-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-700 transition-all shadow-lg"
                      >
                        <i className="fas fa-download mr-2"></i> Descargar
                      </button>
                      <label className="flex-1 md:flex-none px-8 py-4 bg-white border-2 border-zinc-200 text-zinc-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-50 cursor-pointer text-center transition-all">
                        <i className="fas fa-upload mr-2"></i> Importar
                        <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                      </label>
                   </div>
                </div>
                <DatabaseManager 
                  state={state} 
                  onUpdateState={updateGlobalState} 
                />
              </div>
            )}

            {activeTab === 'whatsapp' && (
              <WhatsAppConfig state={state} onAddMessage={addWAMessage} />
            )}

            {activeTab === 'wa-router' && (
              <MessageRouter 
                areas={state.areas} 
                routings={state.messageRoutings} 
                onUpdateRoutings={updateRoutings} 
              />
            )}

            {activeTab === 'wa-messages' && (
              <WhatsAppMessages messages={state.whatsappMessages} onClear={clearWAMessages} areas={state.areas} />
            )}

            {activeTab === 'my-area' && (
              <DepartmentHub 
                area={state.areas.find(a => a.id === state.currentUser?.assignedAreaId)} 
                insights={state.insights} 
                whatsappMessages={state.whatsappMessages}
              />
            )}

            {activeTab === 'ai-hub' && (
              <IntelligenceCenter 
                areas={state.areas} 
                onSaveInsight={addInsight} 
                currentUser={state.currentUser}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
