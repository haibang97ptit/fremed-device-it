-- ============================================================
-- Migration: Insert dữ liệu Tài khoản IT (idempotent - chạy lại không bị duplicate)
-- Chạy: docker exec -i fremed_db psql -U fremed -d fremed_device < scripts/create-account-system.sql
-- ============================================================

-- 1. Thêm hệ thống cha
INSERT INTO it_systems (name, type, description, ip_address)
SELECT * FROM (VALUES
  ('CMi 1200- PN18146', 'device', 'Máy trộn bồn lớn-0007PR', '10.1.200.244'),
  ('HSG PRO 200- PN18148', 'device', 'Máy trộn cao tốc-0009PR', '10.1.200.245'),
  ('GFB PRO 30 - PN18150', 'device', 'Máy sấy tầng sôi-0011PR', '10.1.200.246'),
  ('CMi 400- PN18153', 'device', 'Máy trộn bồn nhỏ-0013PR', '10.1.200.247'),
  ('Fette 2020', 'device', 'Máy dập viên lớn-0017PR', '10.1.200.238'),
  ('Fette 1010', 'device', 'Máy dập viên lớn-0017PR', '10.1.200.239'),
  ('BMAX', 'device', 'Máy ép vỉ BMAX-0020PR', '10.1.200.71'),
  ('CP250', 'device', 'Máy ép vỉ CP250-0021PR', '10.1.200.72'),
  ('Empower server', 'server', 'Hệ thống Empower', '10.1.12.11'),
  ('FTIR server', 'server', 'Hệ thống FTIR', '10.1.17.2'),
  ('LABX server', 'server', 'Hệ thống LABX', '10.1.17.4')
) AS v(name, type, description, ip_address)
WHERE NOT EXISTS (SELECT 1 FROM it_systems s WHERE s.ip_address = v.ip_address);

-- 2. Thêm hệ thống con
INSERT INTO it_systems (name, type, parent_id, description)
SELECT v.name, v.type, (SELECT id FROM it_systems WHERE ip_address = v.parent_ip), v.description
FROM (VALUES
  ('Glatt', 'software', '10.1.200.244', 'Phần mềm Glatt'),
  ('Glatt', 'software', '10.1.200.245', 'Phần mềm Glatt'),
  ('Glatt', 'software', '10.1.200.246', 'Phần mềm Glatt'),
  ('Glatt', 'software', '10.1.200.247', 'Phần mềm Glatt'),
  ('Empower', 'software', '10.1.12.11', 'Phần mềm Empower'),
  ('Spectroscopy Config Manager', 'software', '10.1.17.2', 'Phần mềm FTIR'),
  ('LABX', 'software', '10.1.17.4', 'Phần mềm LABX')
) AS v(name, type, parent_ip, description)
WHERE NOT EXISTS (
  SELECT 1 FROM it_systems s 
  WHERE s.name = v.name 
    AND s.parent_id = (SELECT id FROM it_systems WHERE ip_address = v.parent_ip)
);

-- 3. Thêm tài khoản
INSERT INTO it_accounts (system_id, tai_khoan, mat_khau, role, ghi_chu)
SELECT (SELECT id FROM it_systems WHERE ip_address = v.ip), v.tai_khoan, v.mat_khau, v.role, v.ghi_chu
FROM (VALUES
  ('10.1.200.244', 'autolog', 'autolog', 'admin', 'Remote Desktop'),
  ('10.1.200.245', 'autolog', 'autolog', 'admin', 'Remote Desktop'),
  ('10.1.200.246', 'autolog', 'autolog', 'admin', 'Remote Desktop'),
  ('10.1.200.247', 'autolog', 'autolog', 'admin', 'Remote Desktop'),
  ('10.1.200.238', 'haibang.nguyen', '..6..', 'admin', 'NA'),
  ('10.1.200.239', 'haibang.nguyen', '..6..', 'admin', 'NA'),
  ('10.1.200.71', 'haibang.nguyen', '..7..', 'admin', 'NA'),
  ('10.1.200.72', 'haibang.nguyen', '..7..', 'admin', 'NA'),
  ('10.1.12.11', 'haibang.nguyen', '..8..', 'admin', 'NA'),
  ('10.1.17.2', 'Administrator', '2021...2023', 'admin', 'NA'),
  ('10.1.17.4', 'haibang.nguyen', '2021...2023', 'admin', 'NA')
) AS v(ip, tai_khoan, mat_khau, role, ghi_chu)
WHERE NOT EXISTS (
  SELECT 1 FROM it_accounts a 
  WHERE a.system_id = (SELECT id FROM it_systems WHERE ip_address = v.ip)
    AND a.tai_khoan = v.tai_khoan
);
-- 4. Thêm tài khoản cho hệ thống con
INSERT INTO it_accounts (system_id, tai_khoan, mat_khau, role, ghi_chu)
SELECT s.id, v.tai_khoan, v.mat_khau, v.role, v.ghi_chu
FROM (VALUES
  ('Glatt', '10.1.200.244', 'haibang.nguyen', '..6..', 'admin', 'Pharmacist'),
  ('Glatt', '10.1.200.245', 'haibang.nguyen', '..6..', 'admin', 'Pharmacist'),
  ('Glatt', '10.1.200.246', 'haibang.nguyen', '..6..', 'admin', 'Pharmacist'),
  ('Glatt', '10.1.200.247', 'haibang.nguyen', '..6..', 'admin', 'Pharmacist'),
  ('Empower', '10.1.12.11', 'IT_ADMIN', '2021...2023', 'admin', 'ADMIN Empower'),
  ('Empower', '10.1.12.11', 'system', '2021...2030', 'admin', 'ADMIN Empower'),
  ('FTIR', '10.1.17.2', 'Administrator', '2021...2023', 'admin', 'ADMIN FTIR'),
  ('LABX', '10.1.17.4', 'bang_nh', '..7..', 'admin', 'ADMIN LABX')
) AS v(child_name, parent_ip, tai_khoan, mat_khau, role, ghi_chu)
JOIN it_systems s ON s.name = v.child_name
  AND s.parent_id = (SELECT id FROM it_systems WHERE ip_address = v.parent_ip)
WHERE NOT EXISTS (
  SELECT 1 FROM it_accounts a
  WHERE a.system_id = s.id AND a.tai_khoan = v.tai_khoan
);