-- ============================================================
-- Migration: Thêm cột deadline vào bảng tasks
-- Chạy: docker exec -i fremed_db psql -U fremed -d fremed_device < scripts/migrate_tasks_deadline.sql
-- ============================================================

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline DATE;
