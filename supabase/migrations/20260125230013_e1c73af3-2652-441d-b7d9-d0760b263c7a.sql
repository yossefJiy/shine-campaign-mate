
-- =====================================================
-- FULL CLEANUP: Remove all legacy modules not in core flow
-- =====================================================

-- 1) DROP Marketing/Social tables
DROP TABLE IF EXISTS competitor_metrics CASCADE;
DROP TABLE IF EXISTS competitor_tracking CASCADE;
DROP TABLE IF EXISTS content_calendar CASCADE;
DROP TABLE IF EXISTS content_templates CASCADE;
DROP TABLE IF EXISTS content_drafts CASCADE;
DROP TABLE IF EXISTS social_accounts CASCADE;
DROP TABLE IF EXISTS social_posts CASCADE;
DROP TABLE IF EXISTS hashtag_groups CASCADE;
DROP TABLE IF EXISTS media_library CASCADE;
DROP TABLE IF EXISTS ai_content_history CASCADE;

-- 2) DROP Dynamic Modules tables
DROP TABLE IF EXISTS dynamic_module_messages CASCADE;
DROP TABLE IF EXISTS dynamic_module_sessions CASCADE;
DROP TABLE IF EXISTS dynamic_module_templates CASCADE;
DROP TABLE IF EXISTS dynamic_modules CASCADE;
DROP TABLE IF EXISTS sidebar_dynamic_items CASCADE;
DROP TABLE IF EXISTS widget_configurations CASCADE;
DROP TABLE IF EXISTS widget_conversations CASCADE;
DROP TABLE IF EXISTS module_usage_analytics CASCADE;
DROP TABLE IF EXISTS module_usage_limits CASCADE;

-- 3) DROP E-commerce tables
DROP TABLE IF EXISTS product_feeds CASCADE;
DROP TABLE IF EXISTS price_tracking CASCADE;
DROP TABLE IF EXISTS marketing_data CASCADE;
DROP TABLE IF EXISTS customer_segments CASCADE;

-- 4) DROP Reports tables
DROP TABLE IF EXISTS report_templates CASCADE;
DROP TABLE IF EXISTS report_history CASCADE;
DROP TABLE IF EXISTS scheduled_reports CASCADE;

-- 5) DROP Gamification tables
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS user_points CASCADE;
DROP TABLE IF EXISTS points_history CASCADE;
DROP TABLE IF EXISTS daily_streaks CASCADE;
DROP TABLE IF EXISTS leaderboard_cache CASCADE;
DROP TABLE IF EXISTS weekly_challenges CASCADE;
DROP TABLE IF EXISTS user_challenge_progress CASCADE;

-- 6) DROP AI tables (keeping only ai_query_history for logs)
DROP TABLE IF EXISTS ai_capability_usage CASCADE;
DROP TABLE IF EXISTS ai_agent_permissions CASCADE;
DROP TABLE IF EXISTS ai_capability_definitions CASCADE;
DROP TABLE IF EXISTS ai_agent_actions CASCADE;
DROP TABLE IF EXISTS ai_agents CASCADE;
DROP TABLE IF EXISTS agency_agents CASCADE;
DROP TABLE IF EXISTS agent_memory CASCADE;
DROP TABLE IF EXISTS ai_module_settings CASCADE;
DROP TABLE IF EXISTS ai_team_permissions CASCADE;
DROP TABLE IF EXISTS ai_usage_alerts CASCADE;
DROP TABLE IF EXISTS ai_usage_limits CASCADE;

-- 7) DROP Legacy functions
DROP FUNCTION IF EXISTS handle_message_analytics() CASCADE;
DROP FUNCTION IF EXISTS handle_module_delete() CASCADE;
DROP FUNCTION IF EXISTS handle_module_update() CASCADE;
DROP FUNCTION IF EXISTS handle_new_module() CASCADE;
DROP FUNCTION IF EXISTS add_points_on_task_complete() CASCADE;
DROP FUNCTION IF EXISTS update_user_streak() CASCADE;
DROP FUNCTION IF EXISTS calculate_kpi_status() CASCADE;
DROP FUNCTION IF EXISTS log_kpi_history() CASCADE;
DROP FUNCTION IF EXISTS create_client_agent() CASCADE;
DROP FUNCTION IF EXISTS agent_has_capability(uuid, text, uuid, text) CASCADE;

-- 8) DROP more legacy tables
DROP TABLE IF EXISTS ab_tests CASCADE;
DROP TABLE IF EXISTS ad_placements CASCADE;
DROP TABLE IF EXISTS budget_rules CASCADE;
DROP TABLE IF EXISTS brand_health_scores CASCADE;
DROP TABLE IF EXISTS brand_kpis CASCADE;
DROP TABLE IF EXISTS kpi_history CASCADE;
DROP TABLE IF EXISTS industry_benchmarks CASCADE;
DROP TABLE IF EXISTS brand_assets CASCADE;
DROP TABLE IF EXISTS planning_dialogue_parts CASCADE;
DROP TABLE IF EXISTS planning_exports CASCADE;
DROP TABLE IF EXISTS planning_sessions CASCADE;
DROP TABLE IF EXISTS planning_templates CASCADE;
DROP TABLE IF EXISTS priority_allocation CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS approval_comments CASCADE;
DROP TABLE IF EXISTS approval_decisions CASCADE;
DROP TABLE IF EXISTS approval_items CASCADE;
DROP TABLE IF EXISTS approval_workflows CASCADE;
DROP TABLE IF EXISTS client_insights CASCADE;
DROP TABLE IF EXISTS analytics_snapshots CASCADE;

-- 9) Remove trigger that creates agents for clients (no longer needed)
DROP TRIGGER IF EXISTS create_agent_for_new_client ON clients;
