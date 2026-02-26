
import { User, Area, AreaInsight, UserRole, TableSchema, WhatsAppMessage, MessageRouting, DashboardState } from './types';
import { GLOBAL_CONFIG } from './constants';

const INITIAL_AREAS: Area[] = [];

const INITIAL_USERS: User[] = [];

const KEYS = {
  USERS: 'kioto_users',
  AREAS: 'kioto_areas',
  INSIGHTS: 'kioto_insights',
  CUSTOM_TABLES: 'kioto_custom_tables',
  SCHEMAS: 'kioto_schemas',
  MESSAGES: 'kioto_whatsapp_messages',
  ROUTINGS: 'kioto_routings',
  SHEET_URL: 'kioto_sheet_url',
  LAST_SYNC: 'kioto_last_sync'
};

// Intenta migrar datos de la versión antigua (nexus) si existen y no hay datos nuevos
const migrateFromOldVersion = () => {
  const oldUsers = localStorage.getItem('nexus_users');
  if (oldUsers && !localStorage.getItem(KEYS.USERS)) {
    const keys = ['users', 'areas', 'insights', 'custom_tables', 'schemas', 'whatsapp_messages', 'routings'];
    keys.forEach(k => {
      const oldVal = localStorage.getItem(`nexus_${k}`);
      if (oldVal) {
        const newKey = (KEYS as any)[k.toUpperCase().replace(/_tables$/, 'CUSTOM_TABLES').replace(/whatsapp_messages$/, 'MESSAGES')];
        if (newKey) localStorage.setItem(newKey, oldVal);
      }
    });
  }
};

export const getInitialState = (): DashboardState => {
  migrateFromOldVersion();

  const safeParse = (key: string, fallback: any) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.error(`Error parsing localStorage key "${key}":`, e);
      return fallback;
    }
  };

  return {
    users: safeParse(KEYS.USERS, INITIAL_USERS),
    areas: safeParse(KEYS.AREAS, INITIAL_AREAS),
    insights: safeParse(KEYS.INSIGHTS, []),
    customTables: safeParse(KEYS.CUSTOM_TABLES, {}),
    tableSchemas: safeParse(KEYS.SCHEMAS, []),
    whatsappMessages: safeParse(KEYS.MESSAGES, []),
    messageRoutings: safeParse(KEYS.ROUTINGS, []),
    googleSheetUrl: GLOBAL_CONFIG.MASTER_SHEET_URL || localStorage.getItem(KEYS.SHEET_URL) || undefined,
    lastSync: localStorage.getItem(KEYS.LAST_SYNC) || undefined,
    currentUser: null
  };
};

export const persistState = (state: Partial<DashboardState>) => {
  // Deshabilitado para forzar uso de servidor/sheet
  console.log("Persistencia local deshabilitada. Usando servidor central.");
};

export const exportKiotoBackup = () => {
  const safeGet = (key: string, fallback: string) => {
    try {
      return JSON.parse(localStorage.getItem(key) || fallback);
    } catch (e) {
      return JSON.parse(fallback);
    }
  };

  const data = {
    users: safeGet(KEYS.USERS, '[]'),
    areas: safeGet(KEYS.AREAS, '[]'),
    insights: safeGet(KEYS.INSIGHTS, '[]'),
    customTables: safeGet(KEYS.CUSTOM_TABLES, '{}'),
    tableSchemas: safeGet(KEYS.SCHEMAS, '[]'),
    whatsappMessages: safeGet(KEYS.MESSAGES, '[]'),
    messageRoutings: safeGet(KEYS.ROUTINGS, '[]'),
    version: '2.0',
    exportedAt: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kioto_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};

export const importKiotoBackup = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    if (!data.users || !data.areas) throw new Error("Formato de backup inválido");
    
    localStorage.setItem(KEYS.USERS, JSON.stringify(data.users));
    localStorage.setItem(KEYS.AREAS, JSON.stringify(data.areas));
    localStorage.setItem(KEYS.INSIGHTS, JSON.stringify(data.insights || []));
    localStorage.setItem(KEYS.CUSTOM_TABLES, JSON.stringify(data.customTables || {}));
    localStorage.setItem(KEYS.SCHEMAS, JSON.stringify(data.tableSchemas || []));
    localStorage.setItem(KEYS.MESSAGES, JSON.stringify(data.whatsappMessages || []));
    localStorage.setItem(KEYS.ROUTINGS, JSON.stringify(data.messageRoutings || []));
    
    return true;
  } catch (e) {
    console.error("Error importando backup:", e);
    return false;
  }
};
