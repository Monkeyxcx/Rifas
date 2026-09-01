// ============================================================
// TYPES SUPABASE DATABASE
// ============================================================
// Stub oficial para uso con @supabase/supabase-js <Database>.
// En proyectos reales se regenera con:
//   npx supabase gen types typescript --project-id <ref> --schema public > types/supabase.ts
// Este archivo lo mantenemos ALINEADO con las 3 migraciones SQL.
// ============================================================

import type {
  Ganador,
  Notificacion,
  Pago,
  Perfil,
  Reserva,
  Rifa,
  RifaStats
} from "@/lib/types";

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
        Row: Perfil;
        Insert: Omit<Perfil, "created_at" | "updated_at" | "is_verified"> & {
          is_verified?: boolean;
        };
        Update: Partial<
          Omit<Perfil, "id" | "created_at">
        >;
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      rifas: {
        Row: Rifa;
        Insert: Omit<Rifa, "id" | "created_at" | "updated_at" | "available_numbers"> & {
          id?: string;
          available_numbers?: number;
        };
        Update: Partial<Omit<Rifa, "id" | "created_at">>;
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
        Row: Reserva;
        Insert: Omit<Reserva, "id" | "created_at" | "updated_at" | "status" | "expires_at"> & {
          status?: Reserva["status"];
          expires_at?: string;
        };
        Update: Partial<Omit<Reserva, "id" | "created_at" | "rifa_id" | "user_id" | "number">>;
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
        Row: Pago;
        Insert: Omit<Pago, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Pago, "id" | "created_at">>;
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
            isOneToOne: true;
            referencedRelation: "reservas";
            referencedColumns: ["id"];
          }
        ];
      };
      ganadores: {
        Row: Ganador;
        Insert: Omit<Ganador, "id" | "created_at" | "drawn_at">;
        Update: Partial<Omit<Ganador, "id" | "created_at" | "rifa_id">>;
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
        Row: Notificacion;
        Insert: Omit<Notificacion, "id" | "created_at">;
        Update: Partial<Omit<Notificacion, "id" | "created_at" | "user_id">>;
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
        Row: RifaStats;
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
          success: boolean;
          message: string;
          failed_number: string;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}
