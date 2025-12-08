import { Category, MenuItem } from './types';

export const MENU_ITEMS: MenuItem[] = [
  // Entradas
  {
    id: '1',
    name: 'Bruschetta Italiana',
    description: 'Pão italiano tostado, tomate fresco, manjericão e azeite.',
    price: 28.00,
    category: Category.STARTERS,
    image: 'https://picsum.photos/400/300?random=1'
  },
  {
    id: '2',
    name: 'Dadinhos de Tapioca',
    description: 'Cubos de tapioca com queijo coalho, acompanha geleia de pimenta.',
    price: 32.90,
    category: Category.STARTERS,
    image: 'https://picsum.photos/400/300?random=2'
  },
  // Pratos Principais
  {
    id: '3',
    name: 'Risoto de Funghi',
    description: 'Arroz arbóreo, mix de cogumelos frescos e parmesão.',
    price: 58.00,
    category: Category.MAINS,
    image: 'https://picsum.photos/400/300?random=3'
  },
  {
    id: '4',
    name: 'Filé Mignon ao Poivre',
    description: 'Medalhão de filé com molho de pimenta verde e batatas rústicas.',
    price: 79.90,
    category: Category.MAINS,
    image: 'https://picsum.photos/400/300?random=4'
  },
  {
    id: '5',
    name: 'Salmão Grelhado',
    description: 'Posta de salmão com legumes salteados na manteiga.',
    price: 65.50,
    category: Category.MAINS,
    image: 'https://picsum.photos/400/300?random=5'
  },
  // Bebidas
  {
    id: '6',
    name: 'Soda Italiana',
    description: 'Água com gás e xarope de frutas (Maçã Verde, Morango ou Limão).',
    price: 14.00,
    category: Category.DRINKS,
    image: 'https://picsum.photos/400/300?random=6'
  },
  {
    id: '7',
    name: 'Cerveja Artesanal IPA',
    description: '500ml, notas cítricas e amargor equilibrado.',
    price: 22.00,
    category: Category.DRINKS,
    image: 'https://picsum.photos/400/300?random=7'
  },
  // Sobremesas
  {
    id: '8',
    name: 'Petit Gâteau',
    description: 'Bolo de chocolate com recheio cremoso e sorvete de baunilha.',
    price: 26.00,
    category: Category.DESSERTS,
    image: 'https://picsum.photos/400/300?random=8'
  }
];

export const TABLES = Array.from({ length: 75 }, (_, i) => ({
  id: (i + 1).toString(),
  name: `Mesa ${i + 1}`
}));