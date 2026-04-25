export interface DietaryInfo {
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_lactose_free: boolean;
  is_spicy: boolean;
  spice_level: 0 | 1 | 2 | 3;
}

export interface PairingInfo {
  drinks: string[];
  pairing_note?: string;
}

export interface ItemVariant {
  id: string;
  name: string;
  price_delta: number;
}

export interface CartaCategory {
  id: string;
  name: string;
  emoji: string;
  sort_order: number;
  available: boolean;
}

export interface CartaItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  available: boolean;
  prep_time_minutes: number;
  is_chef_recommendation: boolean;
  chef_note?: string;
  tags: string[];
  allergens: string[];
  dietary: DietaryInfo;
  pairing: PairingInfo;
  variants: ItemVariant[];
  combo_ids: string[];
}

export interface Combo {
  id: string;
  name: string;
  item_ids: string[];
  price: number;
  original_price: number;
  available_from: string;
  available_until: string;
}
