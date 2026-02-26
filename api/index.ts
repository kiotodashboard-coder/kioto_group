import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determinar ruta de persistencia (Vercel solo permite escribir en /tmp)
const isVercel = !!process.env.VERCEL;
const DATA_FILE = isVercel ? path.join("/tmp", "data.json") : path.join(__dirname, "data.json");

// Sistema de logs para depuración remota
const serverLogs: string[] = [];
const addLog = (msg: string) => {
  const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
  serverLogs.push(entry);
  if (serverLogs.length > 100) serverLogs.shift();
  console.log(msg);
};
const MASTER_SHEET_URL = 'https://script.google.com/macros/s/AKfycbySj40qtOz8ZuG2HD2VIdr85nU-K8PwqRTiZHsxTCUA7Fp3tFF-z0G4zhHbQVPfdLc-/exec';

// Estado global (Cargado síncronamente si existe el archivo)
let state = {
  users: [],
  areas: [],
  insights: [],
  customTables: {},
  tableSchemas: [],
  whatsappMessages: [],
  messageRoutings: [],
  googleSheetUrl: MASTER_SHEET_URL,
  lastSync: null,
  syncStatus: 'initial',
  lastError: null as string | null
};

if (fs.existsSync(DATA_FILE)) {
  try {
    const savedData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    state = { ...state, ...savedData, googleSheetUrl: MASTER_SHEET_URL };
  } catch (e) {
    console.error("Error loading data.json:", e);
  }
}

// Funciones de utilidad
const hashPassword = (password: string) => crypto.createHash('sha256').update(password).digest('hex');

const generateToken = (userId: string) => {
  const secret = "kioto-secret-key-2026";
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString('base64');
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + (24 * 60 * 60 * 1000) })).toString('base64');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64');
  return `${header}.${payload}.${signature}`;
};

const syncFromSheets = async () => {
  if (!MASTER_SHEET_URL) return;
  try {
    addLog(`🔄 Sincronizando desde Google Sheets...`);
    const fetchUrl = `${MASTER_SHEET_URL}${MASTER_SHEET_URL.includes('?') ? '&' : '?'}t=${Date.now()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(fetchUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const text = await response.text();
      let remoteData;
      try {
        remoteData = JSON.parse(text);
      } catch (parseError) {
        addLog(`❌ Error parseando JSON de Google Sheets. Inicio de respuesta: ${text.substring(0, 100)}`);
        state.syncStatus = 'error';
        state.lastError = `Respuesta no es JSON válido. Verifica que el Apps Script esté publicado como Aplicación Web y tenga acceso para 'Cualquiera'.`;
        return;
      }

      if (remoteData && remoteData.users && Array.isArray(remoteData.users)) {
        const processedUsers = remoteData.users.map((u: any) => {
          if (u.permissions && typeof u.permissions === 'string') {
            u.permissions = u.permissions.split(',').map((p: string) => p.trim());
          }
          return u;
        });
        state = { ...state, ...remoteData, users: processedUsers, lastSync: new Date().toLocaleString(), syncStatus: 'success', lastError: null };
        fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
        addLog(`✅ Sincronización exitosa. Usuarios: ${state.users.length}`);
      } else {
        addLog(`⚠️ Respuesta de Google Sheets no contiene el formato esperado (falta array 'users').`);
        state.syncStatus = 'error';
        state.lastError = "El Sheet no devolvió una lista de usuarios válida.";
      }
    } else {
      addLog(`❌ Google Sheets respondió con error: ${response.status}`);
      state.syncStatus = 'error';
      state.lastError = `Error de Google Sheets: ${response.status}`;
    }
  } catch (e: any) {
    addLog(`❌ Error en sincronización: ${e.message}`);
    state.syncStatus = 'error';
    state.lastError = `Error de red: ${e.message}`;
  }
};

// Configuración de Express
const app = express();

app.use(cors({
  origin: ['https://kiotogroup.vercel.app', 'http://localhost:3000'],
  credentials: true
}));

app.use((req, res, next) => {
  res.setHeader('X-Kioto-API', 'true');
  next();
});

app.use(express.json({ limit: '50mb' }));

// Rutas de API (Definidas en un Router para flexibilidad)
const apiRouter = express.Router();

apiRouter.get("/", (req, res) => res.json({ status: "ok", service: "Kioto API", time: new Date().toISOString() }));

apiRouter.post("/login", async (req, res) => {
  const { credential, password } = req.body;
  addLog(`🔑 Intento de login: ${credential}`);

  if (!credential || !password) {
    return res.status(400).json({ error: "Credenciales incompletas" });
  }

  // Si no hay usuarios cargados, forzar una sincronización antes de fallar
  if (state.users.length === 0) {
    addLog("⚠️ Lista de usuarios vacía. Intentando sincronizar con la nube antes de validar...");
    await syncFromSheets();
  }

  const cleanCredential = credential.trim().toLowerCase();
  const hashedPassword = hashPassword(password.trim());
  
  addLog(`🔍 Buscando usuario... (Total en memoria: ${state.users.length})`);

  const user = state.users.find((u: any) => {
    const uEmail = u.email?.toString().trim().toLowerCase();
    const uPhone = u.phone?.toString().trim();
    const uPass = u.password?.toString().trim();
    
    const matchCredential = (uEmail === cleanCredential || uPhone === cleanCredential);
    const matchPassword = (uPass === password.trim() || uPass === hashedPassword);
    
    return matchCredential && matchPassword;
  });

  if (user) {
    addLog(`✅ Login exitoso para: ${user.name || user.email}`);
    if (user.password === password.trim()) {
      user.password = hashedPassword;
      fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
    }
    const token = generateToken(user.id);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: { ...userWithoutPassword, token } });
  } else {
    addLog(`❌ Login fallido para: ${credential}. Credenciales no coinciden.`);
    res.status(401).json({ error: "Credenciales inválidas" });
  }
});

apiRouter.post("/verify-token", (req, res) => {
  const { token } = req.body;
  try {
    const [header, payload, signature] = token.split('.');
    const secret = "kioto-secret-key-2026";
    const expectedSignature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64');
    if (signature !== expectedSignature) throw new Error();
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (decoded.exp < Date.now()) throw new Error();
    const user = state.users.find((u: any) => u.id === decoded.userId);
    if (!user) throw new Error();
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (e) {
    res.status(401).json({ error: "Token inválido" });
  }
});

apiRouter.get("/state", async (req, res) => {
  if (state.users.length === 0) await syncFromSheets();
  res.json({ ...state, serverTime: new Date().toISOString() });
});

apiRouter.get("/sync", async (req, res) => {
  if (req.query.reset === 'true') {
    state.users = [];
    state.lastSync = null;
    state.syncStatus = 'initial';
    state.lastError = null;
    if (fs.existsSync(DATA_FILE)) fs.unlinkSync(DATA_FILE);
  }
  await syncFromSheets();
  res.json({ 
    success: state.syncStatus === 'success', 
    userCount: state.users.length, 
    lastSync: state.lastSync,
    error: state.lastError 
  });
});

apiRouter.post("/state", async (req, res) => {
  const newState = req.body;
  state = { ...state, ...newState };
  
  // Persistencia local
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
  
  // Sincronización automática con Google Sheets (Cloud)
  const targetSheetUrl = state.googleSheetUrl || MASTER_SHEET_URL;
  
  if (targetSheetUrl) {
    addLog(`☁️ Sincronización automática disparada hacia: ${targetSheetUrl.substring(0, 40)}...`);
    
    // Ejecutamos en segundo plano para no bloquear la respuesta al cliente
    fetch(targetSheetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...state, 
        exportedAt: new Date().toISOString(),
        syncSource: 'automatic_trigger'
      })
    }).then(async (sheetRes) => {
      if (sheetRes.ok) {
        addLog("✅ Cloud Sync exitoso (Auto)");
      } else {
        const errText = await sheetRes.text();
        addLog(`⚠️ Cloud Sync falló (Auto): ${sheetRes.status} - ${errText.substring(0, 100)}`);
      }
    }).catch((err) => {
      addLog(`❌ Error de red en Cloud Sync (Auto): ${err.message}`);
    });
  }
  
  res.json({ success: true, lastSync: new Date().toLocaleString() });
});

apiRouter.get("/logs", (req, res) => res.json({ logs: serverLogs }));

// Montar el router únicamente en el prefijo /api
app.use("/api", apiRouter);

// Manejador de 404 específico para la API (Solo para rutas que empiecen con /api)
app.use("/api/*", (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: "api_not_found", 
    path: req.originalUrl,
    message: "La ruta de API solicitada no existe." 
  });
});

// Inicialización asíncrona (Vite / Sync inicial)
const init = async () => {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
      app.use(vite.middlewares);
    } catch (e) {}
  } else if (!process.env.VERCEL) {
    // En local producción, servimos estáticos. En Vercel, Vercel lo hace por nosotros.
    app.use(express.static(path.join(__dirname, "../dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../dist", "index.html")));
  }

  if (!process.env.VERCEL) {
    app.listen(3000, "0.0.0.0", () => addLog(`Servidor corriendo en puerto 3000`));
  }
  
  // Sincronización inicial en segundo plano
  syncFromSheets();
  setInterval(syncFromSheets, 5 * 60 * 1000);
};

init();

export default app;
