-- ============================================================
-- FREMED DEVICE MANAGER - PostgreSQL Schema
-- Thiết kế tương thích với MySQL schema cũ (gagnnyox_device)
-- để hỗ trợ migrate data không cần nhập tay
-- ============================================================

-- Bảng phòng ban (tương đương device_phongban)
CREATE TABLE IF NOT EXISTS phongban (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE
);

-- Bảng loại máy (tương đương device_loaimay)
-- idban trong schema cũ = id phòng ban (dùng để lọc loại máy theo phòng)
CREATE TABLE IF NOT EXISTS loaimay (
    id          SERIAL PRIMARY KEY,
    idban       INTEGER REFERENCES phongban(id) ON DELETE SET NULL,
    name        VARCHAR(100) NOT NULL
);

-- Bảng thiết bị IT (tương đương device_it)
-- Giữ nguyên tên cột để migration script dễ map
CREATE TABLE IF NOT EXISTS device_it (
    id              SERIAL PRIMARY KEY,
    idmay           INTEGER REFERENCES loaimay(id) ON DELETE SET NULL,   -- loại máy
    idban           INTEGER REFERENCES phongban(id) ON DELETE SET NULL,  -- phòng ban
    name            VARCHAR(255),           -- tên nhân viên sử dụng
    service_tag     VARCHAR(30),
    express_code    VARCHAR(30),
    mac_address     VARCHAR(30),
    ngay_mua        DATE,
    details         VARCHAR(255),
    tinh_trang      VARCHAR(100),
    ip_address      VARCHAR(50),            -- cột mới: IP của thiết bị (để ping)
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Bảng thẻ từ (tương đương device_card)
CREATE TABLE IF NOT EXISTS device_card (
    id          SERIAL PRIMARY KEY,
    idban       INTEGER REFERENCES phongban(id) ON DELETE SET NULL,
    card        VARCHAR(255),               -- mã thẻ / ID card
    name        VARCHAR(255),              -- tên nhân viên
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- Bảng IP tĩnh (tương đương device_ip)
CREATE TABLE IF NOT EXISTS device_ip (
    id          SERIAL PRIMARY KEY,
    idban       INTEGER REFERENCES phongban(id) ON DELETE SET NULL,
    ip          VARCHAR(255),
    name        VARCHAR(255),              -- tên thiết bị / mô tả
    vlan        VARCHAR(255),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- Bảng users (tương đương device_users)
-- Password sẽ được hash lại khi migrate
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,      -- bcrypt hash
    phongban    VARCHAR(10),
    block       SMALLINT DEFAULT 0,         -- 0: active, 1: blocked
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Bảng lưu lịch sử ping (tính năng mới)
CREATE TABLE IF NOT EXISTS ping_history (
    id          SERIAL PRIMARY KEY,
    device_id   INTEGER REFERENCES device_it(id) ON DELETE CASCADE,
    ip_address  VARCHAR(50) NOT NULL,
    status      VARCHAR(10) NOT NULL,       -- 'online' | 'offline'
    latency_ms  FLOAT,
    checked_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEX để tăng tốc query
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_device_it_idban   ON device_it(idban);
CREATE INDEX IF NOT EXISTS idx_device_it_idmay   ON device_it(idmay);
CREATE INDEX IF NOT EXISTS idx_device_card_idban ON device_card(idban);
CREATE INDEX IF NOT EXISTS idx_device_ip_idban   ON device_ip(idban);
CREATE INDEX IF NOT EXISTS idx_ping_device_id    ON ping_history(device_id);
CREATE INDEX IF NOT EXISTS idx_ping_checked_at   ON ping_history(checked_at DESC);

-- ============================================================
-- FUNCTION tự động cập nhật updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_device_it_updated
    BEFORE UPDATE ON device_it
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_device_card_updated
    BEFORE UPDATE ON device_card
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_device_ip_updated
    BEFORE UPDATE ON device_ip
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DEFAULT ADMIN USER (password: Admin@123 - đổi sau khi login)
-- bcrypt hash của "Admin@123"
-- ============================================================
INSERT INTO users (username, password, phongban, block)
VALUES ('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVdRCkjcne', 'IT', 0)
ON CONFLICT (username) DO NOTHING;
-- ============================================================
-- FREMED - Migration: 3 tab mới
-- Chạy sau init.sql
-- ============================================================

-- 1. Quy trình IT
CREATE TABLE IF NOT EXISTS quy_trinh (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    file_name   VARCHAR(255),
    file_path   VARCHAR(500),
    file_type   VARCHAR(50),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- 2. Tài khoản thiết bị
CREATE TABLE IF NOT EXISTS tai_khoan_tb (
    id          SERIAL PRIMARY KEY,
    thiet_bi    VARCHAR(255) NOT NULL,
    tai_khoan   VARCHAR(255),
    mat_khau    VARCHAR(255),
    ghi_chu     VARCHAR(500),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- 3. Phiếu đề nghị
CREATE TABLE IF NOT EXISTS phieu_de_nghi (
    id              SERIAL PRIMARY KEY,
    nguoi_de_nghi   VARCHAR(255),
    phong_ban       VARCHAR(255),
    items           JSONB NOT NULL DEFAULT '[]',
    ngay_can_su_dung DATE,
    noi_dung        TEXT,
    file_path       VARCHAR(500),
    trang_thai      VARCHAR(50) DEFAULT 'Chờ duyệt',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Triggers
CREATE TRIGGER trg_quy_trinh_updated
    BEFORE UPDATE ON quy_trinh
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tai_khoan_tb_updated
    BEFORE UPDATE ON tai_khoan_tb
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_phieu_de_nghi_updated
    BEFORE UPDATE ON phieu_de_nghi
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
