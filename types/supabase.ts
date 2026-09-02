// ============================================================
// TYPES SUPABASE DATABASE (GENERADO AUTOMÁTICAMENTE)
// ============================================================
// Proyecto: pscnuvibkrkqqeppmckd (RifasCloud)
// Fuente:   https://pscnuvibkrkqqeppmckd.supabase.co/rest/v1/ OpenAPI
// Schema:   public
//
// Regenerar con Supabase CLI (cuando esté instalado):
//   npx supabase gen types typescript \
//       --project-id pscnuvibkrkqqeppmckd \
//       --schema public > types/supabase.ts
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          country: string | null;
          bio: string | null;
          is_verified: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          country?: string | null;
          bio?: string | null;
          is_verified?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          country?: string | null;
          bio?: string | null;
          is_verified?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedSchema: "auth";
            referencedColumns: ["id"];
          }
        ];
      };

      rifas: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          slug: string | null;
          description: string | null;
          prize_name: string;
          prize_image_url: string | null;
          prize_value: number | null;
          is_solidarity: boolean | null;
          cause_name: string | null;
          cause_description: string | null;
          cause_target: number | null;
          number_price: number;
          total_numbers: number;
          available_numbers: number;
          status: string;
          ends_at: string | null;
          draw_date: string | null;
          draw_instructions: string | null;
          banner_ad_config: Json | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          slug?: string | null;
          description?: string | null;
          prize_name: string;
          prize_image_url?: string | null;
          prize_value?: number | null;
          is_solidarity?: boolean | null;
          cause_name?: string | null;
          cause_description?: string | null;
          cause_target?: number | null;
          number_price: number;
          total_numbers: number;
          available_numbers: number;
          status?: string;
          ends_at?: string | null;
          draw_date?: string | null;
          draw_instructions?: string | null;
          banner_ad_config?: Json | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          slug?: string | null;
          description?: string | null;
          prize_name?: string;
          prize_image_url?: string | null;
          prize_value?: number | null;
          is_solidarity?: boolean | null;
          cause_name?: string | null;
          cause_description?: string | null;
          cause_target?: number | null;
          number_price?: number;
          total_numbers?: number;
          available_numbers?: number;
          status?: string;
          ends_at?: string | null;
          draw_date?: string | null;
          draw_instructions?: string | null;
          banner_ad_config?: Json | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rifas_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      reservas: {
        Row: {
          id: string;
          rifa_id: string;
          user_id: string;
          number: string;
          status: string;
          expires_at: string;
          reserved_session_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rifa_id: string;
          user_id: string;
          number: string;
          status?: string;
          expires_at?: string;
          reserved_session_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rifa_id?: string;
          user_id?: string;
          number?: string;
          status?: string;
          expires_at?: string;
          reserved_session_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservas_rifa_id_fkey";
            columns: ["rifa_id"];
            isOneToOne: false;
            referencedRelation: "rifas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservas_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      pagos: {
        Row: {
          id: string;
          rifa_id: string;
          user_id: string;
          reserva_id: string | null;
          mercado_pago_payment_id: string | null;
          mercado_pago_preference_id: string | null;
          external_reference: string | null;
          status: string;
          amount: number;
          fee_amount: number | null;
          net_received_amount: number | null;
          payment_method: string | null;
          payment_type: string | null;
          installments: number | null;
          payer_email: string | null;
          mercado_pago_raw: Json | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rifa_id: string;
          user_id: string;
          reserva_id?: string | null;
          mercado_pago_payment_id?: string | null;
          mercado_pago_preference_id?: string | null;
          external_reference?: string | null;
          status?: string;
          amount: number;
          fee_amount?: number | null;
          net_received_amount?: number | null;
          payment_method?: string | null;
          payment_type?: string | null;
          installments?: number | null;
          payer_email?: string | null;
          mercado_pago_raw?: Json | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rifa_id?: string;
          user_id?: string;
          reserva_id?: string | null;
          mercado_pago_payment_id?: string | null;
          mercado_pago_preference_id?: string | null;
          external_reference?: string | null;
          status?: string;
          amount?: number;
          fee_amount?: number | null;
          net_received_amount?: number | null;
          payment_method?: string | null;
          payment_type?: string | null;
          installments?: number | null;
          payer_email?: string | null;
          mercado_pago_raw?: Json | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pagos_rifa_id_fkey";
            columns: ["rifa_id"];
            isOneToOne: false;
            referencedRelation: "rifas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pagos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pagos_reserva_id_fkey";
            columns: ["reserva_id"];
            isOneToOne: false;
            referencedRelation: "reservas";
            referencedColumns: ["id"];
          }
        ];
      };

      ganadores: {
        Row: {
          id: string;
          rifa_id: string;
          user_id: string | null;
          winning_number: string;
          draw_method: string | null;
          draw_proof: Json | null;
          contact_info: Json | null;
          prize_delivered: boolean | null;
          prize_delivered_at: string | null;
          drawn_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          rifa_id: string;
          user_id?: string | null;
          winning_number: string;
          draw_method?: string | null;
          draw_proof?: Json | null;
          contact_info?: Json | null;
          prize_delivered?: boolean | null;
          prize_delivered_at?: string | null;
          drawn_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          rifa_id?: string;
          user_id?: string | null;
          winning_number?: string;
          draw_method?: string | null;
          draw_proof?: Json | null;
          contact_info?: Json | null;
          prize_delivered?: boolean | null;
          prize_delivered_at?: string | null;
          drawn_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ganadores_rifa_id_fkey";
            columns: ["rifa_id"];
            isOneToOne: true;
            referencedRelation: "rifas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ganadores_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      notifications: {
        Row: {
          id: string;
          user_id: string;
          rifa_id: string | null;
          type: string;
          title: string;
          message: string;
          action_url: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          rifa_id?: string | null;
          type: string;
          title: string;
          message: string;
          action_url?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          rifa_id?: string | null;
          type?: string;
          title?: string;
          message?: string;
          action_url?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_rifa_id_fkey";
            columns: ["rifa_id"];
            isOneToOne: false;
            referencedRelation: "rifas";
            referencedColumns: ["id"];
          }
        ];
      };
    };

    Views: {
      rifa_stats: {
        Row: {
          rifa_id: string | null;
          total_numbers: number | null;
          available_numbers: number | null;
          sold_numbers: number | null;
          sold_percentage: number | null;
          number_price: number | null;
          status: string | null;
          created_at: string | null;
          ends_at: string | null;
          draw_date: string | null;
        };
        Relationships: [];
      };
    };

    Functions: {
      buy_reservations: {
        Args: {
          p_rifa_id: string;
          p_user_id: string;
          p_numbers: string[];
        };
        Returns: {
          success: boolean | null;
          message: string | null;
          failed_number: string | null;
        }[];
      };
    };

    Enums: {};
  };
}
