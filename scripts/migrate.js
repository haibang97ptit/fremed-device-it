#!/usr/bin/env node
/**
 * FREMED - Migration Script
 * Migrate data từ MySQL (web cũ) sang PostgreSQL (web mới)
 *
 * Hỗ trợ 2 cách:
 *   1. node migrate.js --sql dump.sql
 *   2. node migrate.js --csv ./csv-folder/
 *
 * Cách dùng:
 *   npm install pg csv-parse bcrypt
 *   node migrate.js --sql dump.sql
 */

const fs   = require('fs');
const path = require('path');
const { Client } = require('pg');

const PG_CONFIG = {
  host:     process.env.PG_HOST     || 'localhost',
  port:     parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DB       || 'fremed_device',
  user:     process.env.PG_USER     || 'fremed',
  password: process.env.PG_PASSWORD || 'fremed@2025',
};

const args = process.argv.slice(2);
const mode = args[0]; // --sql hoặc --csv
const src  = args[1]; // đường dẫn file hoặc folder

// ============================================================
// MODE 1: Migrate từ file SQL dump của phpMyAdmin
// ============================================================
async function migrateFromSQL(sqlFile) {
  console.log(`\n📂 Đọc file SQL: ${sqlFile}`);
  const sql = fs.readFileSync(sqlFile, 'utf8');

  const client = new Client(PG_CONFIG);
  await client.connect();
  console.log('✅ Kết nối PostgreSQL thành công\n');

  try {
    // Parse INSERT statements từ MySQL dump
    const tables = {
      phongban:    extractInserts(sql, 'device_phongban'),
      loaimay:     extractInserts(sql, 'device_loaimay'),
      device_it:   extractInserts(sql, 'device_it'),
      device_card: extractInserts(sql, 'device_card'),
      device_ip:   extractInserts(sql, 'device_ip'),
      users:       extractInserts(sql, 'device_users'),
    };

    await client.query('BEGIN');

    // 1. Phòng ban
    console.log(`📋 Migrate phòng ban: ${tables.phongban.length} bản ghi`);
    for (const row of tables.phongban) {
      await client.query(
        `INSERT INTO phongban (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
        [row.id, row.name]
      );
    }

    // Sync sequence
    if (tables.phongban.length > 0) {
      await client.query(`SELECT setval('phongban_id_seq', (SELECT MAX(id) FROM phongban))`);
    }

    // 2. Loại máy
    console.log(`🖥️  Migrate loại máy: ${tables.loaimay.length} bản ghi`);
    for (const row of tables.loaimay) {
      await client.query(
        `INSERT INTO loaimay (id, idban, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
        [row.id, row.idban || null, row.name]
      );
    }
    if (tables.loaimay.length > 0) {
      await client.query(`SELECT setval('loaimay_id_seq', (SELECT MAX(id) FROM loaimay))`);
    }

    // Thu thập ID hợp lệ để validate foreign key
    const validBan = new Set((await client.query('SELECT id FROM phongban')).rows.map(r => r.id.toString()));
    const validMay = new Set((await client.query('SELECT id FROM loaimay')).rows.map(r => r.id.toString()));
    const fk = (val, validSet) => (val && val !== '0' && validSet.has(val)) ? val : null;

    // 3. Thiết bị IT
    console.log(`💻 Migrate thiết bị IT: ${tables.device_it.length} bản ghi`);
    for (const row of tables.device_it) {
      await client.query(
        `INSERT INTO device_it (id, idmay, idban, name, service_tag, express_code, mac_address, ngay_mua, details, tinh_trang)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO NOTHING`,
        [
          row.id,
          fk(row.idmay, validMay),
          fk(row.idban, validBan),
          row.name    || null,
          row.service_tag   || null,
          row.express_code  || null,
          row.mac_address   || null,
          row.ngay_mua && row.ngay_mua !== '0000-00-00' ? row.ngay_mua : null,
          row.details   || null,
          row.tinh_trang || null,
        ]
      );
    }
    if (tables.device_it.length > 0) {
      await client.query(`SELECT setval('device_it_id_seq', (SELECT MAX(id) FROM device_it))`);
    }

    // 4. Thẻ từ
    console.log(`🪪  Migrate thẻ từ: ${tables.device_card.length} bản ghi`);
    for (const row of tables.device_card) {
      await client.query(
        `INSERT INTO device_card (id, idban, card, name) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
        [row.id, fk(row.idban, validBan), row.card || null, row.name || null]
      );
    }
    if (tables.device_card.length > 0) {
      await client.query(`SELECT setval('device_card_id_seq', (SELECT MAX(id) FROM device_card))`);
    }

    // 5. IP tĩnh
    console.log(`🌐 Migrate IP tĩnh: ${tables.device_ip.length} bản ghi`);
    for (const row of tables.device_ip) {
      await client.query(
        `INSERT INTO device_ip (id, idban, ip, name, vlan) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
        [row.id, fk(row.idban, validBan), row.ip || null, row.name || null, row.vlan || null]
      );
    }
    if (tables.device_ip.length > 0) {
      await client.query(`SELECT setval('device_ip_id_seq', (SELECT MAX(id) FROM device_ip))`);
    }

    await client.query('COMMIT');
    console.log('\n🎉 Migration hoàn thành!');
    printSummary(tables);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Lỗi migration:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

// ============================================================
// MODE 2: Migrate từ CSV files
// ============================================================
async function migrateFromCSV(csvFolder) {
  const { parse } = require('csv-parse/sync');
  console.log(`\n📂 Đọc CSV từ folder: ${csvFolder}\n`);

  const readCSV = (filename) => {
    const filepath = path.join(csvFolder, filename);
    if (!fs.existsSync(filepath)) {
      console.warn(`  ⚠️  Không tìm thấy: ${filename} — bỏ qua`);
      return [];
    }
    const content = fs.readFileSync(filepath, 'utf8');
    return parse(content, { columns: true, skip_empty_lines: true, trim: true });
  };

  const client = new Client(PG_CONFIG);
  await client.connect();
  console.log('✅ Kết nối PostgreSQL thành công\n');

  try {
    await client.query('BEGIN');

    // Đọc CSV — tên file theo tên bảng MySQL cũ
    const phongban  = readCSV('device_phongban.csv');
    const loaimay   = readCSV('device_loaimay.csv');
    const deviceIT  = readCSV('device_it.csv');
    const cards     = readCSV('device_card.csv');
    const ips       = readCSV('device_ip.csv');

    console.log(`📋 Migrate phòng ban: ${phongban.length} bản ghi`);
    for (const row of phongban) {
      await client.query(
        `INSERT INTO phongban (id, name) VALUES ($1,$2) ON CONFLICT (id) DO NOTHING`,
        [row.id, row.name]
      );
    }
    if (phongban.length) await client.query(`SELECT setval('phongban_id_seq', (SELECT MAX(id) FROM phongban))`);

    console.log(`🖥️  Migrate loại máy: ${loaimay.length} bản ghi`);
    for (const row of loaimay) {
      await client.query(
        `INSERT INTO loaimay (id, idban, name) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING`,
        [row.id, row.idban || null, row.name]
      );
    }
    if (loaimay.length) await client.query(`SELECT setval('loaimay_id_seq', (SELECT MAX(id) FROM loaimay))`);

    console.log(`💻 Migrate thiết bị IT: ${deviceIT.length} bản ghi`);
    for (const row of deviceIT) {
      await client.query(
        `INSERT INTO device_it (id,idmay,idban,name,service_tag,express_code,mac_address,ngay_mua,details,tinh_trang)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
        [
          row.id, row.idmay||null, row.idban||null, row.name||null,
          row.service_tag||null, row.express_code||null, row.mac_address||null,
          (row.ngay_mua && row.ngay_mua !== '0000-00-00') ? row.ngay_mua : null,
          row.details||null, row.tinh_trang||null
        ]
      );
    }
    if (deviceIT.length) await client.query(`SELECT setval('device_it_id_seq', (SELECT MAX(id) FROM device_it))`);

    console.log(`🪪  Migrate thẻ từ: ${cards.length} bản ghi`);
    for (const row of cards) {
      await client.query(
        `INSERT INTO device_card (id,idban,card,name) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
        [row.id, row.idban||null, row.card||null, row.name||null]
      );
    }
    if (cards.length) await client.query(`SELECT setval('device_card_id_seq', (SELECT MAX(id) FROM device_card))`);

    console.log(`🌐 Migrate IP tĩnh: ${ips.length} bản ghi`);
    for (const row of ips) {
      await client.query(
        `INSERT INTO device_ip (id,idban,ip,name,vlan) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
        [row.id, row.idban||null, row.ip||null, row.name||null, row.vlan||null]
      );
    }
    if (ips.length) await client.query(`SELECT setval('device_ip_id_seq', (SELECT MAX(id) FROM device_ip))`);

    await client.query('COMMIT');
    console.log('\n🎉 Migration hoàn thành!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Lỗi migration:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

// ============================================================
// Helper: parse INSERT statements từ MySQL dump
// Xử lý đúng cả dấu ngoặc () và quote '' bên trong giá trị
// ============================================================
function extractInserts(sql, tableName) {
  const results = [];

  // Tìm tất cả INSERT INTO cho bảng này
  const insertRegex = new RegExp(
    `INSERT INTO \\x60?${tableName}\\x60?\\s*\\(([^)]+)\\)\\s*VALUES\\s*`,
    'gi'
  );

  let insertMatch;
  while ((insertMatch = insertRegex.exec(sql)) !== null) {
    const columns = insertMatch[1].split(',').map(c => c.trim().replace(/`/g, ''));
    let pos = insertMatch.index + insertMatch[0].length;

    // Parse từng row (x, y, z), (a, b, c), ...;
    while (pos < sql.length) {
      // Bỏ qua whitespace và dấu phẩy giữa các rows
      while (pos < sql.length && (sql[pos] === ' ' || sql[pos] === '\n' || sql[pos] === '\r' || sql[pos] === ',')) pos++;

      if (pos >= sql.length || sql[pos] === ';') break;
      if (sql[pos] !== '(') break;

      // Tìm dấu ')' đóng đúng — bỏ qua ngoặc bên trong string
      pos++; // skip mở '('
      const values = [];
      let current = '';
      let inStr = false;

      while (pos < sql.length) {
        const ch = sql[pos];

        if (inStr) {
          if (ch === "'" && sql[pos + 1] === "'") {
            current += "'"; pos += 2; continue;   // escaped quote ''
          }
          if (ch === "'") {
            inStr = false; pos++; continue;        // đóng string
          }
          if (ch === '\\' && sql[pos + 1]) {
            current += sql[pos + 1]; pos += 2; continue; // escaped char
          }
          current += ch; pos++; continue;
        }

        // Không trong string
        if (ch === "'") { inStr = true; pos++; continue; }
        if (ch === ',') { values.push(current.trim()); current = ''; pos++; continue; }
        if (ch === ')') { values.push(current.trim()); pos++; break; }
        current += ch; pos++;
      }

      // Map values vào columns
      const row = {};
      columns.forEach((col, i) => {
        const v = values[i];
        row[col] = (!v || v === 'NULL') ? null : v;
      });
      results.push(row);
    }
  }
  return results;
}

function printSummary(tables) {
  console.log('\n📊 Tổng kết:');
  Object.entries(tables).forEach(([k, v]) => {
    console.log(`   ${k.padEnd(15)} → ${v.length} bản ghi`);
  });
}

// ============================================================
// Entry point
// ============================================================
if (!mode || !src) {
  console.log(`
FREMED Migration Tool
=====================
Cách dùng:
  node migrate.js --sql  path/to/dump.sql
  node migrate.js --csv  path/to/csv-folder/

CSV folder cần có các file:
  device_phongban.csv
  device_loaimay.csv
  device_it.csv
  device_card.csv
  device_ip.csv

Biến môi trường (tuỳ chọn):
  PG_HOST, PG_PORT, PG_DB, PG_USER, PG_PASSWORD
`);
  process.exit(0);
}

if (mode === '--sql')      migrateFromSQL(src).catch(() => process.exit(1));
else if (mode === '--csv') migrateFromCSV(src).catch(() => process.exit(1));
else { console.error('❌ Mode không hợp lệ. Dùng --sql hoặc --csv'); process.exit(1); }
