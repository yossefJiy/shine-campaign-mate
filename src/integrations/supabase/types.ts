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
      agency_settings: {
        Row: {
          client_delay_threshold_days: number
          created_at: string
          id: string
          payment_overdue_grace_days: number
          project_stalled_threshold_days: number
          timezone: string
          updated_at: string
          work_days: number[]
          work_hours_end: string
          work_hours_start: string
        }
        Insert: {
          client_delay_threshold_days?: number
          created_at?: string
          id?: string
          payment_overdue_grace_days?: number
          project_stalled_threshold_days?: number
          timezone?: string
          updated_at?: string
          work_days?: number[]
          work_hours_end?: string
          work_hours_start?: string
        }
        Update: {
          client_delay_threshold_days?: number
          created_at?: string
          id?: string
          payment_overdue_grace_days?: number
          project_stalled_threshold_days?: number
          timezone?: string
          updated_at?: string
          work_days?: number[]
          work_hours_end?: string
          work_hours_start?: string
        }
        Relationships: []
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
      billing_goals: {
        Row: {
          client_id: string | null
          commission_target: number | null
          created_at: string | null
          id: string
          month: number | null
          notes: string | null
          revenue_target: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          client_id?: string | null
          commission_target?: number | null
          created_at?: string | null
          id?: string
          month?: number | null
          notes?: string | null
          revenue_target?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          client_id?: string | null
          commission_target?: number | null
          created_at?: string | null
          id?: string
          month?: number | null
          notes?: string | null
          revenue_target?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_goals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_records: {
        Row: {
          additional_amount: number | null
          agreement_id: string | null
          amount_billed: number | null
          amount_paid: number | null
          base_amount: number | null
          client_id: string
          commission_amount: number | null
          created_at: string | null
          due_date: string | null
          icount_doc_id: string | null
          icount_doc_type: string | null
          icount_doc_url: string | null
          id: string
          invoice_id: string | null
          month: number | null
          notes: string | null
          paid_at: string | null
          payment_type: string | null
          period_end: string
          period_start: string
          project_id: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          additional_amount?: number | null
          agreement_id?: string | null
          amount_billed?: number | null
          amount_paid?: number | null
          base_amount?: number | null
          client_id: string
          commission_amount?: number | null
          created_at?: string | null
          due_date?: string | null
          icount_doc_id?: string | null
          icount_doc_type?: string | null
          icount_doc_url?: string | null
          id?: string
          invoice_id?: string | null
          month?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_type?: string | null
          period_end: string
          period_start: string
          project_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          year?: number
        }
        Update: {
          additional_amount?: number | null
          agreement_id?: string | null
          amount_billed?: number | null
          amount_paid?: number | null
          base_amount?: number | null
          client_id?: string
          commission_amount?: number | null
          created_at?: string | null
          due_date?: string | null
          icount_doc_id?: string | null
          icount_doc_type?: string | null
          icount_doc_url?: string | null
          id?: string
          invoice_id?: string | null
          month?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_type?: string | null
          period_end?: string
          period_start?: string
          project_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_records_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "client_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_records_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_records_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      client_agreements: {
        Row: {
          base_price: number
          billing_cycle: string | null
          category: string | null
          client_id: string
          commission_base: string | null
          commission_percent: number | null
          created_at: string | null
          currency: string | null
          end_date: string | null
          id: string
          notes: string | null
          service_description: string | null
          service_name: string
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number
          billing_cycle?: string | null
          category?: string | null
          client_id: string
          commission_base?: string | null
          commission_percent?: number | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          service_description?: string | null
          service_name: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          billing_cycle?: string | null
          category?: string | null
          client_id?: string
          commission_base?: string | null
          commission_percent?: number | null
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          service_description?: string | null
          service_name?: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_agreements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          can_approve: boolean | null
          client_id: string
          created_at: string | null
          email: string | null
          has_portal_access: boolean | null
          id: string
          is_primary: boolean | null
          name: string
          notification_policy: string | null
          notify: boolean | null
          phone: string | null
          preferred_timezone: string | null
          receive_task_updates: boolean | null
          role: string | null
          updated_at: string | null
          work_hours_end: string | null
          work_hours_start: string | null
        }
        Insert: {
          can_approve?: boolean | null
          client_id: string
          created_at?: string | null
          email?: string | null
          has_portal_access?: boolean | null
          id?: string
          is_primary?: boolean | null
          name: string
          notification_policy?: string | null
          notify?: boolean | null
          phone?: string | null
          preferred_timezone?: string | null
          receive_task_updates?: boolean | null
          role?: string | null
          updated_at?: string | null
          work_hours_end?: string | null
          work_hours_start?: string | null
        }
        Update: {
          can_approve?: boolean | null
          client_id?: string
          created_at?: string | null
          email?: string | null
          has_portal_access?: boolean | null
          id?: string
          is_primary?: boolean | null
          name?: string
          notification_policy?: string | null
          notify?: boolean | null
          phone?: string | null
          preferred_timezone?: string | null
          receive_task_updates?: boolean | null
          role?: string | null
          updated_at?: string | null
          work_hours_end?: string | null
          work_hours_start?: string | null
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
      client_onboarding: {
        Row: {
          assets_connected: Json | null
          business_info: Json | null
          client_id: string | null
          completed_at: string | null
          completed_steps: Json | null
          created_at: string | null
          current_step: number | null
          id: string
          materials_uploaded: boolean | null
          status: string | null
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          updated_at: string | null
        }
        Insert: {
          assets_connected?: Json | null
          business_info?: Json | null
          client_id?: string | null
          completed_at?: string | null
          completed_steps?: Json | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          materials_uploaded?: boolean | null
          status?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          assets_connected?: Json | null
          business_info?: Json | null
          client_id?: string | null
          completed_at?: string | null
          completed_steps?: Json | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          materials_uploaded?: boolean | null
          status?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_onboarding_client_id_fkey"
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
      commission_collections: {
        Row: {
          ad_spend: number | null
          client_id: string
          collected_amount: number | null
          collected_at: string | null
          commission_percent: number | null
          created_at: string | null
          expected_amount: number | null
          icount_doc_id: string | null
          icount_doc_url: string | null
          id: string
          month: number
          notes: string | null
          status: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          ad_spend?: number | null
          client_id: string
          collected_amount?: number | null
          collected_at?: string | null
          commission_percent?: number | null
          created_at?: string | null
          expected_amount?: number | null
          icount_doc_id?: string | null
          icount_doc_url?: string | null
          id?: string
          month: number
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          ad_spend?: number | null
          client_id?: string
          collected_amount?: number | null
          collected_at?: string | null
          commission_percent?: number | null
          created_at?: string | null
          expected_amount?: number | null
          icount_doc_id?: string | null
          icount_doc_url?: string | null
          id?: string
          month?: number
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_collections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_update_requests: {
        Row: {
          ad_spend_reported: number | null
          client_id: string
          created_at: string | null
          id: string
          month: number
          requested_at: string | null
          responded_at: string | null
          status: string | null
          year: number
        }
        Insert: {
          ad_spend_reported?: number | null
          client_id: string
          created_at?: string | null
          id?: string
          month: number
          requested_at?: string | null
          responded_at?: string | null
          status?: string | null
          year: number
        }
        Update: {
          ad_spend_reported?: number | null
          client_id?: string
          created_at?: string | null
          id?: string
          month?: number
          requested_at?: string | null
          responded_at?: string | null
          status?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_update_requests_client_id_fkey"
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
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          manager_user_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          manager_user_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          manager_user_id?: string | null
          name?: string
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
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      org_teams: {
        Row: {
          created_at: string | null
          department_id: string | null
          id: string
          manager_team_member_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          manager_team_member_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          id?: string
          manager_team_member_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_teams_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_teams_manager_team_member_id_fkey"
            columns: ["manager_team_member_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_fees: {
        Row: {
          calculated_fee: number | null
          client_id: string | null
          created_at: string | null
          id: string
          invoiced_at: string | null
          month: number
          notes: string | null
          paid_at: string | null
          percentage: number | null
          project_id: string | null
          reported_at: string | null
          revenue_reported: number | null
          status: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          calculated_fee?: number | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          invoiced_at?: string | null
          month: number
          notes?: string | null
          paid_at?: string | null
          percentage?: number | null
          project_id?: string | null
          reported_at?: string | null
          revenue_reported?: number | null
          status?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          calculated_fee?: number | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          invoiced_at?: string | null
          month?: number
          notes?: string | null
          paid_at?: string | null
          percentage?: number | null
          project_id?: string | null
          reported_at?: string | null
          revenue_reported?: number | null
          status?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_fees_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_fees_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
          notification_policy: string | null
          phone: string | null
          preferred_timezone: string | null
          timezone: string | null
          updated_at: string
          work_hours_end: string | null
          work_hours_start: string | null
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
          notification_policy?: string | null
          phone?: string | null
          preferred_timezone?: string | null
          timezone?: string | null
          updated_at?: string
          work_hours_end?: string | null
          work_hours_start?: string | null
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
          notification_policy?: string | null
          phone?: string | null
          preferred_timezone?: string | null
          timezone?: string | null
          updated_at?: string
          work_hours_end?: string | null
          work_hours_start?: string | null
        }
        Relationships: []
      }
      project_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          project_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          project_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          project_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          actual_hours: number | null
          approved_at: string | null
          approved_by: string | null
          approved_by_client: boolean | null
          client_approved_at: string | null
          client_notes: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          estimated_cost: number | null
          estimated_hours: number | null
          id: string
          name: string
          project_id: string
          requires_client_approval: boolean | null
          sort_order: number
          start_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          approved_at?: string | null
          approved_by?: string | null
          approved_by_client?: boolean | null
          client_approved_at?: string | null
          client_notes?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          name: string
          project_id: string
          requires_client_approval?: boolean | null
          sort_order?: number
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          approved_at?: string | null
          approved_by?: string | null
          approved_by_client?: boolean | null
          client_approved_at?: string | null
          client_notes?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          name?: string
          project_id?: string
          requires_client_approval?: boolean | null
          sort_order?: number
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          role: string | null
          team_member_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          role?: string | null
          team_member_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          role?: string | null
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_team_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          stages: Json
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          stages?: Json
          template_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          stages?: Json
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          at_risk: boolean | null
          billing_mode: string | null
          budget_credits: number | null
          budget_hours: number | null
          client_id: string | null
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          last_activity_at: string | null
          monthly_retainer_amount: number | null
          name: string
          payment_status: string | null
          priority_category: string | null
          priority_override_percent: number | null
          proposal_id: string | null
          retainer_plan: string | null
          source: string | null
          start_date: string | null
          status: string
          target_date: string | null
          updated_at: string
          work_state: string | null
        }
        Insert: {
          at_risk?: boolean | null
          billing_mode?: string | null
          budget_credits?: number | null
          budget_hours?: number | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          last_activity_at?: string | null
          monthly_retainer_amount?: number | null
          name: string
          payment_status?: string | null
          priority_category?: string | null
          priority_override_percent?: number | null
          proposal_id?: string | null
          retainer_plan?: string | null
          source?: string | null
          start_date?: string | null
          status?: string
          target_date?: string | null
          updated_at?: string
          work_state?: string | null
        }
        Update: {
          at_risk?: boolean | null
          billing_mode?: string | null
          budget_credits?: number | null
          budget_hours?: number | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          last_activity_at?: string | null
          monthly_retainer_amount?: number | null
          name?: string
          payment_status?: string | null
          priority_category?: string | null
          priority_override_percent?: number | null
          proposal_id?: string | null
          retainer_plan?: string | null
          source?: string | null
          start_date?: string | null
          status?: string
          target_date?: string | null
          updated_at?: string
          work_state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          stages_json: Json
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          stages_json?: Json
          template_type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          stages_json?: Json
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string
          creates_stage: boolean | null
          description: string | null
          discount_percent: number | null
          id: string
          is_optional: boolean | null
          is_selected: boolean | null
          name: string
          preset_tasks: Json | null
          quantity: number
          quote_id: string
          service_id: string | null
          sort_order: number | null
          stage_name: string | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          creates_stage?: boolean | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_optional?: boolean | null
          is_selected?: boolean | null
          name: string
          preset_tasks?: Json | null
          quantity?: number
          quote_id: string
          service_id?: string | null
          sort_order?: number | null
          stage_name?: string | null
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          creates_stage?: boolean | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_optional?: boolean | null
          is_selected?: boolean | null
          name?: string
          preset_tasks?: Json | null
          quantity?: number
          quote_id?: string
          service_id?: string | null
          sort_order?: number | null
          stage_name?: string | null
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
          approved_at: string | null
          approved_by: string | null
          cancelled_reason: string | null
          client_confirmed: boolean | null
          client_confirmed_terms: boolean | null
          client_id: string | null
          client_view_token: string | null
          confirmation_text: string | null
          created_at: string
          created_by: string | null
          created_project_id: string | null
          discount_amount: number | null
          discount_percent: number | null
          icount_doc_id: string | null
          icount_synced_at: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          notes: string | null
          parent_quote_id: string | null
          proposal_status: string | null
          public_token: string | null
          quote_number: string
          rejected_at: string | null
          rejection_reason: string | null
          sent_at: string | null
          signature_url: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          template_id: string | null
          terms: string | null
          title: string
          total_amount: number
          updated_at: string
          valid_until: string | null
          version: number | null
        }
        Insert: {
          accepted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cancelled_reason?: string | null
          client_confirmed?: boolean | null
          client_confirmed_terms?: boolean | null
          client_id?: string | null
          client_view_token?: string | null
          confirmation_text?: string | null
          created_at?: string
          created_by?: string | null
          created_project_id?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          icount_doc_id?: string | null
          icount_synced_at?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          notes?: string | null
          parent_quote_id?: string | null
          proposal_status?: string | null
          public_token?: string | null
          quote_number: string
          rejected_at?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          signature_url?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          template_id?: string | null
          terms?: string | null
          title: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
          version?: number | null
        }
        Update: {
          accepted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cancelled_reason?: string | null
          client_confirmed?: boolean | null
          client_confirmed_terms?: boolean | null
          client_id?: string | null
          client_view_token?: string | null
          confirmation_text?: string | null
          created_at?: string
          created_by?: string | null
          created_project_id?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          icount_doc_id?: string | null
          icount_synced_at?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          notes?: string | null
          parent_quote_id?: string | null
          proposal_status?: string | null
          public_token?: string | null
          quote_number?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          signature_url?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          template_id?: string | null
          terms?: string | null
          title?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
          version?: number | null
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
            foreignKeyName: "quotes_created_project_id_fkey"
            columns: ["created_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_parent_quote_id_fkey"
            columns: ["parent_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "proposal_templates"
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
      services: {
        Row: {
          base_price: number
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          pricing_type: string
          sort_order: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          pricing_type?: string
          sort_order?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          pricing_type?: string
          sort_order?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      smart_alerts: {
        Row: {
          alert_day: string | null
          alert_type: string
          created_at: string | null
          deliver_by: string | null
          delivered_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          message: string | null
          priority: string | null
          recipient_id: string | null
          recipient_type: string | null
          severity: string | null
          title: string
          to_user_id: string
        }
        Insert: {
          alert_day?: string | null
          alert_type: string
          created_at?: string | null
          deliver_by?: string | null
          delivered_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          priority?: string | null
          recipient_id?: string | null
          recipient_type?: string | null
          severity?: string | null
          title: string
          to_user_id: string
        }
        Update: {
          alert_day?: string | null
          alert_type?: string
          created_at?: string | null
          deliver_by?: string | null
          delivered_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          priority?: string | null
          recipient_id?: string | null
          recipient_type?: string | null
          severity?: string | null
          title?: string
          to_user_id?: string
        }
        Relationships: []
      }
      stage_approvals: {
        Row: {
          approved_by_contact: string | null
          approved_by_user: string | null
          created_at: string | null
          decision: string
          id: string
          notes: string | null
          stage_id: string
        }
        Insert: {
          approved_by_contact?: string | null
          approved_by_user?: string | null
          created_at?: string | null
          decision: string
          id?: string
          notes?: string | null
          stage_id: string
        }
        Update: {
          approved_by_contact?: string | null
          approved_by_user?: string | null
          created_at?: string | null
          decision?: string
          id?: string
          notes?: string | null
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_approvals_approved_by_contact_fkey"
            columns: ["approved_by_contact"]
            isOneToOne: false
            referencedRelation: "client_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_approvals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_comments: {
        Row: {
          contact_id: string | null
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          stage_id: string
          user_id: string | null
        }
        Insert: {
          contact_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          stage_id: string
          user_id?: string | null
        }
        Update: {
          contact_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          stage_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stage_comments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_comments_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
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
          income_value: number | null
          is_blocking: boolean | null
          is_client_visible: boolean | null
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
          stage_id: string | null
          status: string
          task_tag: string | null
          title: string
          updated_at: string
          waiting_since: string | null
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
          income_value?: number | null
          is_blocking?: boolean | null
          is_client_visible?: boolean | null
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
          stage_id?: string | null
          status?: string
          task_tag?: string | null
          title: string
          updated_at?: string
          waiting_since?: string | null
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
          income_value?: number | null
          is_blocking?: boolean | null
          is_client_visible?: boolean | null
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
          stage_id?: string | null
          status?: string
          task_tag?: string | null
          title?: string
          updated_at?: string
          waiting_since?: string | null
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
          {
            foreignKeyName: "tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      team: {
        Row: {
          avatar_color: string | null
          avatar_url: string | null
          created_at: string
          department_id: string | null
          departments: string[]
          email: string | null
          emails: string[] | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          operational_role: string | null
          org_team_id: string | null
          phones: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_color?: string | null
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          departments?: string[]
          email?: string | null
          emails?: string[] | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          operational_role?: string | null
          org_team_id?: string | null
          phones?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_color?: string | null
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          departments?: string[]
          email?: string | null
          emails?: string[] | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          operational_role?: string | null
          org_team_id?: string | null
          phones?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_org_team_id_fkey"
            columns: ["org_team_id"]
            isOneToOne: false
            referencedRelation: "org_teams"
            referencedColumns: ["id"]
          },
        ]
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
      user_privileges: {
        Row: {
          can_create_teams: boolean | null
          can_invite_users: boolean | null
          can_manage_client_assignments: boolean | null
          can_manage_project_assignments: boolean | null
          can_override_hierarchy: boolean | null
          can_view_prices: boolean | null
          can_view_proposals: boolean | null
          created_at: string | null
          id: string
          is_admin: boolean | null
          is_super_admin: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_create_teams?: boolean | null
          can_invite_users?: boolean | null
          can_manage_client_assignments?: boolean | null
          can_manage_project_assignments?: boolean | null
          can_override_hierarchy?: boolean | null
          can_view_prices?: boolean | null
          can_view_proposals?: boolean | null
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_create_teams?: boolean | null
          can_invite_users?: boolean | null
          can_manage_client_assignments?: boolean | null
          can_manage_project_assignments?: boolean | null
          can_override_hierarchy?: boolean | null
          can_view_prices?: boolean | null
          can_view_proposals?: boolean | null
          created_at?: string | null
          id?: string
          is_admin?: boolean | null
          is_super_admin?: boolean | null
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
      calc_delivery_time: {
        Args: {
          p_recipient_id: string
          p_recipient_type: string
          p_severity?: string
        }
        Returns: string
      }
      cancel_approved_quote: {
        Args: { p_quote_id: string; p_reason: string }
        Returns: undefined
      }
      cleanup_expired_2fa_codes: { Args: never; Returns: undefined }
      cleanup_expired_trusted_devices: { Args: never; Returns: undefined }
      create_quote_version: { Args: { p_quote_id: string }; Returns: string }
      decrypt_integration_credentials: {
        Args: { encrypted_data: string }
        Returns: Json
      }
      encrypt_integration_credentials: {
        Args: { credentials: Json }
        Returns: string
      }
      generate_daily_alerts: { Args: never; Returns: Json }
      get_user_privileges: { Args: { _user_id: string }; Returns: Json }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_admin_privilege: { Args: { _user_id: string }; Returns: boolean }
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
      mark_overdue_payments: { Args: never; Returns: number }
      mark_projects_blocked_by_payment: { Args: never; Returns: number }
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
        | "department_manager"
        | "team_employee"
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
        "department_manager",
        "team_employee",
      ],
    },
  },
} as const
