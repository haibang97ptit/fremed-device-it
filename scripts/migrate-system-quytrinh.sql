CREATE TABLE IF NOT EXISTS system_quy_trinh (
    id SERIAL PRIMARY KEY,
    system_id INTEGER NOT NULL REFERENCES it_systems(id) ON DELETE CASCADE,
    quy_trinh_id INTEGER NOT NULL REFERENCES quy_trinh(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(system_id, quy_trinh_id)
);