export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  shop_name: string;
  shop_slug: string;
  shop_description: string | null;
  shop_image_url: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  profile_id: string | null;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Recipe {
  id: number;
  profile_id: string | null;
  category_id: number | null;
  name: string;
  category: string;
  description: string | null;
  portions: number | null;
  margin: number | null;
  image: string | null;
  image_url: string | null;
  sale_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export interface Order {
  id: number;
  profile_id: string | null;
  order_number: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string | null;
  customer_note: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  total: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  recipe_id: number | null;
  recipe_name: string;
  quantity: number;
  price: number;
  note: string | null;
}

export interface CartItem {
  recipe: Recipe;
  quantity: number;
}

type StatusInfo = {
  label: string;
  color: string;
  bg: string;
};

export const ORDER_STATUS_MAP: Record<string, StatusInfo> = {
  pending: {
    label: "Yeni Sipariş",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200"
  },
  confirmed: {
    label: "Onaylandı",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200"
  },
  preparing: {
    label: "Hazırlanıyor",
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200"
  },
  ready: {
    label: "Hazır",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200"
  },
  delivered: {
    label: "Teslim Edildi",
    color: "text-gray-600",
    bg: "bg-gray-50 border-gray-200"
  },
  cancelled: {
    label: "İptal",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200"
  }
};

export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const r = Math.floor(Math.random() * 9000 + 1000);
  return "SIP-" + y + m + d + "-" + r;
}