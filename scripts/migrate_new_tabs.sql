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
