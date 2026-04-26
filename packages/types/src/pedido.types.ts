import { Channel } from './restaurant.types';
export type { Channel };

export type PedidoStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'cancelled';

export interface PedidoLineItem {
  item_id: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
  item_name: string;
}

export interface CreatePedidoPayload {
  restaurant_id: string;
  session_id: string;
  channel: Channel;
  items: PedidoLineItem[];
  total: number;
}

export interface Pedido extends CreatePedidoPayload {
  id: string;
  status: PedidoStatus;
  created_at: string;
}
