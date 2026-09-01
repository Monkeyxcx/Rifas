// ====================================================================
// TIPOS DEL DOMINIO — RifasCenter
// ====================================================================
// Versión TypeScript del modelo relacional Supabase.
// Los nombres de interfaces siguen las tablas de Postgres.
// ====================================================================

export type ID = string; // UUID

export type RifaStatus =
  | "draft"
  | "active"
  | "closed"
  | "finished"
  | "cancelled";

export type ReservaStatus =
  | "reserved"
  | "paid"
  | "cancelled"
  | "expired"
  | "refunded";

export type PagoStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "in_process";

export interface Perfil {
  id: ID;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  country: string | null;
  bio: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Rifa {
  id: ID;
  creator_id: ID;
  title: string;
  slug: string | null;
  description: string | null;
  prize_name: string;
  prize_image_url: string | null;
  prize_value: number;
  is_solidarity: boolean;
  cause_name: string | null;
  cause_description: string | null;
  cause_target: number;
  number_price: number;
  total_numbers: number;
  available_numbers: number;
  status: RifaStatus;
  ends_at: string | null;
  draw_date: string | null;
  draw_instructions: string | null;
  banner_ad_config: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  // ---- JOINED ----
  creator?: Pick<Perfil, "id" | "full_name" | "avatar_url" | "country"> | null;
}

export interface RifaStats {
  rifa_id: ID;
  total_numbers: number;
  available_numbers: number;
  sold_numbers: number;
  sold_percentage: number;
  number_price: number;
  status: RifaStatus;
  created_at: string;
  ends_at: string | null;
  draw_date: string | null;
}

export interface Reserva {
  id: ID;
  rifa_id: ID;
  user_id: ID;
  number: string; // "00".."99"
  status: ReservaStatus;
  expires_at: string;
  reserved_session_key: string | null;
  created_at: string;
  updated_at: string;
  // JOINED
  rifa?: Pick<Rifa, "id" | "title" | "status" | "number_price"> | null;
}

export interface Pago {
  id: ID;
  rifa_id: ID;
  user_id: ID;
  reserva_id: ID | null;
  mercado_pago_payment_id: string | null;
  mercado_pago_preference_id: string | null;
  external_reference: string | null;
  status: PagoStatus;
  amount: number;
  fee_amount: number;
  net_received_amount: number;
  payment_method: string | null;
  payment_type: string | null;
  installments: number;
  payer_email: string | null;
  mercado_pago_raw: Record<string, unknown> | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ganador {
  id: ID;
  rifa_id: ID;
  user_id: ID | null;
  winning_number: string;
  draw_method: string;
  draw_proof: Record<string, unknown> | null;
  contact_info: Record<string, unknown> | null;
  prize_delivered: boolean;
  prize_delivered_at: string | null;
  drawn_at: string;
  created_at: string;
}

export interface Notificacion {
  id: ID;
  user_id: ID;
  rifa_id: ID | null;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

// ============================================================
// UI Viewmodels (no son tablas, se usan en componentes)
// ============================================================

export interface NumberCellVM {
  number: string; // "00"
  state: "available" | "selected" | "sold" | "mine";
  reservaId?: ID;
  userId?: ID;
}

export interface CartItemVM {
  rifaId: ID;
  numbers: string[];
  unitPrice: number;
}

export type BadgeVariant =
  | "default"
  | "active"
  | "new"
  | "solidarity"
  | "prize"
  | "paid"
  | "pending"
  | "closed"
  | "outline"
  | "secondary"
  | "destructive";
