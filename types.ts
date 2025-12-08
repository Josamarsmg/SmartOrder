export enum OrderStatus {
  PENDING = 'Enviado',
  PREPARING = 'Em preparo',
  READY = 'Pronto',
  SERVED = 'Servido',
  CLOSED = 'Fechado'
}

export enum Category {
  STARTERS = 'Entradas',
  MAINS = 'Pratos Principais',
  DRINKS = 'Bebidas',
  DESSERTS = 'Sobremesas'
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
  tempId: string; // Unique ID for cart management (e.g. same item with different notes)
}

export interface Order {
  id: string;
  tableId: string;
  customerName: string; // Nome do cliente que fez o pedido
  items: CartItem[];
  total: number;
  status: OrderStatus;
  timestamp: number;
}

export interface TableSession {
  id: string; // Table Number
  isActive: boolean;
  orders: Order[];
  totalAccumulated: number;
}

// User Management Types
export type UserRole = 'Admin' | 'Cozinha' | 'Garçom';
export type UserStatus = 'Ativo' | 'Inativo';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Adicionado campo de senha (opcional na tipagem para segurança no front, mas usado no mock)
  role: UserRole;
  status: UserStatus;
}

// Helper types for UI
export type ViewMode = 'LOGIN' | 'LANDING' | 'CUSTOMER' | 'KITCHEN' | 'ADMIN' | 'MENU_EDITOR' | 'HISTORY';