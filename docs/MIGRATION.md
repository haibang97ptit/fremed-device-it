# Fremed Device Manager — Hướng dẫn Migration Data

## Tổng quan

Schema PostgreSQL mới được thiết kế **tương thích hoàn toàn** với MySQL cũ:

| MySQL cũ (gagnnyox_device) | PostgreSQL mới | Ghi chú |
|---|---|---|
| `device_phongban` | `phongban` | Giữ nguyên id, name |
| `device_loaimay` | `loaimay` | Giữ nguyên id, idban, name |
| `device_it` | `device_it` | Thêm cột `ip_address` mới |
| `device_card` | `device_card` | Giữ nguyên |
| `device_ip` | `device_ip` | Giữ nguyên |
| `device_users` | `users` | Password cần hash lại |
| `device_qc` | ❌ Bỏ | Không dùng nữa |

---

## Cách 1: Export SQL từ phpMyAdmin (khuyến nghị)

### Bước 1 — Export từ web cũ
1. Vào phpMyAdmin → chọn database `gagnnyox_device`
2. Click tab **Export**
3. Chọn format: **SQL**
4. Trong "Tables": bỏ chọn `device_qc` (không cần migrate)
5. Click **Go** → tải về file `dump.sql`

### Bước 2 — Chạy migration
```bash
cd scripts/
npm install pg csv-parse bcrypt

# Đảm bảo PostgreSQL đang chạy
docker-compose up -d postgres

# Chạy migrate
node migrate.js --sql path/to/dump.sql
```

---

## Cách 2: Export CSV từ phpMyAdmin

### Bước 1 — Export từng bảng
Với mỗi bảng dưới đây, vào phpMyAdmin → chọn bảng → tab **Export** → format **CSV**:

- `device_phongban` → lưu thành `device_phongban.csv`
- `device_loaimay` → lưu thành `device_loaimay.csv`
- `device_it` → lưu thành `device_it.csv`
- `device_card` → lưu thành `device_card.csv`
- `device_ip` → lưu thành `device_ip.csv`

### Bước 2 — Chạy migration
```bash
# Đặt tất cả file CSV vào 1 folder, ví dụ: ./csv-data/
node migrate.js --csv ./csv-data/
```

---

## Kiểm tra sau migration

```sql
-- Kết nối PostgreSQL
psql -U fremed -d fremed_device

-- Kiểm tra số lượng bản ghi
SELECT 'phongban'   AS tbl, COUNT(*) FROM phongban
UNION ALL
SELECT 'loaimay',   COUNT(*) FROM loaimay
UNION ALL
SELECT 'device_it', COUNT(*) FROM device_it
UNION ALL
SELECT 'device_card', COUNT(*) FROM device_card
UNION ALL
SELECT 'device_ip', COUNT(*) FROM device_ip;
```

---

## Lưu ý quan trọng

- **Password users**: Script không migrate password cũ (MD5) sang mới (bcrypt).
  Sau migration, admin vào trang web mới và đổi password lại.
- **Ngày `0000-00-00`**: MySQL cho phép ngày này nhưng PostgreSQL không.
  Script tự động convert sang `NULL`.
- **ID sequences**: Script tự động sync lại sequence sau khi insert để tránh conflict khi thêm mới.
- **Cột `ip_address` trong `device_it`**: Cột mới, mặc định `NULL` sau migrate.
  Anh có thể cập nhật IP cho từng thiết bị trong web mới.
