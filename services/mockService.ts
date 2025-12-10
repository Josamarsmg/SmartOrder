
import { Order, OrderStatus, CartItem, MenuItem, User } from '../types';
// Import removido para evitar erro de módulo. Usaremos window.supabase injetado pelo index.html

// ============================================================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================================================
// 1. Crie um projeto em https://supabase.com
// 2. Vá em Project Settings > API
// 3. Copie a URL e a "anon" public key e cole abaixo:

const SUPABASE_URL = 'https://xjywnmemsvezuipxdttq.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_lIo8odfcYS6qAukWRkI1FA_Vr3dr_oN';

// Inicializa o cliente apenas se as chaves estiverem preenchidas
const isConfigured = SUPABASE_URL.includes('https') && !SUPABASE_URL.includes('SUA_URL');

// Acessa a biblioteca global injetada pela tag <script> no index.html
const supabaseClient = (window as any).supabase;

const supabase = (isConfigured && supabaseClient)
  ? supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// ============================================================================
// SERVIÇO DE DADOS (SUPABASE)
// ============================================================================

export const MockService = {
  isConfigured: isConfigured && !!supabase,

  // --- Auth Methods ---
  login: async (email: string, password: string): Promise<User | null> => {
    // Fallback de segurança: Se o Supabase falhar ou não estiver configurado, permite entrar como Admin
    // Isso garante que você não fique trancado fora do app enquanto configura o banco
    if (!supabase || !isConfigured) {
       console.warn("Modo Offline/Fallback ativado para login.");
       if (email === 'admin' && password === '1234') {
         return {
           id: 'admin-fallback',
           name: 'Administrador (Offline)',
           email: 'admin',
           role: 'Admin',
           status: 'Ativo'
         } as User;
       }
    }

    if (!supabase) return null;
    
    // Consulta simples na tabela de usuários
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password) // Nota: Em produção real, use Supabase Auth
      .single();

    if (error || !data) return null;
    return data as User;
  },

  // --- Menu Management Methods ---
  getMenu: async (): Promise<MenuItem[]> => {
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('menu_items')
      .select('*');
      
    if (error) {
      console.error('Erro ao buscar menu:', error);
      return [];
    }
    return data as MenuItem[];
  },

  addMenuItem: async (item: Omit<MenuItem, 'id'>): Promise<MenuItem> => {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from('menu_items')
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return data as MenuItem;
  },

  updateMenuItem: async (item: MenuItem): Promise<void> => {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('menu_items')
      .update(item)
      .eq('id', item.id);
      
    if (error) console.error('Erro ao atualizar item:', error);
  },

  deleteMenuItem: async (id: string): Promise<void> => {
    if (!supabase) return;

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) console.error('Erro ao deletar item:', error);
  },

  // --- Order Management Methods ---
  createOrder: async (tableId: string, items: CartItem[], customerName: string): Promise<string> => {
    if (!supabase) throw new Error("Supabase não configurado");

    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // O ID é gerado automaticamente pelo banco se configurado como UUID, 
    // mas aqui vamos deixar o banco gerar ou passar se necessário.
    // Vamos salvar 'items' como JSONB.
    
    const newOrderPayload = {
      table_id: tableId, // Mapeando para snake_case do banco
      customer_name: customerName,
      items: items, // Supabase converte automaticamente para JSON
      total: total,
      status: OrderStatus.PENDING,
      timestamp: Date.now()
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([newOrderPayload])
      .select()
      .single();

    if (error) {
      console.error(error);
      throw error;
    }
    return data.id;
  },

  subscribeToOrders: (callback: (orders: Order[]) => void) => {
    if (!supabase) return () => {};

    // Cache local para manter estado
    let currentOrders: Order[] = [];

    // Helper para converter snake_case (banco) para camelCase (app) e tratar nulos
    const mapOrder = (o: any): Order => ({
      id: o.id,
      tableId: o.table_id,
      customerName: o.customer_name,
      // FIX: Garante que items seja sempre um array, mesmo se vier null/undefined do banco
      items: (o.items && Array.isArray(o.items)) ? o.items : [],
      total: o.total || 0,
      status: o.status,
      timestamp: o.timestamp
    });

    // Função para atualizar o estado e chamar o callback
    const updateState = (newOrders: Order[]) => {
        currentOrders = newOrders;
        callback([...currentOrders]);
    };

    // 1. Configurar Realtime ANTES do fetch inicial para não perder eventos
    const channel = supabase
      .channel('public:orders_tracker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
        console.log('⚡ Realtime Update:', payload.eventType);
        
        if (payload.eventType === 'INSERT') {
          const newOrder = mapOrder(payload.new);
          // Previne duplicidade caso o fetch inicial já tenha trazido este pedido
          if (!currentOrders.find(o => o.id === newOrder.id)) {
             updateState([newOrder, ...currentOrders]);
          }
        
        } else if (payload.eventType === 'UPDATE') {
          const updatedOrder = mapOrder(payload.new);
          updateState(currentOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        
        } else if (payload.eventType === 'DELETE') {
          updateState(currentOrders.filter(o => o.id !== payload.old.id));
        }
      })
      .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
              console.log('✅ Conectado ao Supabase Realtime');
          }
      });

    // 2. Busca inicial completa
    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('timestamp', { ascending: false }); // Ordenar pelo mais recente
      
      if (data) {
        // Ao receber dados iniciais, sobrescrevemos o estado.
        // O Realtime cuidará das atualizações futuras.
        updateState(data.map(mapOrder));
      }
    };

    fetchInitial();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    if (!supabase) return;

    await supabase
      .from('orders')
      .update({ status: status })
      .eq('id', orderId);
  },

  // --- User Management Methods ---
  getUsers: async (): Promise<User[]> => {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) return [];
    return data as User[];
  },

  addUser: async (user: Omit<User, 'id'>): Promise<User> => {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },

  updateUser: async (user: User): Promise<void> => {
    if (!supabase) return;

    const { error } = await supabase
      .from('users')
      .update(user)
      .eq('id', user.id);

    if (error) console.error(error);
  },

  deleteUser: async (id: string): Promise<void> => {
    if (!supabase) return;
    
    // Prevenção simples de deletar o admin se o email for 'smartorder'
    const { data } = await supabase.from('users').select('email').eq('id', id).single();
    if (data?.email === 'smartorder') {
        alert("Não é possível deletar o usuário admin padrão via App.");
        return;
    }

    await supabase.from('users').delete().eq('id', id);
  },
};
