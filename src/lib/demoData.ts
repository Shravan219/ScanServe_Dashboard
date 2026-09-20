import { MenuItem, Order, RestaurantTable } from '@/src/types';

export type DemoTier = 'bistro' | 'brasserie' | 'enterprise';

export interface EnterpriseOutlet {
  id: string;
  name: string;
  type: string;
  address: string;
  activeTables: number;
  todayRevenue: number;
  ordersCount: number;
  relayStatus: 'online' | 'syncing' | 'offline';
  relayIp: string;
  relayPing: string;
}

export const ENTERPRISE_OUTLETS: EnterpriseOutlet[] = [
  {
    id: 'downtown',
    name: 'Downtown Flagship',
    type: 'Fine Dining & Champagne Bar',
    address: '42 Regal Crescent, Financial District',
    activeTables: 18,
    todayRevenue: 184500,
    ordersCount: 46,
    relayStatus: 'online',
    relayIp: '192.168.1.150',
    relayPing: '0.4ms'
  },
  {
    id: 'airport',
    name: 'Airport Terminal 3',
    type: 'High-Velocity Express Lounge',
    address: 'Concourse B, Gate 14-16',
    activeTables: 8,
    todayRevenue: 96200,
    ordersCount: 92,
    relayStatus: 'online',
    relayIp: '10.20.4.12',
    relayPing: '1.2ms'
  },
  {
    id: 'coastal',
    name: 'Coastal Resort & Beach Club',
    type: 'Alfresco Cabanas & Seafood Grill',
    address: 'Oceanfront Pavilion, Marina Bay',
    activeTables: 24,
    todayRevenue: 245000,
    ordersCount: 58,
    relayStatus: 'online',
    relayIp: '192.168.10.88',
    relayPing: '0.6ms'
  }
];

export const TIER_METADATA: Record<DemoTier, {
  name: string;
  tagline: string;
  badge: string;
  highlightColor: string;
  kdsScreens: string;
  tablets: string;
  aggregators: boolean;
  vipCrm: boolean;
  multiOutlet: boolean;
  onPremRelay: boolean;
  erpExport: boolean;
}> = {
  bistro: {
    name: 'Bistro & Cafe',
    tagline: 'Fast-casual specialty cafe & boutique bistro setup',
    badge: 'Tier I • Essential',
    highlightColor: '#38BDF8',
    kdsScreens: '1 Single Queue KDS',
    tablets: 'Up to 2 Floor Tablets',
    aggregators: false,
    vipCrm: false,
    multiOutlet: false,
    onPremRelay: false,
    erpExport: false
  },
  brasserie: {
    name: 'Grand Brasserie',
    tagline: 'Michelin-grade luxury fine dining & omnichannel service mesh',
    badge: 'Tier II • Michelin Recommended',
    highlightColor: '#C5A059',
    kdsScreens: 'Multi-Station KDS (Prep, Grill, Pass, Bar)',
    tablets: 'Unlimited Captain Tablets',
    aggregators: true,
    vipCrm: true,
    multiOutlet: false,
    onPremRelay: false,
    erpExport: false
  },
  enterprise: {
    name: 'Enterprise Group',
    tagline: 'Multi-property restaurant franchise & centralized mesh',
    badge: 'Tier III • Multi-Property',
    highlightColor: '#A855F7',
    kdsScreens: 'Unlimited Stations & Routing',
    tablets: 'Unlimited Across All Outlets',
    aggregators: true,
    vipCrm: true,
    multiOutlet: true,
    onPremRelay: true,
    erpExport: true
  }
};

export const BISTRO_MENU_ITEMS: MenuItem[] = [
  {
    id: 'b-1',
    name: 'Artisanal Flat White',
    description: 'Double shot ristretto with silky micro-foam steamed whole milk',
    price: 240,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=400&q=80',
    is_sold_out: false
  },
  {
    id: 'b-2',
    name: 'Nitro Cold Brew',
    description: '18-hour steeped single-origin Ethiopian cold brew infused with nitrogen',
    price: 280,
    category: 'coffee',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
    is_sold_out: false
  },
  {
    id: 'b-3',
    name: 'Almond Butter Croissant',
    description: 'Flaky 72-layer butter pastry filled with roasted almond frangipane',
    price: 260,
    category: 'bakery',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
    is_sold_out: false
  },
  {
    id: 'b-4',
    name: 'Avocado Tartine & Poached Egg',
    description: 'Sourdough toast, smashed Hass avocado, Persian feta, organic poached egg',
    price: 450,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
    is_sold_out: false
  },
  {
    id: 'b-5',
    name: 'Truffle Grilled Cheese',
    description: 'Aged gruyere, sharp cheddar, black truffle butter on toasted brioche',
    price: 490,
    category: 'food',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80',
    is_sold_out: false
  },
  {
    id: 'b-6',
    name: 'Matcha Blossom Latte',
    description: 'Ceremonial Uji matcha, oat milk, infused with organic vanilla bean',
    price: 310,
    category: 'beverage',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
    is_sold_out: false
  }
];

export const BRASSERIE_MENU_ITEMS: MenuItem[] = [
  {
    id: 'br-1',
    name: 'Wild Mushroom Truffle Risotto',
    description: 'Acquerello carnaroli rice, foraged chanterelles, shaved black Perigord truffle, 36-month Parmigiano',
    price: 1450,
    category: 'main',
    image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281288?auto=format&fit=crop&w=400&q=80',
    is_sold_out: false
  },
  {
    id: 'br-2',
    name: 'Pan-Seared Chilean Sea Bass',
    description: 'Glazed with miso-yuzu butter, charred baby bok choy, dashi emulsion',
    price: 2150,
    category: 'main',
    image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=400&q=80',
    is_sold_out: false
  },
  {
    id: 'br-3',
    name: 'A5 Miyazaki Wagyu Striploin (200g)',
    description: 'Charcoal-grilled over binchotan, smoked marrow reduction, black garlic confit',
    price: 4800,
    category: 'main',
    image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=400&q=80',
    is_sold_out: false
  },
  {
    id: 'br-4',
    name: 'Burrata di Puglia & Heirloom Peaches',
    description: 'Handcrafted cream burrata, grilled white peaches, 25-year balsamico, basil oil',
    price: 980,
    category: 'starter',
    image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=400&q=80',
    is_sold_out: false
  },
  {
    id: 'br-5',
    name: 'Wood-Fired Truffle & Taleggio Pizza',
    description: 'Fior di latte, taleggio DOP, wild mushrooms, fresh thyme, white truffle drizzle',
    price: 1250,
    category: 'pizza',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
    is_sold_out: false
  },
  {
    id: 'br-6',
    name: 'Grand Cru Valrhona Chocolate Sphere',
    description: '70% Guanaja chocolate dome, passion fruit caramel, warm espresso ganache pour',
    price: 750,
    category: 'dessert',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
    is_sold_out: false
  }
];

export const BISTRO_ORDERS: Order[] = [
  {
    id: 'ord-b-101',
    token: '#101',
    table_id: 1,
    status: 'preparing',
    order_type: 'dine_in',
    total: 500,
    created_at: new Date(Date.now() - 6 * 60000).toISOString(),
    customer_name: 'Sarah Lin',
    customer_phone: '+919876543210',
    items: [
      { id: 'item-1', name: 'Artisanal Flat White', quantity: 1, price: 240, item_notes: 'Extra hot, oat milk' },
      { id: 'item-2', name: 'Almond Butter Croissant', quantity: 1, price: 260 }
    ]
  },
  {
    id: 'ord-b-102',
    token: '#102',
    table_id: 3,
    status: 'ready',
    order_type: 'dine_in',
    total: 730,
    created_at: new Date(Date.now() - 14 * 60000).toISOString(),
    customer_name: 'Karan Mehra',
    customer_phone: '+919822334455',
    items: [
      { id: 'item-3', name: 'Avocado Tartine & Poached Egg', quantity: 1, price: 450 },
      { id: 'item-4', name: 'Nitro Cold Brew', quantity: 1, price: 280 }
    ]
  },
  {
    id: 'ord-b-103',
    token: '#103',
    status: 'waiting for payment',
    order_type: 'takeaway',
    total: 800,
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    customer_name: 'Vikram Joshi',
    customer_phone: '+919988776655',
    items: [
      { id: 'item-5', name: 'Truffle Grilled Cheese', quantity: 1, price: 490 },
      { id: 'item-6', name: 'Matcha Blossom Latte', quantity: 1, price: 310 }
    ]
  }
];

export const BRASSERIE_ORDERS: Order[] = [
  {
    id: 'ord-br-201',
    token: '#201',
    table_id: 4,
    status: 'preparing',
    order_type: 'dine_in',
    total: 5750,
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
    customer_name: 'Dr. Rajesh Khanna',
    customer_phone: '+919811002233',
    notes: 'VIP patron (7th visit). Table celebration.',
    items: [
      { id: 'item-br1', name: 'Burrata di Puglia & Heirloom Peaches', quantity: 1, price: 980, item_notes: 'Dressing on side' },
      { id: 'item-br2', name: 'Pan-Seared Chilean Sea Bass', quantity: 2, price: 2150, item_notes: 'Extra miso glaze' },
      { id: 'item-br3', name: 'Grand Cru Valrhona Chocolate Sphere', quantity: 1, price: 750 }
    ]
  },
  {
    id: 'ord-br-202',
    token: '#202',
    table_id: 7,
    status: 'preparing',
    order_type: 'dine_in',
    total: 6250,
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    customer_name: 'Ananya Deshmukh',
    customer_phone: '+919844556677',
    items: [
      { id: 'item-br4', name: 'A5 Miyazaki Wagyu Striploin (200g)', quantity: 1, price: 4800, item_notes: 'Medium Rare, maldon sea salt' },
      { id: 'item-br5', name: 'Wild Mushroom Truffle Risotto', quantity: 1, price: 1450 }
    ]
  },
  {
    id: 'ord-br-203',
    token: '#203',
    status: 'preparing',
    order_type: 'aggregator',
    aggregator_platform: 'swiggy',
    total: 2700,
    created_at: new Date(Date.now() - 4 * 60000).toISOString(),
    customer_name: 'Swiggy Express Delivery #8904',
    customer_phone: '+919800112233',
    items: [
      { id: 'item-br6', name: 'Wood-Fired Truffle & Taleggio Pizza', quantity: 2, price: 1250 },
      { id: 'item-br7', name: 'Artisanal Flat White', quantity: 1, price: 200 }
    ]
  },
  {
    id: 'ord-br-204',
    token: '#204',
    status: 'ready',
    order_type: 'aggregator',
    aggregator_platform: 'zomato',
    total: 2430,
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
    customer_name: 'Zomato Gold Order #4412',
    customer_phone: '+919777889900',
    items: [
      { id: 'item-br8', name: 'Wild Mushroom Truffle Risotto', quantity: 1, price: 1450 },
      { id: 'item-br9', name: 'Burrata di Puglia & Heirloom Peaches', quantity: 1, price: 980 }
    ]
  },
  {
    id: 'ord-br-205',
    token: '#205',
    table_id: 12,
    status: 'waiting for payment',
    order_type: 'dine_in',
    total: 12400,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    customer_name: 'Lord Somnath Party',
    customer_phone: '+919988112244',
    items: [
      { id: 'item-br10', name: 'A5 Miyazaki Wagyu Striploin (200g)', quantity: 2, price: 4800 },
      { id: 'item-br11', name: 'Pan-Seared Chilean Sea Bass', quantity: 1, price: 2150 },
      { id: 'item-br12', name: 'Grand Cru Valrhona Chocolate Sphere', quantity: 2, price: 750 }
    ]
  }
];

export const ENTERPRISE_ORDERS: Order[] = [
  ...BRASSERIE_ORDERS,
  {
    id: 'ord-ent-301',
    token: '#301',
    table_id: 15,
    status: 'preparing',
    order_type: 'dine_in',
    total: 16800,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    customer_name: 'Consulate Private Dinner',
    customer_phone: '+919812345678',
    notes: 'Enterprise Master Account • Direct SAP Ledger Billing',
    items: [
      { id: 'item-ent1', name: 'A5 Miyazaki Wagyu Striploin (200g)', quantity: 3, price: 4800 },
      { id: 'item-ent2', name: 'Pan-Seared Chilean Sea Bass', quantity: 1, price: 2150 }
    ]
  }
];

export const BISTRO_TABLES: RestaurantTable[] = Array.from({ length: 6 }, (_, i) => ({
  id: `tb-${i + 1}`,
  table_number: `Cafe Table ${i + 1}`,
  capacity: i % 2 === 0 ? 2 : 4,
  status: i === 0 ? 'occupied' : i === 2 ? 'occupied' : 'available',
  section: 'Bistro Terrace',
  customer_name: i === 0 ? 'Sarah Lin' : i === 2 ? 'Karan Mehra' : null,
  total_amount: i === 0 ? 500 : i === 2 ? 730 : 0
}));

export const BISTRO_CUSTOMERS = [
  {
    id: 'cust-b-1',
    name: 'Sarah Lin',
    phone: '+919876543210',
    order_count: 8,
    loyal_vip: false,
    discount: null,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    gstin: null
  },
  {
    id: 'cust-b-2',
    name: 'Karan Mehra',
    phone: '+919822334455',
    order_count: 5,
    loyal_vip: false,
    discount: null,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    gstin: null
  },
  {
    id: 'cust-b-3',
    name: 'Vikram Joshi',
    phone: '+919988776655',
    order_count: 12,
    loyal_vip: true,
    discount: 10,
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    gstin: null
  }
];

export const BRASSERIE_CUSTOMERS = [
  {
    id: 'cust-br-1',
    name: 'Lord Somnath Sterling',
    phone: '+919988112244',
    order_count: 16,
    loyal_vip: true,
    discount: 15,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    gstin: '27AABCS1429B1Z8'
  },
  {
    id: 'cust-br-2',
    name: 'Ambassador Rajeshwar Kapoor',
    phone: '+919811223344',
    order_count: 9,
    loyal_vip: true,
    discount: 10,
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    gstin: '27AABCK9981D1Z2'
  },
  {
    id: 'cust-br-3',
    name: 'Dr. Elena Rostova',
    phone: '+919833445566',
    order_count: 6,
    loyal_vip: true,
    discount: 10,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    gstin: null
  }
];

export const ENTERPRISE_CUSTOMERS = [
  ...BRASSERIE_CUSTOMERS,
  {
    id: 'cust-ent-1',
    name: 'Consulate Private Dinner Desk',
    phone: '+919812345678',
    order_count: 34,
    loyal_vip: true,
    discount: 20,
    created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
    gstin: '27AAACG0561F1ZV'
  },
  {
    id: 'cust-ent-2',
    name: 'Apex Global Capital Partners',
    phone: '+919877001122',
    order_count: 28,
    loyal_vip: true,
    discount: 20,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    gstin: '27AAACA1234A1Z5'
  }
];
