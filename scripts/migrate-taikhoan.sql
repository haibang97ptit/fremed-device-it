-- =============================================
-- Migration: Tài khoản IT → Hệ thống + Tài khoản
-- Chạy 1 lần trên PostgreSQL database
-- =============================================

-- 1. Bảng hệ thống (server, phần mềm, thiết bị)
CREATE TABLE IF NOT EXISTS it_systems (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    type        VARCHAR(50) DEFAULT 'server',   -- server | software | device | other
    parent_id   INTEGER REFERENCES it_systems(id) ON DELETE CASCADE,
    description VARCHAR(500),
    ip_address  VARCHAR(100),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trg_it_systems_updated
    BEFORE UPDATE ON it_systems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Bảng tài khoản (nhiều tài khoản cho 1 hệ thống)
CREATE TABLE IF NOT EXISTS it_accounts (
    id          SERIAL PRIMARY KEY,
    system_id   INTEGER NOT NULL REFERENCES it_systems(id) ON DELETE CASCADE,
    tai_khoan   VARCHAR(255) NOT NULL,
    mat_khau    VARCHAR(255),
    role        VARCHAR(100) DEFAULT 'admin',   -- admin | user | viewer | service
    ghi_chu     VARCHAR(500),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trg_it_accounts_updated
    BEFORE UPDATE ON it_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Migrate dữ liệu cũ (nếu có)
-- Tạo 1 system cho mỗi thiet_bi duy nhất, rồi gắn account vào
INSERT INTO it_systems (name, type)
SELECT DISTINCT thiet_bi, 'device'
FROM tai_khoan_tb
WHERE thiet_bi IS NOT NULL AND thiet_bi != ''
ON CONFLICT DO NOTHING;

INSERT INTO it_accounts (system_id, tai_khoan, mat_khau, ghi_chu)
SELECT s.id, t.tai_khoan, t.mat_khau, t.ghi_chu
FROM tai_khoan_tb t
JOIN it_systems s ON s.name = t.thiet_bi
WHERE t.tai_khoan IS NOT NULL;

-- Done! Bảng tai_khoan_tb cũ vẫn giữ lại, không xóa.
