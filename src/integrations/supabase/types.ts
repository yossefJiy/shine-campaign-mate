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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ab_tests: {
        Row: {
          campaign_id: string | null
          client_id: string | null
          confidence_level: number | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          results: Json | null
          sample_size: number | null
          start_date: string | null
          status: string | null
          updated_at: string
          variant_a: Json
          variant_b: Json
          winner: string | null
        }
        Insert: {
          campaign_id?: string | null
          client_id?: string | null
          confidence_level?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          results?: Json | null
          sample_size?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          variant_a?: Json
          variant_b?: Json
          winner?: string | null
        }
        Update: {
          campaign_id?: string | null
          client_id?: string | null
          confidence_level?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          results?: Json | null
          sample_size?: number | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
          variant_a?: Json
          variant_b?: Json
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_tests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          points_reward: number
          rarity: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          points_reward?: number
          rarity?: string
          requirement_type: string
          requirement_value: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          points_reward?: number
          rarity?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      ad_placements: {
        Row: {
          bid_amount: number | null
          campaign_id: string | null
          client_id: string | null
          created_at: string
          daily_budget: number | null
          id: string
          performance_data: Json | null
          placement_name: string | null
          placement_type: string
          platform: string
          status: string | null
          targeting_data: Json | null
          updated_at: string
        }
        Insert: {
          bid_amount?: number | null
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          daily_budget?: number | null
          id?: string
          performance_data?: Json | null
          placement_name?: string | null
          placement_type: string
          platform: string
          status?: string | null
          targeting_data?: Json | null
          updated_at?: string
        }
        Update: {
          bid_amount?: number | null
          campaign_id?: string | null
          client_id?: string | null
          created_at?: string
          daily_budget?: number | null
          id?: string
          performance_data?: Json | null
          placement_name?: string | null
          placement_type?: string
          platform?: string
          status?: string | null
          targeting_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_placements_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_placements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_agents: {
        Row: {
          agent_type: string
          capabilities: string[] | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          agent_type?: string
          capabilities?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          agent_type?: string
          capabilities?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agent_memory: {
        Row: {
          agent_id: string | null
          client_id: string | null
          content: string
          created_at: string | null
          expires_at: string | null
          id: string
          importance: number | null
          memory_type: string
          metadata: Json | null
          source: string | null
        }
        Insert: {
          agent_id?: string | null
          client_id?: string | null
          content: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          importance?: number | null
          memory_type: string
          metadata?: Json | null
          source?: string | null
        }
        Update: {
          agent_id?: string | null
          client_id?: string | null
          content?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          importance?: number | null
          memory_type?: string
          metadata?: Json | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_memory_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_memory_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agent_memory_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_actions: {
        Row: {
          action_data: Json | null
          action_type: string
          agent_id: string | null
          approved_at: string | null
          approved_by: string | null
          client_id: string | null
          created_at: string
          executed_at: string | null
          id: string
          result: Json | null
          status: string
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          agent_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          result?: Json | null
          status?: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          agent_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          result?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_actions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_actions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_agent_actions_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_permissions: {
        Row: {
          agent_id: string
          capability_id: string
          client_id: string | null
          created_at: string | null
          current_daily_uses: number | null
          domain: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_allowed: boolean | null
          max_daily_uses: number | null
          notes: string | null
          requires_approval: boolean | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          capability_id: string
          client_id?: string | null
          created_at?: string | null
          current_daily_uses?: number | null
          domain?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_allowed?: boolean | null
          max_daily_uses?: number | null
          notes?: string | null
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          capability_id?: string
          client_id?: string | null
          created_at?: string | null
          current_daily_uses?: number | null
          domain?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_allowed?: boolean | null
          max_daily_uses?: number | null
          notes?: string | null
          requires_approval?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_permissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_permissions_capability_id_fkey"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "ai_capability_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_permissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_agent_permissions_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          agency_agent_id: string | null
          agent_type: string
          capabilities: string[] | null
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          agency_agent_id?: string | null
          agent_type?: string
          capabilities?: string[] | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          agency_agent_id?: string | null
          agent_type?: string
          capabilities?: string[] | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_agency_agent_id_fkey"
            columns: ["agency_agent_id"]
            isOneToOne: false
            referencedRelation: "agency_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_agents_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_capability_definitions: {
        Row: {
          category: Database["public"]["Enums"]["ai_capability_category"]
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          is_dangerous: boolean | null
          metadata: Json | null
          name: string
          requires_confirmation: boolean | null
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["ai_capability_category"]
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          is_dangerous?: boolean | null
          metadata?: Json | null
          name: string
          requires_confirmation?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["ai_capability_category"]
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_dangerous?: boolean | null
          metadata?: Json | null
          name?: string
          requires_confirmation?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_capability_usage: {
        Row: {
          agent_id: string | null
          approved_by: string | null
          capability_id: string | null
          client_id: string | null
          error_message: string | null
          executed_at: string | null
          execution_result: Json | null
          id: string
          metadata: Json | null
          permission_id: string | null
          was_allowed: boolean
          was_approved: boolean | null
        }
        Insert: {
          agent_id?: string | null
          approved_by?: string | null
          capability_id?: string | null
          client_id?: string | null
          error_message?: string | null
          executed_at?: string | null
          execution_result?: Json | null
          id?: string
          metadata?: Json | null
          permission_id?: string | null
          was_allowed: boolean
          was_approved?: boolean | null
        }
        Update: {
          agent_id?: string | null
          approved_by?: string | null
          capability_id?: string | null
          client_id?: string | null
          error_message?: string | null
          executed_at?: string | null
          execution_result?: Json | null
          id?: string
          metadata?: Json | null
          permission_id?: string | null
          was_allowed?: boolean
          was_approved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_capability_usage_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_capability_usage_capability_id_fkey"
            columns: ["capability_id"]
            isOneToOne: false
            referencedRelation: "ai_capability_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_capability_usage_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_capability_usage_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_capability_usage_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_content_history: {
        Row: {
          client_id: string | null
          content_type: string
          created_at: string | null
          created_by: string | null
          generated_content: string
          id: string
          metadata: Json | null
          model_used: string | null
          prompt: string
          rating: number | null
          used_in_draft_id: string | null
        }
        Insert: {
          client_id?: string | null
          content_type: string
          created_at?: string | null
          created_by?: string | null
          generated_content: string
          id?: string
          metadata?: Json | null
          model_used?: string | null
          prompt: string
          rating?: number | null
          used_in_draft_id?: string | null
        }
        Update: {
          client_id?: string | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          generated_content?: string
          id?: string
          metadata?: Json | null
          model_used?: string | null
          prompt?: string
          rating?: number | null
          used_in_draft_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_history_used_in_draft_id_fkey"
            columns: ["used_in_draft_id"]
            isOneToOne: false
            referencedRelation: "content_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_module_settings: {
        Row: {
          allowed_capabilities: string[] | null
          allowed_for_users: string[] | null
          client_id: string | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          module_name: string
          restricted_for_users: string[] | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          allowed_capabilities?: string[] | null
          allowed_for_users?: string[] | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_name: string
          restricted_for_users?: string[] | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          allowed_capabilities?: string[] | null
          allowed_for_users?: string[] | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          module_name?: string
          restricted_for_users?: string[] | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_module_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_module_settings_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_query_history: {
        Row: {
          action: string
          citations: Json | null
          client_id: string | null
          created_at: string
          created_by: string | null
          estimated_cost: number | null
          executed_actions: Json | null
          id: string
          input_tokens: number | null
          issue_id: string | null
          issue_title: string | null
          model: string
          output_tokens: number | null
          prompt_summary: string | null
          provider: string | null
          response: string | null
        }
        Insert: {
          action: string
          citations?: Json | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          estimated_cost?: number | null
          executed_actions?: Json | null
          id?: string
          input_tokens?: number | null
          issue_id?: string | null
          issue_title?: string | null
          model: string
          output_tokens?: number | null
          prompt_summary?: string | null
          provider?: string | null
          response?: string | null
        }
        Update: {
          action?: string
          citations?: Json | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          estimated_cost?: number | null
          executed_actions?: Json | null
          id?: string
          input_tokens?: number | null
          issue_id?: string | null
          issue_title?: string | null
          model?: string
          output_tokens?: number | null
          prompt_summary?: string | null
          provider?: string | null
          response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_query_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_query_history_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "code_health_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_query_history_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_team_permissions: {
        Row: {
          can_approve_actions: boolean | null
          can_use_ai: boolean | null
          client_id: string | null
          created_at: string | null
          current_daily_requests: number | null
          id: string
          last_reset_at: string | null
          max_daily_requests: number | null
          module_name: string
          team_member_id: string | null
          updated_at: string | null
        }
        Insert: {
          can_approve_actions?: boolean | null
          can_use_ai?: boolean | null
          client_id?: string | null
          created_at?: string | null
          current_daily_requests?: number | null
          id?: string
          last_reset_at?: string | null
          max_daily_requests?: number | null
          module_name: string
          team_member_id?: string | null
          updated_at?: string | null
        }
        Update: {
          can_approve_actions?: boolean | null
          can_use_ai?: boolean | null
          client_id?: string | null
          created_at?: string | null
          current_daily_requests?: number | null
          id?: string
          last_reset_at?: string | null
          max_daily_requests?: number | null
          module_name?: string
          team_member_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_team_permissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_team_permissions_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_team_permissions_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_alerts: {
        Row: {
          alert_type: string
          client_id: string | null
          created_at: string
          current_usage: number | null
          id: string
          is_read: boolean | null
          limit_value: number | null
          period_type: string
          sent_via: string | null
          threshold_percent: number | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          client_id?: string | null
          created_at?: string
          current_usage?: number | null
          id?: string
          is_read?: boolean | null
          limit_value?: number | null
          period_type: string
          sent_via?: string | null
          threshold_percent?: number | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          client_id?: string | null
          created_at?: string
          current_usage?: number | null
          id?: string
          is_read?: boolean | null
          limit_value?: number | null
          period_type?: string
          sent_via?: string | null
          threshold_percent?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_usage_alerts_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_limits: {
        Row: {
          allowed_models: string[] | null
          created_at: string
          daily_cost_limit: number | null
          daily_requests_limit: number | null
          default_model: string | null
          id: string
          limit_type: string
          max_input_tokens: number | null
          max_output_tokens: number | null
          monthly_cost_limit: number | null
          monthly_requests_limit: number | null
          premium_models_enabled: boolean | null
          target_id: string | null
          updated_at: string
        }
        Insert: {
          allowed_models?: string[] | null
          created_at?: string
          daily_cost_limit?: number | null
          daily_requests_limit?: number | null
          default_model?: string | null
          id?: string
          limit_type: string
          max_input_tokens?: number | null
          max_output_tokens?: number | null
          monthly_cost_limit?: number | null
          monthly_requests_limit?: number | null
          premium_models_enabled?: boolean | null
          target_id?: string | null
          updated_at?: string
        }
        Update: {
          allowed_models?: string[] | null
          created_at?: string
          daily_cost_limit?: number | null
          daily_requests_limit?: number | null
          default_model?: string | null
          id?: string
          limit_type?: string
          max_input_tokens?: number | null
          max_output_tokens?: number | null
          monthly_cost_limit?: number | null
          monthly_requests_limit?: number | null
          premium_models_enabled?: boolean | null
          target_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      analytics_snapshots: {
        Row: {
          client_id: string
          created_at: string
          data: Json
          id: string
          integration_id: string | null
          metrics: Json
          platform: string
          snapshot_date: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          data?: Json
          id?: string
          integration_id?: string | null
          metrics?: Json
          platform: string
          snapshot_date?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          data?: Json
          id?: string
          integration_id?: string | null
          metrics?: Json
          platform?: string
          snapshot_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_snapshots_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_snapshots_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_snapshots_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_analytics_snapshots_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_comments: {
        Row: {
          approval_item_id: string
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          user_id: string
        }
        Insert: {
          approval_item_id: string
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          user_id: string
        }
        Update: {
          approval_item_id?: string
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_comments_approval_item_id_fkey"
            columns: ["approval_item_id"]
            isOneToOne: false
            referencedRelation: "approval_items"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_decisions: {
        Row: {
          approval_item_id: string
          approver_id: string
          comments: string | null
          decided_at: string
          decision: string
          id: string
          step_number: number
        }
        Insert: {
          approval_item_id: string
          approver_id: string
          comments?: string | null
          decided_at?: string
          decision: string
          id?: string
          step_number: number
        }
        Update: {
          approval_item_id?: string
          approver_id?: string
          comments?: string | null
          decided_at?: string
          decision?: string
          id?: string
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "approval_decisions_approval_item_id_fkey"
            columns: ["approval_item_id"]
            isOneToOne: false
            referencedRelation: "approval_items"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_items: {
        Row: {
          client_id: string | null
          created_at: string
          current_step: number | null
          data: Json | null
          description: string | null
          due_date: string | null
          id: string
          item_id: string | null
          item_type: string
          metadata: Json | null
          priority: string | null
          status: string
          submitted_at: string
          submitted_by: string | null
          title: string
          total_steps: number | null
          updated_at: string
          workflow_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          current_step?: number | null
          data?: Json | null
          description?: string | null
          due_date?: string | null
          id?: string
          item_id?: string | null
          item_type: string
          metadata?: Json | null
          priority?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string | null
          title: string
          total_steps?: number | null
          updated_at?: string
          workflow_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          current_step?: number | null
          data?: Json | null
          description?: string | null
          due_date?: string | null
          id?: string
          item_id?: string | null
          item_type?: string
          metadata?: Json | null
          priority?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string | null
          title?: string
          total_steps?: number | null
          updated_at?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_items_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "approval_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_workflows: {
        Row: {
          auto_approve_threshold: number | null
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          require_all_approvers: boolean | null
          steps: Json
          updated_at: string
          workflow_type: string
        }
        Insert: {
          auto_approve_threshold?: number | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          require_all_approvers?: boolean | null
          steps?: Json
          updated_at?: string
          workflow_type: string
        }
        Update: {
          auto_approve_threshold?: number | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          require_all_approvers?: boolean | null
          steps?: Json
          updated_at?: string
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_workflows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      authorized_emails: {
        Row: {
          created_at: string | null
          email: string
          id: string
          invited_at: string | null
          is_active: boolean | null
          last_login_at: string | null
          name: string | null
          notification_preference: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          invited_at?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          notification_preference?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          invited_at?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          notification_preference?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      brand_assets: {
        Row: {
          asset_type: string
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_primary: boolean | null
          metadata: Json | null
          name: string
          sort_order: number | null
          updated_at: string | null
          value: string
        }
        Insert: {
          asset_type: string
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_primary?: boolean | null
          metadata?: Json | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          value: string
        }
        Update: {
          asset_type?: string
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_primary?: boolean | null
          metadata?: Json | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_assets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_health_scores: {
        Row: {
          calculated_at: string
          client_id: string
          competitive_score: number | null
          engagement_score: number | null
          growth_score: number | null
          id: string
          overall_score: number
          period_end: string | null
          period_start: string | null
          score_breakdown: Json | null
          sentiment_score: number | null
          visibility_score: number | null
        }
        Insert: {
          calculated_at?: string
          client_id: string
          competitive_score?: number | null
          engagement_score?: number | null
          growth_score?: number | null
          id?: string
          overall_score?: number
          period_end?: string | null
          period_start?: string | null
          score_breakdown?: Json | null
          sentiment_score?: number | null
          visibility_score?: number | null
        }
        Update: {
          calculated_at?: string
          client_id?: string
          competitive_score?: number | null
          engagement_score?: number | null
          growth_score?: number | null
          id?: string
          overall_score?: number
          period_end?: string | null
          period_start?: string | null
          score_breakdown?: Json | null
          sentiment_score?: number | null
          visibility_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_health_scores_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_kpis: {
        Row: {
          category: string
          client_id: string
          created_at: string
          current_value: number | null
          data_source: string | null
          description: string | null
          id: string
          is_active: boolean | null
          metric_type: string
          name: string
          period: string
          period_end: string | null
          period_start: string | null
          previous_value: number | null
          sort_order: number | null
          status: string
          target_value: number
          threshold_critical: number | null
          threshold_warning: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          client_id: string
          created_at?: string
          current_value?: number | null
          data_source?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metric_type?: string
          name: string
          period?: string
          period_end?: string | null
          period_start?: string | null
          previous_value?: number | null
          sort_order?: number | null
          status?: string
          target_value: number
          threshold_critical?: number | null
          threshold_warning?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          client_id?: string
          created_at?: string
          current_value?: number | null
          data_source?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metric_type?: string
          name?: string
          period?: string
          period_end?: string | null
          period_start?: string | null
          previous_value?: number | null
          sort_order?: number | null
          status?: string
          target_value?: number
          threshold_critical?: number | null
          threshold_warning?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_kpis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_rules: {
        Row: {
          actions: Json
          campaign_id: string | null
          client_id: string | null
          conditions: Json
          created_at: string
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          priority: number | null
          rule_type: string
          trigger_count: number | null
          updated_at: string
        }
        Insert: {
          actions?: Json
          campaign_id?: string | null
          client_id?: string | null
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          priority?: number | null
          rule_type: string
          trigger_count?: number | null
          updated_at?: string
        }
        Update: {
          actions?: Json
          campaign_id?: string | null
          client_id?: string | null
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          priority?: number | null
          rule_type?: string
          trigger_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_rules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_rules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          clicks: number | null
          client_id: string
          conversions: number | null
          created_at: string
          description: string | null
          end_date: string | null
          external_id: string | null
          id: string
          impressions: number | null
          name: string
          platform: string
          spent: number | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          clicks?: number | null
          client_id: string
          conversions?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          external_id?: string | null
          id?: string
          impressions?: number | null
          name: string
          platform: string
          spent?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          clicks?: number | null
          client_id?: string
          conversions?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          external_id?: string | null
          id?: string
          impressions?: number | null
          name?: string
          platform?: string
          spent?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_campaigns_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          agent_type: string
          client_id: string | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_type?: string
          client_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_type?: string
          client_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_conversations_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_agent_tokens: {
        Row: {
          agent_id: string
          allowed_origins: string[] | null
          client_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          rate_limit_per_day: number | null
          rate_limit_per_minute: number | null
          token: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          agent_id: string
          allowed_origins?: string[] | null
          client_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          token: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          agent_id?: string
          allowed_origins?: string[] | null
          client_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          token?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_agent_tokens_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_agent_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_agent_tokens_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string | null
          email: string | null
          has_portal_access: boolean | null
          id: string
          is_primary: boolean | null
          name: string
          phone: string | null
          receive_task_updates: boolean | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          email?: string | null
          has_portal_access?: boolean | null
          id?: string
          is_primary?: boolean | null
          name: string
          phone?: string | null
          receive_task_updates?: boolean | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          email?: string | null
          has_portal_access?: boolean | null
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string | null
          receive_task_updates?: boolean | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_contacts_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_credit_packages: {
        Row: {
          created_at: string | null
          credits: number
          hours_equivalent: number
          id: string
          is_default: boolean | null
          name: string
          price_per_hour: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits: number
          hours_equivalent: number
          id?: string
          is_default?: boolean | null
          name: string
          price_per_hour?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          hours_equivalent?: number
          id?: string
          is_default?: boolean | null
          name?: string
          price_per_hour?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      client_credits: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          notify_at_percentage: number | null
          package_id: string | null
          period_end: string
          period_start: string
          show_credits_to_client: boolean | null
          total_credits: number
          updated_at: string | null
          used_credits: number
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notify_at_percentage?: number | null
          package_id?: string | null
          period_end?: string
          period_start?: string
          show_credits_to_client?: boolean | null
          total_credits?: number
          updated_at?: string | null
          used_credits?: number
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notify_at_percentage?: number | null
          package_id?: string | null
          period_end?: string
          period_start?: string
          show_credits_to_client?: boolean | null
          total_credits?: number
          updated_at?: string | null
          used_credits?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_credits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_credits_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_credit_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_credits_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_insights: {
        Row: {
          client_id: string
          created_at: string
          id: string
          insight_type: string
          insights: Json | null
          metrics: Json | null
          period_end: string
          period_start: string
          recommendations: string[] | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          insight_type: string
          insights?: Json | null
          metrics?: Json | null
          period_end: string
          period_start: string
          recommendations?: string[] | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          insight_type?: string
          insights?: Json | null
          metrics?: Json | null
          period_end?: string
          period_start?: string
          recommendations?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "client_insights_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_insights_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_limits: {
        Row: {
          alert_at_percentage: number | null
          block_at_limit: boolean | null
          client_id: string
          created_at: string
          id: string
          limit_type: string
          monthly_credits_limit: number | null
          monthly_hours_limit: number | null
          overage_rate: number | null
          percentage_base: number | null
          updated_at: string
        }
        Insert: {
          alert_at_percentage?: number | null
          block_at_limit?: boolean | null
          client_id: string
          created_at?: string
          id?: string
          limit_type?: string
          monthly_credits_limit?: number | null
          monthly_hours_limit?: number | null
          overage_rate?: number | null
          percentage_base?: number | null
          updated_at?: string
        }
        Update: {
          alert_at_percentage?: number | null
          block_at_limit?: boolean | null
          client_id?: string
          created_at?: string
          id?: string
          limit_type?: string
          monthly_credits_limit?: number | null
          monthly_hours_limit?: number | null
          overage_rate?: number | null
          percentage_base?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_limits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_performance_history: {
        Row: {
          client_id: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_unit: string | null
          metric_value: number
          recorded_at: string
          source: string | null
        }
        Insert: {
          client_id: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          recorded_at?: string
          source?: string | null
        }
        Update: {
          client_id?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          recorded_at?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_performance_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_performance_history_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_services: {
        Row: {
          billing_cycle: string | null
          category: string | null
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          price: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          price: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_team: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_lead: boolean | null
          role: string | null
          team_member_id: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_lead?: boolean | null
          role?: string | null
          team_member_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_lead?: boolean | null
          role?: string | null
          team_member_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_team_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_team_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_team_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_templates: {
        Row: {
          created_at: string
          default_settings: Json | null
          description: string | null
          icon: string | null
          id: string
          industry: string
          integrations_suggested: string[] | null
          is_active: boolean | null
          modules_enabled: Json
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_settings?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          industry: string
          integrations_suggested?: string[] | null
          is_active?: boolean | null
          modules_enabled?: Json
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_settings?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          industry?: string
          integrations_suggested?: string[] | null
          is_active?: boolean | null
          modules_enabled?: Json
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      client_user_access: {
        Row: {
          access_level: string
          client_id: string
          granted_at: string
          granted_by: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level?: string
          client_id: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: string
          client_id?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_user_access_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_users: {
        Row: {
          access_level: string
          client_id: string
          created_at: string
          department: string | null
          id: string
          user_id: string
        }
        Insert: {
          access_level?: string
          client_id: string
          created_at?: string
          department?: string | null
          id?: string
          user_id: string
        }
        Update: {
          access_level?: string
          client_id?: string
          created_at?: string
          department?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_client_users_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          account_type: string | null
          avg_profit_margin: number | null
          created_at: string
          deleted_at: string | null
          description: string | null
          facebook_ads_manager_url: string | null
          facebook_url: string | null
          google_ads_manager_url: string | null
          id: string
          industry: string | null
          instagram_url: string | null
          is_active: boolean | null
          is_agency_brand: boolean | null
          is_favorite: boolean | null
          is_master_account: boolean
          jiy_commission_percent: number | null
          linkedin_url: string | null
          logo_url: string | null
          modules_enabled: Json | null
          modules_order: Json | null
          name: string
          shopify_email: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          account_type?: string | null
          avg_profit_margin?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          facebook_ads_manager_url?: string | null
          facebook_url?: string | null
          google_ads_manager_url?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          is_agency_brand?: boolean | null
          is_favorite?: boolean | null
          is_master_account?: boolean
          jiy_commission_percent?: number | null
          linkedin_url?: string | null
          logo_url?: string | null
          modules_enabled?: Json | null
          modules_order?: Json | null
          name: string
          shopify_email?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_type?: string | null
          avg_profit_margin?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          facebook_ads_manager_url?: string | null
          facebook_url?: string | null
          google_ads_manager_url?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          is_agency_brand?: boolean | null
          is_favorite?: boolean | null
          is_master_account?: boolean
          jiy_commission_percent?: number | null
          linkedin_url?: string | null
          logo_url?: string | null
          modules_enabled?: Json | null
          modules_order?: Json | null
          name?: string
          shopify_email?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      code_health_issues: {
        Row: {
          category: string
          created_at: string
          description: string | null
          details: Json | null
          detected_at: string
          id: string
          ignore_reason: string | null
          ignored_at: string | null
          ignored_by: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          details?: Json | null
          detected_at?: string
          id?: string
          ignore_reason?: string | null
          ignored_at?: string | null
          ignored_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          details?: Json | null
          detected_at?: string
          id?: string
          ignore_reason?: string | null
          ignored_at?: string | null
          ignored_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      code_health_reports: {
        Row: {
          created_at: string
          critical_count: number
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          info_count: number
          issues_data: Json | null
          report_date: string
          total_issues: number
          warning_count: number
        }
        Insert: {
          created_at?: string
          critical_count?: number
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          info_count?: number
          issues_data?: Json | null
          report_date?: string
          total_issues?: number
          warning_count?: number
        }
        Update: {
          created_at?: string
          critical_count?: number
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          info_count?: number
          issues_data?: Json | null
          report_date?: string
          total_issues?: number
          warning_count?: number
        }
        Relationships: []
      }
      competitor_metrics: {
        Row: {
          competitor_id: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          recorded_at: string
          source: string | null
        }
        Insert: {
          competitor_id: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          recorded_at?: string
          source?: string | null
        }
        Update: {
          competitor_id?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          recorded_at?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_metrics_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitor_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_tracking: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string
          social_links: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          social_links?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          social_links?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_tracking_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar: {
        Row: {
          assigned_to: string | null
          client_id: string
          color: string | null
          content: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          platforms: string[] | null
          post_id: string | null
          status: string
          tags: string[] | null
          time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          color?: string | null
          content?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          platforms?: string[] | null
          post_id?: string | null
          status?: string
          tags?: string[] | null
          time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          color?: string | null
          content?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          platforms?: string[] | null
          post_id?: string | null
          status?: string
          tags?: string[] | null
          time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_drafts: {
        Row: {
          client_id: string | null
          content: string | null
          content_type: string
          created_at: string | null
          created_by: string | null
          id: string
          media_ids: string[] | null
          metadata: Json | null
          platforms: string[] | null
          scheduled_for: string | null
          status: string
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          client_id?: string | null
          content?: string | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          media_ids?: string[] | null
          metadata?: Json | null
          platforms?: string[] | null
          scheduled_for?: string | null
          status?: string
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          client_id?: string | null
          content?: string | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          media_ids?: string[] | null
          metadata?: Json | null
          platforms?: string[] | null
          scheduled_for?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_drafts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      content_templates: {
        Row: {
          category: string
          client_id: string | null
          content: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_global: boolean | null
          media_urls: Json | null
          name: string
          platforms: string[] | null
          updated_at: string | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          category?: string
          client_id?: string | null
          content: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          media_urls?: Json | null
          name: string
          platforms?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          category?: string
          client_id?: string | null
          content?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          media_urls?: Json | null
          name?: string
          platforms?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "content_templates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_alerts: {
        Row: {
          alert_type: string
          client_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
        }
        Insert: {
          alert_type: string
          client_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
        }
        Update: {
          alert_type?: string
          client_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_credit_alerts_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_formulas: {
        Row: {
          base_credits: number
          complexity_multiplier: number
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          time_multiplier: number
          updated_at: string
        }
        Insert: {
          base_credits?: number
          complexity_multiplier?: number
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          time_multiplier?: number
          updated_at?: string
        }
        Update: {
          base_credits?: number
          complexity_multiplier?: number
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          time_multiplier?: number
          updated_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          client_credit_id: string | null
          client_id: string
          created_at: string | null
          created_by: string | null
          credits_amount: number
          description: string | null
          id: string
          task_id: string | null
          transaction_type: string
        }
        Insert: {
          client_credit_id?: string | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          credits_amount: number
          description?: string | null
          id?: string
          task_id?: string | null
          transaction_type: string
        }
        Update: {
          client_credit_id?: string | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          credits_amount?: number
          description?: string | null
          id?: string
          task_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_client_credit_id_fkey"
            columns: ["client_credit_id"]
            isOneToOne: false
            referencedRelation: "client_credits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_credit_transactions_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segments: {
        Row: {
          avg_order_value: number | null
          client_id: string | null
          conditions: Json
          created_at: string
          customer_count: number | null
          description: string | null
          id: string
          is_active: boolean | null
          last_calculated_at: string | null
          name: string
          segment_type: string | null
          total_revenue: number | null
          updated_at: string
        }
        Insert: {
          avg_order_value?: number | null
          client_id?: string | null
          conditions?: Json
          created_at?: string
          customer_count?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_calculated_at?: string | null
          name: string
          segment_type?: string | null
          total_revenue?: number | null
          updated_at?: string
        }
        Update: {
          avg_order_value?: number | null
          client_id?: string | null
          conditions?: Json
          created_at?: string
          customer_count?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_calculated_at?: string | null
          name?: string
          segment_type?: string | null
          total_revenue?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_segments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          streak_start_date: string | null
          total_active_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          streak_start_date?: string | null
          total_active_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          streak_start_date?: string | null
          total_active_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dynamic_module_messages: {
        Row: {
          ai_classified_type: string | null
          content: string
          created_at: string | null
          error_message: string | null
          estimated_cost: number | null
          id: string
          input_tokens: number | null
          key_points: string[] | null
          output_tokens: number | null
          part_number: number | null
          rating_feedback: string | null
          response_time_ms: number | null
          role: string
          session_id: string | null
          task_category: string | null
          task_complexity: string | null
          task_type: string | null
          tokens_used: number | null
          user_corrected_type: string | null
          user_rating: number | null
          was_successful: boolean | null
        }
        Insert: {
          ai_classified_type?: string | null
          content: string
          created_at?: string | null
          error_message?: string | null
          estimated_cost?: number | null
          id?: string
          input_tokens?: number | null
          key_points?: string[] | null
          output_tokens?: number | null
          part_number?: number | null
          rating_feedback?: string | null
          response_time_ms?: number | null
          role: string
          session_id?: string | null
          task_category?: string | null
          task_complexity?: string | null
          task_type?: string | null
          tokens_used?: number | null
          user_corrected_type?: string | null
          user_rating?: number | null
          was_successful?: boolean | null
        }
        Update: {
          ai_classified_type?: string | null
          content?: string
          created_at?: string | null
          error_message?: string | null
          estimated_cost?: number | null
          id?: string
          input_tokens?: number | null
          key_points?: string[] | null
          output_tokens?: number | null
          part_number?: number | null
          rating_feedback?: string | null
          response_time_ms?: number | null
          role?: string
          session_id?: string | null
          task_category?: string | null
          task_complexity?: string | null
          task_type?: string | null
          tokens_used?: number | null
          user_corrected_type?: string | null
          user_rating?: number | null
          was_successful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_module_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dynamic_module_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_module_sessions: {
        Row: {
          client_id: string | null
          contact_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          module_id: string | null
          status: string | null
          template_id: string | null
          title: string | null
          total_cost: number | null
          total_tokens: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          module_id?: string | null
          status?: string | null
          template_id?: string | null
          title?: string | null
          total_cost?: number | null
          total_tokens?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          module_id?: string | null
          status?: string | null
          template_id?: string | null
          title?: string | null
          total_cost?: number | null
          total_tokens?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_module_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dynamic_module_sessions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "dynamic_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dynamic_module_sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "dynamic_module_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_module_templates: {
        Row: {
          background_context: string | null
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          module_id: string | null
          name: string
          parts: Json
          sort_order: number | null
          system_prompt: string | null
          template_type: string
        }
        Insert: {
          background_context?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          module_id?: string | null
          name: string
          parts?: Json
          sort_order?: number | null
          system_prompt?: string | null
          template_type?: string
        }
        Update: {
          background_context?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          module_id?: string | null
          name?: string
          parts?: Json
          sort_order?: number | null
          system_prompt?: string | null
          template_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_module_templates_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "dynamic_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_modules: {
        Row: {
          ai_model: string
          ai_provider: string
          allowed_roles: string[] | null
          category: string
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          system_prompt: string | null
          updated_at: string | null
        }
        Insert: {
          ai_model?: string
          ai_provider?: string
          allowed_roles?: string[] | null
          category: string
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          system_prompt?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_model?: string
          ai_provider?: string
          allowed_roles?: string[] | null
          category?: string
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          system_prompt?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feature_requests: {
        Row: {
          archived_at: string | null
          category: string | null
          client_id: string | null
          completed_at: string | null
          converted_task_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          client_id?: string | null
          completed_at?: string | null
          converted_task_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          client_id?: string | null
          completed_at?: string | null
          converted_task_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_requests_converted_task_id_fkey"
            columns: ["converted_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_feature_requests_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      global_module_settings: {
        Row: {
          created_at: string | null
          default_for_basic: boolean | null
          default_for_premium: boolean | null
          display_name: string
          id: string
          is_globally_enabled: boolean | null
          module_name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_for_basic?: boolean | null
          default_for_premium?: boolean | null
          display_name: string
          id?: string
          is_globally_enabled?: boolean | null
          module_name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_for_basic?: boolean | null
          default_for_premium?: boolean | null
          display_name?: string
          id?: string
          is_globally_enabled?: boolean | null
          module_name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hashtag_groups: {
        Row: {
          category: string | null
          client_id: string
          created_at: string | null
          hashtags: string[]
          id: string
          last_used_at: string | null
          name: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          client_id: string
          created_at?: string | null
          hashtags: string[]
          id?: string
          last_used_at?: string | null
          name: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          client_id?: string
          created_at?: string | null
          hashtags?: string[]
          id?: string
          last_used_at?: string | null
          name?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_groups_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_benchmarks: {
        Row: {
          created_at: string
          id: string
          industry: string
          metric_name: string
          metric_unit: string | null
          metric_value: number
          percentile: number | null
          source: string | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          industry: string
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          percentile?: number | null
          source?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          percentile?: number | null
          source?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          client_id: string
          created_at: string
          encrypted_credentials: string | null
          external_account_id: string | null
          id: string
          is_connected: boolean
          last_sync_at: string | null
          platform: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          encrypted_credentials?: string | null
          external_account_id?: string | null
          id?: string
          is_connected?: boolean
          last_sync_at?: string | null
          platform: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          encrypted_credentials?: string | null
          external_account_id?: string | null
          id?: string
          is_connected?: boolean
          last_sync_at?: string | null
          platform?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_integrations_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          discount_percent: number | null
          id: string
          invoice_id: string
          quantity: number
          service_id: string | null
          sort_order: number | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          discount_percent?: number | null
          id?: string
          invoice_id: string
          quantity?: number
          service_id?: string | null
          sort_order?: number | null
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          discount_percent?: number | null
          id?: string
          invoice_id?: string
          quantity?: number
          service_id?: string | null
          sort_order?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "client_services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          due_date: string | null
          icount_doc_id: string | null
          icount_synced_at: string | null
          id: string
          invoice_number: string
          issue_date: string
          metadata: Json | null
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_method: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          terms: string | null
          total_amount: number
          type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          icount_doc_id?: string | null
          icount_synced_at?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          metadata?: Json | null
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          total_amount?: number
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          icount_doc_id?: string | null
          icount_synced_at?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          metadata?: Json | null
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          total_amount?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_history: {
        Row: {
          id: string
          kpi_id: string
          metadata: Json | null
          recorded_at: string
          recorded_value: number
          status: string
          target_value: number
        }
        Insert: {
          id?: string
          kpi_id: string
          metadata?: Json | null
          recorded_at?: string
          recorded_value: number
          status: string
          target_value: number
        }
        Update: {
          id?: string
          kpi_id?: string
          metadata?: Json | null
          recorded_at?: string
          recorded_value?: number
          status?: string
          target_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_history_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "brand_kpis"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lead_id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_conversations: {
        Row: {
          channel: string
          created_at: string
          external_id: string | null
          id: string
          last_message_at: string | null
          lead_id: string
          metadata: Json | null
          status: string | null
          unread_count: number | null
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          external_id?: string | null
          id?: string
          last_message_at?: string | null
          lead_id: string
          metadata?: Json | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          external_id?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string
          metadata?: Json | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_messages: {
        Row: {
          content: string
          content_type: string | null
          conversation_id: string
          created_at: string
          direction: string
          external_id: string | null
          id: string
          media_url: string | null
          metadata: Json | null
          sender_id: string | null
          sender_type: string
          status: string | null
        }
        Insert: {
          content: string
          content_type?: string | null
          conversation_id: string
          created_at?: string
          direction: string
          external_id?: string | null
          id?: string
          media_url?: string | null
          metadata?: Json | null
          sender_id?: string | null
          sender_type: string
          status?: string | null
        }
        Update: {
          content?: string
          content_type?: string | null
          conversation_id?: string
          created_at?: string
          direction?: string
          external_id?: string | null
          id?: string
          media_url?: string | null
          metadata?: Json | null
          sender_id?: string | null
          sender_type?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lead_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_cache: {
        Row: {
          calculated_at: string
          current_streak: number
          id: string
          period: string
          points: number
          rank: number
          tasks_completed: number
          user_avatar: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          calculated_at?: string
          current_streak?: number
          id?: string
          period: string
          points: number
          rank: number
          tasks_completed?: number
          user_avatar?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          calculated_at?: string
          current_streak?: number
          id?: string
          period?: string
          points?: number
          rank?: number
          tasks_completed?: number
          user_avatar?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_agent_id: string | null
          assigned_user_id: string | null
          client_id: string | null
          company: string | null
          conversion_value: number | null
          created_at: string
          email: string
          id: string
          last_contact_at: string | null
          lead_score: number | null
          lost_reason: string | null
          message: string | null
          metadata: Json | null
          name: string
          next_followup_at: string | null
          phone: string | null
          pipeline_stage: string | null
          priority: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
          won_at: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          assigned_user_id?: string | null
          client_id?: string | null
          company?: string | null
          conversion_value?: number | null
          created_at?: string
          email: string
          id?: string
          last_contact_at?: string | null
          lead_score?: number | null
          lost_reason?: string | null
          message?: string | null
          metadata?: Json | null
          name: string
          next_followup_at?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          won_at?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          assigned_user_id?: string | null
          client_id?: string | null
          company?: string | null
          conversion_value?: number | null
          created_at?: string
          email?: string
          id?: string
          last_contact_at?: string | null
          lead_score?: number | null
          lost_reason?: string | null
          message?: string | null
          metadata?: Json | null
          name?: string
          next_followup_at?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_data: {
        Row: {
          client_id: string
          created_at: string
          data: Json
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          data?: Json
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          data?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_marketing_data_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_data_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      media_library: {
        Row: {
          alt_text: string | null
          client_id: string | null
          created_at: string | null
          file_size: number | null
          file_type: string
          file_url: string
          folder: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          client_id?: string | null
          created_at?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          folder?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          client_id?: string | null
          created_at?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          folder?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_library_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      module_usage_analytics: {
        Row: {
          action_type: string | null
          ai_model: string
          ai_provider: string
          client_id: string | null
          contact_id: string | null
          created_at: string | null
          error_message: string | null
          estimated_cost: number | null
          final_task_type: string | null
          id: string
          input_tokens: number | null
          message_id: string | null
          module_id: string | null
          output_tokens: number | null
          response_time_ms: number | null
          session_id: string | null
          task_category: string | null
          task_complexity: string | null
          task_type: string | null
          total_tokens: number | null
          user_id: string | null
          user_rating: number | null
          was_successful: boolean | null
        }
        Insert: {
          action_type?: string | null
          ai_model: string
          ai_provider: string
          client_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_cost?: number | null
          final_task_type?: string | null
          id?: string
          input_tokens?: number | null
          message_id?: string | null
          module_id?: string | null
          output_tokens?: number | null
          response_time_ms?: number | null
          session_id?: string | null
          task_category?: string | null
          task_complexity?: string | null
          task_type?: string | null
          total_tokens?: number | null
          user_id?: string | null
          user_rating?: number | null
          was_successful?: boolean | null
        }
        Update: {
          action_type?: string | null
          ai_model?: string
          ai_provider?: string
          client_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_cost?: number | null
          final_task_type?: string | null
          id?: string
          input_tokens?: number | null
          message_id?: string | null
          module_id?: string | null
          output_tokens?: number | null
          response_time_ms?: number | null
          session_id?: string | null
          task_category?: string | null
          task_complexity?: string | null
          task_type?: string | null
          total_tokens?: number | null
          user_id?: string | null
          user_rating?: number | null
          was_successful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "module_usage_analytics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_usage_analytics_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "dynamic_module_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_usage_analytics_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "dynamic_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_usage_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dynamic_module_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      module_usage_limits: {
        Row: {
          allowed_models: string[] | null
          created_at: string | null
          daily_cost_limit: number | null
          daily_requests_limit: number | null
          daily_tokens_limit: number | null
          id: string
          is_active: boolean | null
          limit_type: string
          module_id: string | null
          monthly_cost_limit: number | null
          monthly_requests_limit: number | null
          monthly_tokens_limit: number | null
          target_id: string | null
          updated_at: string | null
        }
        Insert: {
          allowed_models?: string[] | null
          created_at?: string | null
          daily_cost_limit?: number | null
          daily_requests_limit?: number | null
          daily_tokens_limit?: number | null
          id?: string
          is_active?: boolean | null
          limit_type: string
          module_id?: string | null
          monthly_cost_limit?: number | null
          monthly_requests_limit?: number | null
          monthly_tokens_limit?: number | null
          target_id?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed_models?: string[] | null
          created_at?: string | null
          daily_cost_limit?: number | null
          daily_requests_limit?: number | null
          daily_tokens_limit?: number | null
          id?: string
          is_active?: boolean | null
          limit_type?: string
          module_id?: string | null
          monthly_cost_limit?: number | null
          monthly_requests_limit?: number | null
          monthly_tokens_limit?: number | null
          target_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_usage_limits_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "dynamic_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_preferences: {
        Row: {
          created_at: string
          id: string
          notify_on_down: boolean
          notify_on_recovery: boolean
          service_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify_on_down?: boolean
          notify_on_recovery?: boolean
          service_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notify_on_down?: boolean
          notify_on_recovery?: boolean
          service_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_history: {
        Row: {
          client_id: string | null
          created_at: string
          error_message: string | null
          id: string
          message: string | null
          metadata: Json | null
          notification_type: string
          recipient: string
          sent_at: string | null
          status: string
          subject: string | null
          task_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          notification_type: string
          recipient: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          task_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          notification_type?: string
          recipient?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_notification_history_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_dialogue_parts: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          key_points: Json | null
          model_used: string | null
          part_number: number
          prompt: string
          response: string | null
          session_id: string
          status: string
          title: string
          tokens_used: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          key_points?: Json | null
          model_used?: string | null
          part_number: number
          prompt: string
          response?: string | null
          session_id: string
          status?: string
          title: string
          tokens_used?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          key_points?: Json | null
          model_used?: string | null
          part_number?: number
          prompt?: string
          response?: string | null
          session_id?: string
          status?: string
          title?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "planning_dialogue_parts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "planning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_exports: {
        Row: {
          created_at: string
          error_message: string | null
          export_type: string
          id: string
          recipient_email: string | null
          sent_at: string | null
          session_id: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          export_type: string
          id?: string
          recipient_email?: string | null
          sent_at?: string | null
          session_id: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          export_type?: string
          id?: string
          recipient_email?: string | null
          sent_at?: string | null
          session_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_exports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "planning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          session_type: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          session_type?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          session_type?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planning_templates: {
        Row: {
          background_context: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parts: Json
          sort_order: number | null
          system_prompt: string | null
          template_type: string
          updated_at: string
        }
        Insert: {
          background_context?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parts?: Json
          sort_order?: number | null
          system_prompt?: string | null
          template_type: string
          updated_at?: string
        }
        Update: {
          background_context?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parts?: Json
          sort_order?: number | null
          system_prompt?: string | null
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      points_history: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          points: number
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          points: number
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      price_tracking: {
        Row: {
          client_id: string | null
          competitor_name: string | null
          competitor_price: number | null
          competitor_url: string | null
          created_at: string
          id: string
          our_price: number | null
          price_difference: number | null
          product_id: string
          product_name: string | null
          tracked_at: string
        }
        Insert: {
          client_id?: string | null
          competitor_name?: string | null
          competitor_price?: number | null
          competitor_url?: string | null
          created_at?: string
          id?: string
          our_price?: number | null
          price_difference?: number | null
          product_id: string
          product_name?: string | null
          tracked_at?: string
        }
        Update: {
          client_id?: string | null
          competitor_name?: string | null
          competitor_price?: number | null
          competitor_url?: string | null
          created_at?: string
          id?: string
          our_price?: number | null
          price_difference?: number | null
          product_id?: string
          product_name?: string | null
          tracked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_tracking_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      priority_allocation: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          innovation_percent: number
          is_active: boolean | null
          period: string | null
          scope_id: string | null
          scope_type: string
          stability_percent: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          innovation_percent?: number
          is_active?: boolean | null
          period?: string | null
          scope_id?: string | null
          scope_type: string
          stability_percent?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          innovation_percent?: number
          is_active?: boolean | null
          period?: string | null
          scope_id?: string | null
          scope_type?: string
          stability_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_feeds: {
        Row: {
          client_id: string | null
          created_at: string
          error_count: number | null
          feed_name: string
          feed_type: string | null
          feed_url: string | null
          id: string
          last_sync_at: string | null
          platform: string
          product_count: number | null
          settings: Json | null
          status: string | null
          sync_frequency: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          error_count?: number | null
          feed_name: string
          feed_type?: string | null
          feed_url?: string | null
          id?: string
          last_sync_at?: string | null
          platform: string
          product_count?: number | null
          settings?: Json | null
          status?: string | null
          sync_frequency?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          error_count?: number | null
          feed_name?: string
          feed_type?: string | null
          feed_url?: string | null
          id?: string
          last_sync_at?: string | null
          platform?: string
          product_count?: number | null
          settings?: Json | null
          status?: string | null
          sync_frequency?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_feeds_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget_credits: number | null
          budget_hours: number | null
          client_id: string | null
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          priority_category: string | null
          priority_override_percent: number | null
          start_date: string | null
          status: string
          target_date: string | null
          updated_at: string
        }
        Insert: {
          budget_credits?: number | null
          budget_hours?: number | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          priority_category?: string | null
          priority_override_percent?: number | null
          start_date?: string | null
          status?: string
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          budget_credits?: number | null
          budget_hours?: number | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          priority_category?: string | null
          priority_override_percent?: number | null
          start_date?: string | null
          status?: string
          target_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          description: string | null
          discount_percent: number | null
          id: string
          is_optional: boolean | null
          is_selected: boolean | null
          name: string
          quantity: number
          quote_id: string
          service_id: string | null
          sort_order: number | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_optional?: boolean | null
          is_selected?: boolean | null
          name: string
          quantity?: number
          quote_id: string
          service_id?: string | null
          sort_order?: number | null
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_optional?: boolean | null
          is_selected?: boolean | null
          name?: string
          quantity?: number
          quote_id?: string
          service_id?: string | null
          sort_order?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "client_services"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          client_id: string | null
          created_at: string
          created_by: string | null
          discount_amount: number | null
          discount_percent: number | null
          icount_doc_id: string | null
          icount_synced_at: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          notes: string | null
          public_token: string | null
          quote_number: string
          rejected_at: string | null
          rejection_reason: string | null
          signature_url: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          terms: string | null
          title: string
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          icount_doc_id?: string | null
          icount_synced_at?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          notes?: string | null
          public_token?: string | null
          quote_number: string
          rejected_at?: string | null
          rejection_reason?: string | null
          signature_url?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          title: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          icount_doc_id?: string | null
          icount_synced_at?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          notes?: string | null
          public_token?: string | null
          quote_number?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          signature_url?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          title?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      report_history: {
        Row: {
          client_id: string
          created_at: string | null
          file_format: string | null
          file_url: string | null
          generated_by: string | null
          id: string
          period_end: string
          period_start: string
          report_data: Json
          report_type: string
          scheduled_report_id: string | null
          sent_to: Json | null
          template_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          file_format?: string | null
          file_url?: string | null
          generated_by?: string | null
          id?: string
          period_end: string
          period_start: string
          report_data: Json
          report_type: string
          scheduled_report_id?: string | null
          sent_to?: Json | null
          template_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          file_format?: string | null
          file_url?: string | null
          generated_by?: string | null
          id?: string
          period_end?: string
          period_start?: string
          report_data?: Json
          report_type?: string
          scheduled_report_id?: string | null
          sent_to?: Json | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_history_scheduled_report_id_fkey"
            columns: ["scheduled_report_id"]
            isOneToOne: false
            referencedRelation: "scheduled_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_history_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          is_global: boolean | null
          name: string
          sections: Json
          styling: Json | null
          template_type: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_global?: boolean | null
          name: string
          sections?: Json
          styling?: Json | null
          template_type?: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_global?: boolean | null
          name?: string
          sections?: Json
          styling?: Json | null
          template_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_templates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      role_simulation_log: {
        Row: {
          action: string
          actual_role: string
          created_at: string | null
          id: string
          reason: string | null
          simulated_client_id: string | null
          simulated_contact_id: string | null
          simulated_role: string
          user_id: string
        }
        Insert: {
          action: string
          actual_role: string
          created_at?: string | null
          id?: string
          reason?: string | null
          simulated_client_id?: string | null
          simulated_contact_id?: string | null
          simulated_role: string
          user_id: string
        }
        Update: {
          action?: string
          actual_role?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          simulated_client_id?: string | null
          simulated_contact_id?: string | null
          simulated_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_simulation_log_simulated_client_id_fkey"
            columns: ["simulated_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_simulation_log_simulated_contact_id_fkey"
            columns: ["simulated_contact_id"]
            isOneToOne: false
            referencedRelation: "client_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string | null
          day_of_month: number | null
          day_of_week: number | null
          frequency: string
          id: string
          is_active: boolean | null
          last_sent_at: string | null
          name: string
          next_run_at: string | null
          recipients: Json | null
          template_id: string | null
          time_of_day: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          name: string
          next_run_at?: string | null
          recipients?: Json | null
          template_id?: string | null
          time_of_day?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          day_of_month?: number | null
          day_of_week?: number | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          name?: string
          next_run_at?: string | null
          recipients?: Json | null
          template_id?: string | null
          time_of_day?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          action: string | null
          created_at: string
          details: Json | null
          event_category: string
          event_type: string
          id: string
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          details?: Json | null
          event_category: string
          event_type: string
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          details?: Json | null
          event_category?: string
          event_type?: string
          id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_health_history: {
        Row: {
          alert_sent: boolean | null
          checked_at: string
          created_at: string
          id: string
          latency_ms: number | null
          message: string | null
          service_name: string
          status: string
        }
        Insert: {
          alert_sent?: boolean | null
          checked_at?: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          message?: string | null
          service_name: string
          status: string
        }
        Update: {
          alert_sent?: boolean | null
          checked_at?: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          message?: string | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      sidebar_dynamic_items: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_visible: boolean | null
          label: string
          module_id: string | null
          parent_category: string
          path: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_visible?: boolean | null
          label: string
          module_id?: string | null
          parent_category: string
          path: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_visible?: boolean | null
          label?: string
          module_id?: string | null
          parent_category?: string
          path?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sidebar_dynamic_items_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "dynamic_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string | null
          account_id: string
          account_name: string | null
          account_url: string | null
          client_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          metadata: Json | null
          platform: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          account_id: string
          account_name?: string | null
          account_url?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          platform: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          account_id?: string
          account_name?: string | null
          account_url?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          metadata?: Json | null
          platform?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          account_id: string | null
          approved_at: string | null
          approved_by: string | null
          client_id: string
          content: string
          created_at: string | null
          created_by: string | null
          engagement: Json | null
          error_message: string | null
          external_post_id: string | null
          hashtags: string[] | null
          id: string
          media_urls: Json | null
          platforms: string[] | null
          published_at: string | null
          scheduled_for: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          client_id: string
          content: string
          created_at?: string | null
          created_by?: string | null
          engagement?: Json | null
          error_message?: string | null
          external_post_id?: string | null
          hashtags?: string[] | null
          id?: string
          media_urls?: Json | null
          platforms?: string[] | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          engagement?: Json | null
          error_message?: string | null
          external_post_id?: string | null
          hashtags?: string[] | null
          id?: string
          media_urls?: Json | null
          platforms?: string[] | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_schedules: {
        Row: {
          client_id: string
          created_at: string
          frequency: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          next_sync_at: string | null
          platform: string | null
          sync_frequency: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          next_sync_at?: string | null
          platform?: string | null
          sync_frequency?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          next_sync_at?: string | null
          platform?: string | null
          sync_frequency?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sync_schedules_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_schedules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          attachment_type: string
          created_at: string
          created_by: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          task_id: string
          url: string
        }
        Insert: {
          attachment_type: string
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          task_id: string
          url: string
        }
        Update: {
          attachment_type?: string
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          task_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          task_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          task_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          task_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          client_id: string
          converted_task_id: string | null
          created_at: string | null
          description: string | null
          estimated_credits: number | null
          id: string
          project_id: string | null
          rejection_reason: string | null
          requested_by: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          client_id: string
          converted_task_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_credits?: number | null
          id?: string
          project_id?: string | null
          rejection_reason?: string | null
          requested_by?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string
          converted_task_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_credits?: number | null
          id?: string
          project_id?: string | null
          rejection_reason?: string | null
          requested_by?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_task_requests_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_converted_task_id_fkey"
            columns: ["converted_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      task_shares: {
        Row: {
          client_id: string
          email_sent: boolean | null
          email_sent_at: string | null
          expires_at: string | null
          id: string
          message: string | null
          share_type: string
          shared_at: string
          shared_by: string | null
          task_id: string
        }
        Insert: {
          client_id: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          share_type?: string
          shared_at?: string
          shared_by?: string | null
          task_id: string
        }
        Update: {
          client_id?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          share_type?: string
          shared_at?: string
          shared_by?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_task_shares_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_shares_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_shares_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_subtasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          parent_task_id: string
          sort_order: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id: string
          sort_order?: number | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_subtasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_subtasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_type_definitions: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          type_key: string
          type_label_en: string
          type_label_he: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          type_key: string
          type_label_en: string
          type_label_he: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          type_key?: string
          type_label_en?: string
          type_label_he?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee: string | null
          campaign_id: string | null
          category: string | null
          client_id: string | null
          created_at: string
          credit_weight: number | null
          credits_cost: number | null
          department: string | null
          description: string | null
          due_date: string | null
          duration_minutes: number
          id: string
          notification_email: boolean | null
          notification_email_address: string | null
          notification_phone: string | null
          notification_sms: boolean | null
          priority: string
          priority_category: string | null
          project_id: string | null
          recurrence_end_date: string | null
          recurrence_type: string | null
          reminder_at: string | null
          reminder_sent: boolean | null
          scheduled_time: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          campaign_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          credit_weight?: number | null
          credits_cost?: number | null
          department?: string | null
          description?: string | null
          due_date?: string | null
          duration_minutes?: number
          id?: string
          notification_email?: boolean | null
          notification_email_address?: string | null
          notification_phone?: string | null
          notification_sms?: boolean | null
          priority?: string
          priority_category?: string | null
          project_id?: string | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          reminder_at?: string | null
          reminder_sent?: boolean | null
          scheduled_time?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          campaign_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          credit_weight?: number | null
          credits_cost?: number | null
          department?: string | null
          description?: string | null
          due_date?: string | null
          duration_minutes?: number
          id?: string
          notification_email?: boolean | null
          notification_email_address?: string | null
          notification_phone?: string | null
          notification_sms?: boolean | null
          priority?: string
          priority_category?: string | null
          project_id?: string | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          reminder_at?: string | null
          reminder_sent?: boolean | null
          scheduled_time?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team: {
        Row: {
          avatar_color: string | null
          avatar_url: string | null
          created_at: string
          departments: string[]
          email: string | null
          emails: string[] | null
          id: string
          is_active: boolean | null
          name: string
          phones: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_color?: string | null
          avatar_url?: string | null
          created_at?: string
          departments?: string[]
          email?: string | null
          emails?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          phones?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_color?: string | null
          avatar_url?: string | null
          created_at?: string
          departments?: string[]
          email?: string | null
          emails?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          phones?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trusted_devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          email: string
          id: string
          last_used_at: string
          trusted_until: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          email: string
          id?: string
          last_used_at?: string
          trusted_until: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          email?: string
          id?: string
          last_used_at?: string
          trusted_until?: string
        }
        Relationships: []
      }
      two_factor_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          notified: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          notified?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          notified?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          current_value: number
          id: string
          is_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          is_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          is_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_impersonation_log: {
        Row: {
          actions_performed: Json | null
          admin_user_id: string
          ended_at: string | null
          id: string
          reason: string | null
          started_at: string
          target_user_id: string
        }
        Insert: {
          actions_performed?: Json | null
          admin_user_id: string
          ended_at?: string | null
          id?: string
          reason?: string | null
          started_at?: string
          target_user_id: string
        }
        Update: {
          actions_performed?: Json | null
          admin_user_id?: string
          ended_at?: string | null
          id?: string
          reason?: string | null
          started_at?: string
          target_user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          all_time_points: number
          created_at: string
          current_level: number
          id: string
          level_progress: number
          monthly_points: number
          total_points: number
          updated_at: string
          user_id: string
          weekly_points: number
        }
        Insert: {
          all_time_points?: number
          created_at?: string
          current_level?: number
          id?: string
          level_progress?: number
          monthly_points?: number
          total_points?: number
          updated_at?: string
          user_id: string
          weekly_points?: number
        }
        Update: {
          all_time_points?: number
          created_at?: string
          current_level?: number
          id?: string
          level_progress?: number
          monthly_points?: number
          total_points?: number
          updated_at?: string
          user_id?: string
          weekly_points?: number
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          default_view: string | null
          email_daily_summary: boolean | null
          email_task_assigned: boolean | null
          email_task_completed: boolean | null
          email_task_due_reminder: boolean | null
          email_weekly_report: boolean | null
          id: string
          push_enabled: boolean | null
          push_mentions: boolean | null
          push_task_updates: boolean | null
          reminder_hours_before: number | null
          reminder_time: string | null
          sidebar_collapsed: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_view?: string | null
          email_daily_summary?: boolean | null
          email_task_assigned?: boolean | null
          email_task_completed?: boolean | null
          email_task_due_reminder?: boolean | null
          email_weekly_report?: boolean | null
          id?: string
          push_enabled?: boolean | null
          push_mentions?: boolean | null
          push_task_updates?: boolean | null
          reminder_hours_before?: number | null
          reminder_time?: string | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_view?: string | null
          email_daily_summary?: boolean | null
          email_task_assigned?: boolean | null
          email_task_completed?: boolean | null
          email_task_due_reminder?: boolean | null
          email_weekly_report?: boolean | null
          id?: string
          push_enabled?: boolean | null
          push_mentions?: boolean | null
          push_task_updates?: boolean | null
          reminder_hours_before?: number | null
          reminder_time?: string | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          points_reward: number
          target_value: number
          title: string
          week_end: string
          week_start: string
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          points_reward?: number
          target_value: number
          title: string
          week_end: string
          week_start: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          points_reward?: number
          target_value?: number
          title?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      widget_configurations: {
        Row: {
          agent_id: string
          client_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          suggested_prompts: string[] | null
          theme: Json | null
          token_id: string
          updated_at: string | null
          welcome_message: string | null
        }
        Insert: {
          agent_id: string
          client_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          suggested_prompts?: string[] | null
          theme?: Json | null
          token_id: string
          updated_at?: string | null
          welcome_message?: string | null
        }
        Update: {
          agent_id?: string
          client_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          suggested_prompts?: string[] | null
          theme?: Json | null
          token_id?: string
          updated_at?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_widget_configurations_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widget_configurations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widget_configurations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widget_configurations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "client_agent_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_conversations: {
        Row: {
          ended_at: string | null
          id: string
          is_active: boolean | null
          messages: Json[] | null
          session_id: string
          started_at: string | null
          visitor_info: Json | null
          widget_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          messages?: Json[] | null
          session_id: string
          started_at?: string | null
          visitor_info?: Json | null
          widget_id: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          messages?: Json[] | null
          session_id?: string
          started_at?: string | null
          visitor_info?: Json | null
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_conversations_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widget_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      integrations_safe: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string | null
          is_connected: boolean | null
          last_sync_at: string | null
          platform: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string | null
          is_connected?: boolean | null
          last_sync_at?: string | null
          platform?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string | null
          is_connected?: boolean | null
          last_sync_at?: string | null
          platform?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_integrations_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      agent_has_capability: {
        Args: {
          _agent_id: string
          _capability_name: string
          _client_id?: string
          _domain?: string
        }
        Returns: boolean
      }
      cleanup_expired_2fa_codes: { Args: never; Returns: undefined }
      cleanup_expired_trusted_devices: { Args: never; Returns: undefined }
      decrypt_integration_credentials: {
        Args: { encrypted_data: string }
        Returns: Json
      }
      encrypt_integration_credentials: {
        Args: { credentials: Json }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_client_access: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_level: {
        Args: {
          _min_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_event_category: string
          p_event_type: string
          p_resource_id: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      ai_capability_category:
        | "system"
        | "integrations"
        | "content"
        | "analytics"
        | "tasks"
        | "campaigns"
        | "ecommerce"
      app_role:
        | "super_admin"
        | "admin"
        | "agency_manager"
        | "team_manager"
        | "employee"
        | "premium_client"
        | "basic_client"
        | "manager"
        | "department_head"
        | "team_lead"
        | "team_member"
        | "client"
        | "demo"
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
    Enums: {
      ai_capability_category: [
        "system",
        "integrations",
        "content",
        "analytics",
        "tasks",
        "campaigns",
        "ecommerce",
      ],
      app_role: [
        "super_admin",
        "admin",
        "agency_manager",
        "team_manager",
        "employee",
        "premium_client",
        "basic_client",
        "manager",
        "department_head",
        "team_lead",
        "team_member",
        "client",
        "demo",
      ],
    },
  },
} as const
