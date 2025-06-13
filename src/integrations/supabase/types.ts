export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          amount: number
          date: string
          description: string | null
          garage_id: string | null
          id: string
          tenant_id: string | null
          type: Database["public"]["Enums"]["account_type"]
        }
        Insert: {
          amount: number
          date?: string
          description?: string | null
          garage_id?: string | null
          id?: string
          tenant_id?: string | null
          type: Database["public"]["Enums"]["account_type"]
        }
        Update: {
          amount?: number
          date?: string
          description?: string | null
          garage_id?: string | null
          id?: string
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["account_type"]
        }
        Relationships: [
          {
            foreignKeyName: "accounts_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          clock_in: string
          clock_out: string | null
          garage_id: string | null
          id: string
          staff_id: string
          tenant_id: string | null
        }
        Insert: {
          clock_in: string
          clock_out?: string | null
          garage_id?: string | null
          id?: string
          staff_id: string
          tenant_id?: string | null
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          garage_id?: string | null
          id?: string
          staff_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_services: {
        Row: {
          created_at: string
          description: string | null
          garage_id: string | null
          id: string
          is_active: boolean
          price: number
          service_name: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          garage_id?: string | null
          id?: string
          is_active?: boolean
          price: number
          service_name: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          garage_id?: string | null
          id?: string
          is_active?: boolean
          price?: number
          service_name?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "garage_services_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      garages: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      gst_slabs: {
        Row: {
          cgst_percent: number
          effective_from: string
          effective_to: string | null
          garage_id: string | null
          id: string
          igst_percent: number
          name: string
          sgst_percent: number
          tenant_id: string | null
        }
        Insert: {
          cgst_percent: number
          effective_from: string
          effective_to?: string | null
          garage_id?: string | null
          id?: string
          igst_percent: number
          name: string
          sgst_percent: number
          tenant_id?: string | null
        }
        Update: {
          cgst_percent?: number
          effective_from?: string
          effective_to?: string | null
          garage_id?: string | null
          id?: string
          igst_percent?: number
          name?: string
          sgst_percent?: number
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gst_slabs_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          garage_id: string | null
          id: string
          item_name: string
          min_stock_level: number
          quantity: number
          supplier: string | null
          tenant_id: string | null
          unit_price: number
        }
        Insert: {
          garage_id?: string | null
          id?: string
          item_name: string
          min_stock_level?: number
          quantity?: number
          supplier?: string | null
          tenant_id?: string | null
          unit_price: number
        }
        Update: {
          garage_id?: string | null
          id?: string
          item_name?: string
          min_stock_level?: number
          quantity?: number
          supplier?: string | null
          tenant_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          description: string
          garage_id: string | null
          id: string
          invoice_id: string
          item_type: string
          quantity: number
          tenant_id: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          description: string
          garage_id?: string | null
          id?: string
          invoice_id: string
          item_type: string
          quantity: number
          tenant_id?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          description?: string
          garage_id?: string | null
          id?: string
          invoice_id?: string
          item_type?: string
          quantity?: number
          tenant_id?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          cgst_amount: number | null
          created_at: string
          final_amount: number
          garage_id: string | null
          gst_slab_id: string | null
          id: string
          igst_amount: number | null
          job_card_id: string
          sgst_amount: number | null
          status: string | null
          tax: number
          tenant_id: string | null
          total_amount: number
        }
        Insert: {
          cgst_amount?: number | null
          created_at?: string
          final_amount: number
          garage_id?: string | null
          gst_slab_id?: string | null
          id?: string
          igst_amount?: number | null
          job_card_id: string
          sgst_amount?: number | null
          status?: string | null
          tax: number
          tenant_id?: string | null
          total_amount: number
        }
        Update: {
          cgst_amount?: number | null
          created_at?: string
          final_amount?: number
          garage_id?: string | null
          gst_slab_id?: string | null
          id?: string
          igst_amount?: number | null
          job_card_id?: string
          sgst_amount?: number | null
          status?: string | null
          tax?: number
          tenant_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_gst_slab_id_fkey"
            columns: ["gst_slab_id"]
            isOneToOne: false
            referencedRelation: "gst_slabs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_card_id_fkey"
            columns: ["job_card_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      job_cards: {
        Row: {
          actual_completion_date: string | null
          assigned_staff: Json | null
          car_make: string
          car_model: string
          car_number: string
          created_at: string
          customer_name: string
          customer_phone: string
          estimated_completion_date: string | null
          garage_id: string | null
          gst_slab_id: string | null
          hourly_rate: number | null
          id: string
          job_date: string
          labor_hours: number | null
          manual_labor_cost: number | null
          notes: string | null
          parts: Json | null
          selected_services: Json | null
          status: Database["public"]["Enums"]["job_status"]
          tenant_id: string | null
          work_description: string
        }
        Insert: {
          actual_completion_date?: string | null
          assigned_staff?: Json | null
          car_make: string
          car_model: string
          car_number: string
          created_at?: string
          customer_name: string
          customer_phone: string
          estimated_completion_date?: string | null
          garage_id?: string | null
          gst_slab_id?: string | null
          hourly_rate?: number | null
          id?: string
          job_date?: string
          labor_hours?: number | null
          manual_labor_cost?: number | null
          notes?: string | null
          parts?: Json | null
          selected_services?: Json | null
          status?: Database["public"]["Enums"]["job_status"]
          tenant_id?: string | null
          work_description: string
        }
        Update: {
          actual_completion_date?: string | null
          assigned_staff?: Json | null
          car_make?: string
          car_model?: string
          car_number?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string
          estimated_completion_date?: string | null
          garage_id?: string | null
          gst_slab_id?: string | null
          hourly_rate?: number | null
          id?: string
          job_date?: string
          labor_hours?: number | null
          manual_labor_cost?: number | null
          notes?: string | null
          parts?: Json | null
          selected_services?: Json | null
          status?: Database["public"]["Enums"]["job_status"]
          tenant_id?: string | null
          work_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_cards_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_cards_gst_slab_id_fkey"
            columns: ["gst_slab_id"]
            isOneToOne: false
            referencedRelation: "gst_slabs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_parts: {
        Row: {
          added_to_purchase_list: boolean
          garage_id: string | null
          id: string
          in_inventory: boolean
          inventory_id: string | null
          job_card_id: string | null
          name: string
          quantity: number
          tenant_id: string | null
          unit_price: number
        }
        Insert: {
          added_to_purchase_list?: boolean
          garage_id?: string | null
          id?: string
          in_inventory?: boolean
          inventory_id?: string | null
          job_card_id?: string | null
          name: string
          quantity?: number
          tenant_id?: string | null
          unit_price?: number
        }
        Update: {
          added_to_purchase_list?: boolean
          garage_id?: string | null
          id?: string
          in_inventory?: boolean
          inventory_id?: string | null
          job_card_id?: string | null
          name?: string
          quantity?: number
          tenant_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_parts_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_parts_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_parts_job_card_id_fkey"
            columns: ["job_card_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      job_photos: {
        Row: {
          created_at: string | null
          garage_id: string | null
          id: string
          job_card_id: string | null
          photo_type: string | null
          tenant_id: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          garage_id?: string | null
          id?: string
          job_card_id?: string | null
          photo_type?: string | null
          tenant_id?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          garage_id?: string | null
          id?: string
          job_card_id?: string | null
          photo_type?: string | null
          tenant_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_photos_job_card_id_fkey"
            columns: ["job_card_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      job_staff_assignments: {
        Row: {
          garage_id: string | null
          id: string
          job_id: string
          staff_id: string
          tenant_id: string | null
        }
        Insert: {
          garage_id?: string | null
          id?: string
          job_id: string
          staff_id: string
          tenant_id?: string | null
        }
        Update: {
          garage_id?: string | null
          id?: string
          job_id?: string
          staff_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_staff_assignments_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_staff_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_staff_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          garage_id: string | null
          id: string
          is_active: boolean | null
          tenant_id: string | null
          title: string
          valid_from: string
          valid_to: string
        }
        Insert: {
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          garage_id?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id?: string | null
          title: string
          valid_from: string
          valid_to: string
        }
        Update: {
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          garage_id?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id?: string | null
          title?: string
          valid_from?: string
          valid_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          garage_id: string | null
          id: string
          setting_key: string
          setting_value: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          garage_id?: string | null
          id?: string
          setting_key: string
          setting_value?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          garage_id?: string | null
          id?: string
          setting_key?: string
          setting_value?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          designation: string
          garage_id: string | null
          hourly_rate: number
          id: string
          name: string
          phone: string
          tenant_id: string | null
        }
        Insert: {
          designation: string
          garage_id?: string | null
          hourly_rate: number
          id?: string
          name: string
          phone: string
          tenant_id?: string | null
        }
        Update: {
          designation?: string
          garage_id?: string | null
          hourly_rate?: number
          id?: string
          name?: string
          phone?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      debug_current_tenant: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_garage_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      account_type: "income" | "expense"
      job_status:
        | "Pending"
        | "In Progress"
        | "Completed"
        | "Parts Ordered"
        | "Ready for Pickup"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["income", "expense"],
      job_status: [
        "Pending",
        "In Progress",
        "Completed",
        "Parts Ordered",
        "Ready for Pickup",
      ],
    },
  },
} as const
