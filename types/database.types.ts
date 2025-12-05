export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      characters: {
        Row: {
          aliases: string[] | null
          consistency_string: string | null
          created_at: string | null
          description: string | null
          embedding_data: Json | null
          expressions: Json | null
          handle: string
          id: string
          ip_adapter_embedding: Json | null
          name: string
          outfits: Json | null
          project_id: string
          prompt_triggers: string[] | null
          reference_image: string | null
          reference_images: Json | null
          turnaround: Json
          updated_at: string | null
          visual_anchors: Json | null
        }
        Insert: {
          aliases?: string[] | null
          consistency_string?: string | null
          created_at?: string | null
          description?: string | null
          embedding_data?: Json | null
          expressions?: Json | null
          handle: string
          id?: string
          ip_adapter_embedding?: Json | null
          name: string
          outfits?: Json | null
          project_id: string
          prompt_triggers?: string[] | null
          reference_image?: string | null
          reference_images?: Json | null
          turnaround: Json
          updated_at?: string | null
          visual_anchors?: Json | null
        }
        Update: {
          aliases?: string[] | null
          consistency_string?: string | null
          created_at?: string | null
          description?: string | null
          embedding_data?: Json | null
          expressions?: Json | null
          handle?: string
          id?: string
          ip_adapter_embedding?: Json | null
          name?: string
          outfits?: Json | null
          project_id?: string
          prompt_triggers?: string[] | null
          reference_image?: string | null
          reference_images?: Json | null
          turnaround?: Json
          updated_at?: string | null
          visual_anchors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string | null
          height: number
          id: string
          layout_suggestion: string | null
          layout_template_id: string | null
          layout_type: string
          margins: Json | null
          page_number: number
          project_id: string
          updated_at: string | null
          width: number
        }
        Insert: {
          created_at?: string | null
          height?: number
          id?: string
          layout_suggestion?: string | null
          layout_template_id?: string | null
          layout_type?: string
          margins?: Json | null
          page_number: number
          project_id: string
          updated_at?: string | null
          width?: number
        }
        Update: {
          created_at?: string | null
          height?: number
          id?: string
          layout_suggestion?: string | null
          layout_template_id?: string | null
          layout_type?: string
          margins?: Json | null
          page_number?: number
          project_id?: string
          updated_at?: string | null
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      panel_versions: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          panel_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          panel_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          panel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "panel_versions_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "panels"
            referencedColumns: ["id"]
          },
        ]
      }
      panels: {
        Row: {
          border_style: string | null
          border_width: number | null
          bubble_positions: Json | null
          bubbles: Json | null
          character_handles: string[] | null
          character_ids: string[] | null
          character_positions: Json | null
          character_refs: string[] | null
          controlnet_strength: number | null
          created_at: string | null
          generation_attempts: number | null
          generation_params: Json | null
          height: number
          id: string
          image_url: string | null
          page_id: string
          panel_index: number
          panel_margins: Json | null
          panel_type: string | null
          prompt: string | null
          quality_details: Json | null
          quality_score: number | null
          relative_height: number | null
          relative_width: number | null
          relative_x: number | null
          relative_y: number | null
          sketch_url: string | null
          style_locks: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          width: number
          x: number
          y: number
          z_index: number | null
        }
        Insert: {
          border_style?: string | null
          border_width?: number | null
          bubble_positions?: Json | null
          bubbles?: Json | null
          character_handles?: string[] | null
          character_ids?: string[] | null
          character_positions?: Json | null
          character_refs?: string[] | null
          controlnet_strength?: number | null
          created_at?: string | null
          generation_attempts?: number | null
          generation_params?: Json | null
          height: number
          id?: string
          image_url?: string | null
          page_id: string
          panel_index: number
          panel_margins?: Json | null
          panel_type?: string | null
          prompt?: string | null
          quality_details?: Json | null
          quality_score?: number | null
          relative_height?: number | null
          relative_width?: number | null
          relative_x?: number | null
          relative_y?: number | null
          sketch_url?: string | null
          style_locks?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          width: number
          x: number
          y: number
          z_index?: number | null
        }
        Update: {
          border_style?: string | null
          border_width?: number | null
          bubble_positions?: Json | null
          bubbles?: Json | null
          character_handles?: string[] | null
          character_ids?: string[] | null
          character_positions?: Json | null
          character_refs?: string[] | null
          controlnet_strength?: number | null
          created_at?: string | null
          generation_attempts?: number | null
          generation_params?: Json | null
          height?: number
          id?: string
          image_url?: string | null
          page_id?: string
          panel_index?: number
          panel_margins?: Json | null
          panel_type?: string | null
          prompt?: string | null
          quality_details?: Json | null
          quality_score?: number | null
          relative_height?: number | null
          relative_width?: number | null
          relative_x?: number | null
          relative_y?: number | null
          sketch_url?: string | null
          style_locks?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          width?: number
          x?: number
          y?: number
          z_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "panels_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      project_scripts: {
        Row: {
          content: string
          id: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          id?: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          id?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_scripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          dramatic_core: Json | null
          error_message: string | null
          generation_progress: Json | null
          generation_stage: string | null
          genre: string | null
          id: string
          metadata: Json | null
          preview_only: boolean | null
          story_analysis: Json | null
          style: string
          style_anchor_data: Json | null
          style_anchor_url: string | null
          synopsis: string | null
          thumbnail: string | null
          title: string
          total_pages: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dramatic_core?: Json | null
          error_message?: string | null
          generation_progress?: Json | null
          generation_stage?: string | null
          genre?: string | null
          id?: string
          metadata?: Json | null
          preview_only?: boolean | null
          story_analysis?: Json | null
          style: string
          style_anchor_data?: Json | null
          style_anchor_url?: string | null
          synopsis?: string | null
          thumbnail?: string | null
          title: string
          total_pages?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dramatic_core?: Json | null
          error_message?: string | null
          generation_progress?: Json | null
          generation_stage?: string | null
          genre?: string | null
          id?: string
          metadata?: Json | null
          preview_only?: boolean | null
          story_analysis?: Json | null
          style?: string
          style_anchor_data?: Json | null
          style_anchor_url?: string | null
          synopsis?: string | null
          thumbnail?: string | null
          title?: string
          total_pages?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
