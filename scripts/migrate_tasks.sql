-- ============================================================
-- Migration: Tasks (Daily + QA)
-- Chạy: docker exec -i fremed_db psql -U fremed -d fremed_device < scripts/migrate_tasks.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS tasks (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    task_type   VARCHAR(20) NOT NULL DEFAULT 'daily',   -- daily | qa
    status      VARCHAR(20) NOT NULL DEFAULT 'todo',    -- todo | doing | done
    task_date   DATE DEFAULT CURRENT_DATE,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

DROP TRIGGER IF EXISTS trg_tasks_updated ON tasks;
CREATE TRIGGER trg_tasks_updated
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
