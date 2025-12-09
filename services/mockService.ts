import { Order, OrderStatus, CartItem, MenuItem, User } from '../types';
import { MENU_ITEMS } from '../constants';

// ============================================================================
// MOCK SERVICE (LOCAL STORAGE)
// Substituindo Firebase por LocalStorage para corrigir erros de módulo e permitir execução offline.
// ============================================================================

const STORAGE_KEYS = {
  USERS: 'smartorder_users',
  MENU: 'smartorder_menu',
  ORDERS: 'smartorder_orders'
};

// Types for listeners
type OrderListener = (orders: Order[]) => void;
const orderListeners: OrderListener[] = [];

// Helper to simulate delay for realism
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to get data from storage
const getFromStorage = <T>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultVal;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultVal;
  }
};

// Helper to save to storage
const saveToStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ============================================================================
// SEED AUTOMÁTICO (Preencher LocalStorage vazio)
// ============================================================================
const seedDatabaseIfNeeded = () => {
  // Users
  const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
  if (users.length === 0) {
    console.log("🌱 [Mock] Banco de dados vazio detectado. Criando usuário admin padrão...");
    const admin: User = {
      id: 'admin-user',
      name: 'Administrador',
      email: 'smartorder',
      password: '1234',
      role: 'Admin',
      status: 'Ativo'
    };
    saveToStorage(STORAGE_KEYS.USERS, [admin]);
  }

  // Menu
  const menu = getFromStorage<MenuItem[]>(STORAGE_KEYS.MENU, []);
  if (menu.length === 0) {
     console.log("🌱 [Mock] Criando cardápio padrão...");
     saveToStorage(STORAGE_KEYS.MENU, MENU_ITEMS);
  }

  // Orders
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      saveToStorage(STORAGE_KEYS.ORDERS, []);
  }
};

// Executa a verificação ao carregar
seedDatabaseIfNeeded();

// Broadcast updates to listeners (simulates real-time)
const notifyOrderListeners = () => {
  const orders = getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
  orderListeners.forEach(listener => listener(orders));
};

// Listen for storage events (support for multiple tabs)
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEYS.ORDERS) {
    notifyOrderListeners();
  }
});

export const MockService = {
  // isConfigured: false indica "Modo Demo" no LoginApp
  isConfigured: false,

  // --- Diagnostic Method ---
  checkConnection: async (): Promise<{success: boolean, errorType?: 'API_NOT_ENABLED' | 'PERMISSION_DENIED' | 'UNKNOWN'}> => {
    await delay(300);
    return { success: true };
  },

  // --- Auth Methods ---
  login: async (email: string, password: string): Promise<User | null> => {
    await delay(600);
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const user = users.find(u => u.email === email && u.password === password && u.status === 'Ativo');
    return user || null;
  },

  // --- Menu Management Methods ---
  getMenu: async (): Promise<MenuItem[]> => {
    await delay(300);
    return getFromStorage<MenuItem[]>(STORAGE_KEYS.MENU, []);
  },

  addMenuItem: async (item: Omit<MenuItem, 'id'>): Promise<MenuItem> => {
    await delay(300);
    const menu = getFromStorage<MenuItem[]>(STORAGE_KEYS.MENU, []);
    const newItem: MenuItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
    menu.push(newItem);
    saveToStorage(STORAGE_KEYS.MENU, menu);
    return newItem;
  },

  updateMenuItem: async (item: MenuItem): Promise<void> => {
    await delay(300);
    const menu = getFromStorage<MenuItem[]>(STORAGE_KEYS.MENU, []);
    const index = menu.findIndex(i => i.id === item.id);
    if (index !== -1) {
      menu[index] = item;
      saveToStorage(STORAGE_KEYS.MENU, menu);
    }
  },

  deleteMenuItem: async (id: string): Promise<void> => {
    await delay(300);
    let menu = getFromStorage<MenuItem[]>(STORAGE_KEYS.MENU, []);
    menu = menu.filter(i => i.id !== id);
    saveToStorage(STORAGE_KEYS.MENU, menu);
  },

  // --- Order Management Methods ---
  createOrder: async (tableId: string, items: CartItem[], customerName: string): Promise<string> => {
    await delay(400);
    const orders = getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      tableId,
      customerName,
      items,
      total,
      status: OrderStatus.PENDING,
      timestamp: Date.now()
    };
    
    orders.push(newOrder);
    saveToStorage(STORAGE_KEYS.ORDERS, orders);
    notifyOrderListeners();
    return newOrder.id;
  },

  subscribeToOrders: (callback: (orders: Order[]) => void) => {
    // Return current state immediately
    const orders = getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    callback(orders);
    
    // Subscribe
    orderListeners.push(callback);
    
    // Unsubscribe function
    return () => {
      const idx = orderListeners.indexOf(callback);
      if (idx !== -1) orderListeners.splice(idx, 1);
    };
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    await delay(200);
    const orders = getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, []);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      saveToStorage(STORAGE_KEYS.ORDERS, orders);
      notifyOrderListeners();
    }
  },

  // --- User Management Methods ---
  getUsers: async (): Promise<User[]> => {
    await delay(300);
    return getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
  },

  addUser: async (user: Omit<User, 'id'>): Promise<User> => {
    await delay(300);
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const newUser: User = { ...user, id: Math.random().toString(36).substr(2, 9) };
    users.push(newUser);
    saveToStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  updateUser: async (user: User): Promise<void> => {
    await delay(300);
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      // Keep password if not provided
      const existing = users[index];
      const updated = { ...user };
      if (!updated.password) {
        updated.password = existing.password;
      }
      users[index] = updated;
      saveToStorage(STORAGE_KEYS.USERS, users);
    }
  },

  deleteUser: async (id: string): Promise<void> => {
    await delay(300);
    let users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    users = users.filter(u => u.id !== id);
    saveToStorage(STORAGE_KEYS.USERS, users);
  },
};
