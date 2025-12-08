
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs, 
  where,
  limit 
} from 'firebase/firestore';
import { Order, OrderStatus, CartItem, MenuItem, User } from '../types';
import { MENU_ITEMS } from '../constants';

// ============================================================================
// CONFIGURAÇÃO DO FIREBASE (PRODUÇÃO)
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyA1WWo1LhbmUqs_qwsJ_tj8Re2fGN8x-C4",
  authDomain: "smartorder-8de4e.firebaseapp.com",
  projectId: "smartorder-8de4e",
  storageBucket: "smartorder-8de4e.firebasestorage.app",
  messagingSenderId: "1028285261682",
  appId: "1:1028285261682:web:c8a4010ef4c40d29b01feb",
  measurementId: "G-Z97PW0GMC1"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("🔥 Firebase Iniciado com Sucesso!");

// ============================================================================
// SEED AUTOMÁTICO (Preencher banco de dados vazio)
// ============================================================================
// Verifica se o banco está vazio e cria os dados iniciais
const seedDatabaseIfNeeded = async () => {
  try {
    // 1. Verificar/Criar Usuário Admin
    const usersRef = collection(db, 'users');
    const userSnapshot = await getDocs(query(usersRef, limit(1)));
    
    if (userSnapshot.empty) {
      console.log("🌱 Banco de dados vazio detectado. Criando usuário admin padrão...");
      await addDoc(usersRef, {
        name: 'Administrador',
        email: 'smartorder',
        password: '1234',
        role: 'Admin',
        status: 'Ativo'
      });
    }

    // 2. Verificar/Criar Cardápio
    const menuRef = collection(db, 'menu');
    const menuSnapshot = await getDocs(query(menuRef, limit(1)));
    
    if (menuSnapshot.empty) {
      console.log("🌱 Criando cardápio padrão...");
      for (const item of MENU_ITEMS) {
        await addDoc(menuRef, item);
      }
    }
  } catch (error) {
    console.error("Erro ao verificar/semear banco de dados:", error);
  }
};

// Executa a verificação ao carregar
seedDatabaseIfNeeded();

// ============================================================================
// SERVIÇO FIREBASE (REAL-TIME)
// ============================================================================

export const MockService = {
  isConfigured: true,

  // --- Auth Methods ---
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const q = query(
        collection(db, 'users'), 
        where("email", "==", email),
        where("password", "==", password), 
        where("status", "==", "Ativo")
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        return { id: querySnapshot.docs[0].id, ...docData } as User;
      }
      return null;
    } catch (e) {
      console.error("Erro no login:", e);
      return null;
    }
  },

  // --- Menu Management Methods ---
  getMenu: async (): Promise<MenuItem[]> => {
    const querySnapshot = await getDocs(collection(db, 'menu'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
  },

  addMenuItem: async (item: Omit<MenuItem, 'id'>): Promise<MenuItem> => {
    const docRef = await addDoc(collection(db, 'menu'), item);
    return { id: docRef.id, ...item };
  },

  updateMenuItem: async (item: MenuItem): Promise<void> => {
    const { id, ...data } = item;
    const itemRef = doc(db, 'menu', id);
    await updateDoc(itemRef, data);
  },

  deleteMenuItem: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'menu', id));
  },

  // --- Order Management Methods ---
  createOrder: async (tableId: string, items: CartItem[], customerName: string): Promise<string> => {
    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newOrderData = {
      tableId,
      customerName,
      items,
      total,
      status: OrderStatus.PENDING,
      timestamp: Date.now()
    };
    
    const docRef = await addDoc(collection(db, 'orders'), newOrderData);
    return docRef.id;
  },

  subscribeToOrders: (callback: (orders: Order[]) => void) => {
    // Escuta em tempo real a coleção de pedidos
    const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      callback(orders);
    });

    return unsubscribe;
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });
  },

  // --- User Management Methods ---
  getUsers: async (): Promise<User[]> => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  },

  addUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const docRef = await addDoc(collection(db, 'users'), user);
    return { id: docRef.id, ...user };
  },

  updateUser: async (user: User): Promise<void> => {
    const { id, ...data } = user;
    const dataToUpdate = { ...data };
    if (!dataToUpdate.password) {
        delete dataToUpdate.password;
    }
    
    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, dataToUpdate);
  },

  deleteUser: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', id));
  },
};
