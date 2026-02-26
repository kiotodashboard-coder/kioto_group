
export enum UserRole {
  SUPER_USER = 'SUPER_USER',
  USER = 'USER'
}

export interface Area {
  id: string;
  name: string;
  description: string;
  budget: number;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  assignedAreaId?: string;
  permissions?: string[]; // Roles dinámicos: lista de acciones permitidas
  token?: string; // Token de sesión
}

export interface AreaInsight {
  id: string;
  areaId: string;
  title: string;
  content: string;
  timestamp: string;
}

export interface FieldDefinition {
  name: string;
  type: 'text' | 'number' | 'date' | 'currency';
}

export interface TableSchema {
  id: string;
  name: string;
  fields: string[];
  fieldDefinitions?: FieldDefinition[];
  lastAutoId?: number;
}

export interface WhatsAppMessage {
  id: string;
  sender: string;
  content: string;
  response: string;
  timestamp: string;
  status: 'delivered' | 'read' | 'failed';
  detectedAreaId?: string;
}

export interface MessageRouting {
  id: string;
  keyword: string;
  areaId: string;
  priority: number;
}

export interface DashboardState {
  users: User[];
  areas: Area[];
  insights: AreaInsight[];
  customTables: Record<string, any[]>;
  tableSchemas: TableSchema[];
  whatsappMessages: WhatsAppMessage[];
  messageRoutings: MessageRouting[];
  currentUser: User | null;
  googleSheetUrl?: string;
  lastSync?: string;
}
