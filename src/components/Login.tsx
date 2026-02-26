
import React, { useState } from 'react';
import { User } from '../types';
import Logo from './Logo';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
  lastSync?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, users, lastSync }) => {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (users.length === 0) {
      setError('Error: No se han cargado usuarios desde la nube. Por favor, espera o verifica el Sheet.');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, password })
      });

      if (!response.headers.get('X-Kioto-API') || !response.headers.get('Content-Type')?.includes('application/json')) {
        const text = await response.text();
        console.error("⚠️ Error de respuesta Login:", text.substring(0, 200));
        setError('⚠️ Error de despliegue: La respuesta no es un JSON válido del servidor.');
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        // Guardar token para persistencia
        if (data.user.token) {
          localStorage.setItem('kioto_session_token', data.user.token);
        }
        onLogin(data.user);
      } else {
        setError(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-[#d21f3c]/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-zinc-200/60 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-12 flex flex-col items-center">
          <div 
            className="text-[#d21f3c] transition-all hover:scale-105 duration-700 drop-shadow-sm cursor-help"
            onDoubleClick={async () => {
              try {
                const res = await fetch('/api/logs');
                const data = await res.json();
                alert("SERVER LOGS:\n" + data.logs.join('\n'));
              } catch (e) {
                alert("No se pudieron cargar los logs.");
              }
            }}
          >
            <Logo className="h-28 w-auto" />
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          {error && (
            <div className="bg-[#d21f3c] text-white px-6 py-4 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest animate-bounce shadow-lg shadow-[#d21f3c]/20">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="group">
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 ml-1 transition-colors group-focus-within:text-[#d21f3c]">
                Correo o Teléfono
              </label>
              <div className="relative">
                <i className="fas fa-user-shield absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 transition-colors group-focus-within:text-[#d21f3c]"></i>
                <input 
                  type="text" 
                  required
                  className="w-full bg-white/40 backdrop-blur-md border border-zinc-200 text-zinc-900 px-14 py-5 rounded-3xl outline-none focus:ring-2 focus:ring-[#d21f3c]/20 focus:border-[#d21f3c] transition-all placeholder:text-zinc-300 font-bold shadow-sm"
                  placeholder="ID de acceso..."
                  value={credential}
                  onChange={e => setCredential(e.target.value)}
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 ml-1 transition-colors group-focus-within:text-[#d21f3c]">
                Contraseña
              </label>
              <div className="relative">
                <i className="fas fa-key absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 transition-colors group-focus-within:text-[#d21f3c]"></i>
                <input 
                  type="password" 
                  required
                  className="w-full bg-white/40 backdrop-blur-md border border-zinc-200 text-zinc-900 px-14 py-5 rounded-3xl outline-none focus:ring-2 focus:ring-[#d21f3c]/20 focus:border-[#d21f3c] transition-all placeholder:text-zinc-300 font-bold shadow-sm"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-[#d21f3c] hover:bg-[#b01a32] text-white font-black py-5 rounded-3xl transition-all shadow-2xl shadow-[#d21f3c]/30 flex items-center justify-center gap-3 group active:scale-[0.96]"
          >
            ENTRAR
            <i className="fas fa-chevron-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
          </button>

          <div className="pt-10 flex flex-col items-center gap-6">
            <div className="h-px w-12 bg-zinc-200"></div>
            <button 
              type="button"
              disabled={isSyncing}
              onClick={async () => {
                setIsSyncing(true);
                setError('Sincronizando con la nube...');
                try {
                  const res = await fetch('/api/sync');
                  if (!res.headers.get('X-Kioto-API') || !res.headers.get('Content-Type')?.includes('application/json')) {
                    setError('⚠️ Error de despliegue: Respuesta no válida.');
                    return;
                  }
                  const data = await res.json();
                  if (res.ok && data.success) {
                    setError(`Sincronización exitosa: ${data.userCount} usuarios.`);
                    setTimeout(() => window.location.reload(), 1500);
                  } else {
                    setError(data.message || 'Error en la respuesta del servidor.');
                  }
                } catch (e: any) {
                  setError(`Error de red al sincronizar: ${e.message || 'Sin respuesta'}`);
                } finally {
                  setIsSyncing(false);
                }
              }}
              className={`text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isSyncing ? 'text-zinc-300' : 'text-zinc-400 hover:text-[#d21f3c]'}`}
            >
              <i className={`fas fa-sync ${isSyncing ? 'animate-spin' : ''}`}></i> 
              {isSyncing ? 'Sincronizando...' : 'Forzar Sincronización'}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  setIsSyncing(true);
                  setError('Limpiando caché y re-sincronizando...');
                  try {
                    const res = await fetch('/api/sync?reset=true');
                    
                    // Verificar si la respuesta viene realmente de nuestra API y es JSON
                    const contentType = res.headers.get('Content-Type');
                    if (!res.headers.get('X-Kioto-API') || !contentType?.includes('application/json')) {
                      setError('⚠️ Error de despliegue: La respuesta no es un JSON válido.');
                      return;
                    }

                    const text = await res.text();
                    let data;
                    try {
                      data = JSON.parse(text);
                    } catch (parseError) {
                      console.error('Failed to parse JSON. Content:', text);
                      setError(`Error del servidor (No JSON): ${res.status}. Contenido: ${text.substring(0, 50)}...`);
                      return;
                    }

                    if (res.ok && data.success) {
                      setError(`Caché limpia. Usuarios: ${data.userCount}`);
                      setTimeout(() => window.location.reload(), 1500);
                    } else {
                      setError(data.message || `Error ${res.status}: ${data.error || 'Desconocido'}`);
                    }
                  } catch (e: any) {
                    console.error('Sync error details:', e);
                    setError(`Error de conexión (Red): ${e.message || 'Sin respuesta'}`);
                  } finally {
                    setIsSyncing(false);
                  }
                }}
                className="text-[7px] text-zinc-300 hover:text-zinc-500 uppercase tracking-tighter underline mt-1"
              >
                Limpiar Caché Local
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/logs');
                    const data = await res.json();
                    alert("Últimos logs del servidor:\n\n" + data.logs.join('\n'));
                  } catch (e) {
                    alert('No se pudieron obtener los logs.');
                  }
                }}
                className="text-[7px] text-zinc-300 hover:text-zinc-500 uppercase tracking-tighter underline mt-1"
              >
                Ver Logs
              </button>
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-tighter">
                Usuarios en nube: <span className="text-[#d21f3c]">{users.length}</span>
              </p>
              {lastSync && (
                <p className="text-[7px] text-zinc-300 font-medium uppercase tracking-tighter">
                  Última actualización: {lastSync}
                </p>
              )}
            </div>
            <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-widest italic opacity-50">Secure Node v2.5</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
