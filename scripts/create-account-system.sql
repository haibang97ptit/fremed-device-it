-- ============================================================
-- Migration: Insert dữ liệu Tài khoản IT
-- Chạy: docker exec -i fremed_db psql -U fremed -d fremed_device < scripts/create-account-system.sql 

-- ============================================================

-- 1. Thêm hệ thống cha (server, thiết bị)
INSERT INTO it_systems (name, type, description, ip_address) VALUES
  ('CMi 1200- PN18146', 'device', 'Máy trộn bồn lớn-0007PR', '10.1.200.244'),
  ('HSG PRO 200- PN18148', 'device', 'Máy trộn cao tốc-0009PR', '10.1.200.245'),
  ('HSG PRO 200- PN18148', 'device', 'Máy sấy tầng sôi-0011PR', '10.1.200.246'),
  ('CMi 400- PN18153', 'device', 'Máy trộn bồn nhỏ-0013PR', '10.1.200.247'),
  ('Fette 2020', 'device', 'Máy dập viên lớn-0017PR', '10.1.200.238'),
  ('Fette 1010', 'device', 'Máy dập viên lớn-0017PR', '10.1.200.239'),
  ('BMAX', 'device', 'Máy ép vỉ BMAX-0020PR', '10.1.200.71'),
  ('CP250', 'device', 'Máy ép vỉ CP250-0021PR', '10.1.200.72');

-- 2. Thêm hệ thống con (phần mềm bên trong server)
-- parent_id = ID của server cha, dùng subquery để tự tìm
INSERT INTO it_systems (name, type, parent_id, description) VALUES
  ('Glatt', 'device', (SELECT id FROM it_systems WHERE ip_address = '10.1.200.244'), 'Phần mềm Glatt'),
  ('Glatt', 'device', (SELECT id FROM it_systems WHERE ip_address = '10.1.200.245'), 'Phần mềm Glatt'),
  ('Glatt', 'device', (SELECT id FROM it_systems WHERE ip_address = '10.1.200.246'), 'Phần mềm Glatt'),
  ('Glatt', 'device', (SELECT id FROM it_systems WHERE ip_address = '10.1.200.247'), 'Phần mềm Glatt');
-- 3. Thêm tài khoản
-- system_id dùng subquery tìm theo tên hệ thống
INSERT INTO it_accounts (system_id, tai_khoan, mat_khau, role, ghi_chu) VALUES
  ((SELECT id FROM it_systems WHERE ip_address = '10.1.200.244'), 'autolog', 'autolog', 'admin', 'Remote Desktop'),
  ((SELECT id FROM it_systems WHERE ip_address = '10.1.200.245'), 'autolog', 'autolog', 'admin', 'Remote Desktop'),
  ((SELECT id FROM it_systems WHERE ip_address = '10.1.200.246'), 'autolog', 'autolog', 'admin', 'Remote Desktop'),
  ((SELECT id FROM it_systems WHERE ip_address = '10.1.200.247'), 'autolog', 'autolog', 'admin', 'Remote Desktop'),
  ((SELECT id FROM it_systems WHERE ip_address = '10.1.200.238'), 'haibang.nguyen', '..6..', 'admin', 'NA'),
  ((SELECT id FROM it_systems WHERE ip_address = '10.1.200.239'), 'haibang.nguyen', '..6..', 'admin', 'NA'),
  ((SELECT id FROM it_systems WHERE ip_address = '10.1.200.71'), 'haibang.nguyen', '..7..', 'admin', 'NA'),
  ((SELECT id FROM it_systems WHERE ip_address = '10.1.200.72'), 'haibang.nguyen', '..7..', 'admin', 'NA');



