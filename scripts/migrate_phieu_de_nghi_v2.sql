-- Migration: Add so_pr, truong_phong, soat_xet columns to phieu_de_nghi
-- Run: docker exec -i fremed_db psql -U fremed -d fremed_device < scripts/migrate_phieu_de_nghi_v2.sql

ALTER TABLE phieu_de_nghi ADD COLUMN IF NOT EXISTS so_pr VARCHAR(50);
ALTER TABLE phieu_de_nghi ADD COLUMN IF NOT EXISTS truong_phong VARCHAR(255);
ALTER TABLE phieu_de_nghi ADD COLUMN IF NOT EXISTS soat_xet VARCHAR(255);
